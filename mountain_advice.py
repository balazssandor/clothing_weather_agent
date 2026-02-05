import json
import os
from datetime import date, timedelta
from typing import List
from main import query_model
from weather import _get_tomorrow_weather_report_internal, HourlyForecastPoint, TomorrowWindowSummary, wind_chill_with_gusts
from rich.console import Console
from rich.markdown import Markdown
from s3_uploader import upload_directory_to_s3, configure_bucket_cors, configure_bucket_policy


def _enrich_hourly_point(point: HourlyForecastPoint) -> dict:
    """Convert HourlyForecastPoint to dict and add temperature_feel field."""
    data = point.__dict__.copy()
    # Calculate feels-like temperature using wind chill with gusts
    data['temperature_feel'] = wind_chill_with_gusts(
        point.temperature,
        point.wind_speed,
        point.wind_gusts
    )
    return data


def _determine_temp_range(temp_feel_min: float, temp_feel_max: float) -> str:
    """Determine temperature range key based on min/max feels-like temperature."""
    # Use the most conservative (coldest) value for safety
    temp = min(temp_feel_min, temp_feel_max)

    if temp < -20:
        return "below_-20"
    elif temp < -10:
        return "-20_to_-10"
    elif temp < 0:
        return "-10_to_0"
    elif temp < 10:
        return "0_to_10"
    else:
        return "above_10"


def _generate_clothing_advice_from_json(points: List[HourlyForecastPoint], location: dict, is_snowy: bool, language: str = 'en') -> str:
    """Generate clothing advice from clothing_per_temp_feel_{language}.json based on actual conditions.

    Args:
        points: List of hourly forecast data points
        location: Location dictionary
        is_snowy: Whether precipitation is snow
        language: Language code ('en', 'ro', 'hu')
    """

    # Load clothing reference data for the specified language
    if language in ['ro', 'hu']:
        json_filename = f'clothing_per_temp_feel_{language}.json'
    else:
        json_filename = 'clothing_per_temp_feel.json'  # Default to English

    with open(json_filename, 'r', encoding='utf-8') as f:
        clothing_data = json.load(f)

    # Enrich points and get temperature_feel values
    enriched = [_enrich_hourly_point(p) for p in points]
    temp_feels = [p['temperature_feel'] for p in enriched]
    temp_feel_min = min(temp_feels)
    temp_feel_max = max(temp_feels)
    temp_feel_avg = sum(temp_feels) / len(temp_feels)

    # Check for precipitation
    total_precip = sum(p.precipitation for p in points)
    has_heavy_snow = is_snowy and total_precip > 5
    has_wet_precip = total_precip > 3 and not is_snowy

    # Determine temperature range
    temp_range_key = _determine_temp_range(temp_feel_min, temp_feel_max)

    # Find the matching temperature interval
    temp_interval = None
    for interval in clothing_data['clothing']['temperature_feel_intervals_celsius']:
        if interval['range'] == temp_range_key:
            temp_interval = interval
            break

    if not temp_interval:
        return "Unable to determine clothing recommendations."

    # Build markdown output
    lines = []

    # Temperature context
    lines.append(f"**Temperature (feels like): {temp_feel_min:.1f}°C to {temp_feel_max:.1f}°C** (avg: {temp_feel_avg:.1f}°C)")
    lines.append("")

    # Base layers
    lines.append("**Base Layers:**")
    lines.append(f"- Torso: {temp_interval['base_layer']['torso']}")
    lines.append(f"- Legs: {temp_interval['base_layer']['legs']}")
    lines.append("")

    # Mid layers
    lines.append("**Mid Layers:**")
    lines.append(f"- Active: {temp_interval['mid_layers']['active']}")
    lines.append(f"- Static/Stops: {temp_interval['mid_layers']['static_extra']}")
    lines.append("")

    # Outer layers
    lines.append("**Outer Layers:**")
    lines.append(f"- Jacket: {temp_interval['outer_layers']['required_windstopper']}")
    lines.append(f"- Legs: {temp_interval['outer_layers']['legs']}")
    lines.append("")

    # Accessories
    lines.append("**Accessories:**")
    lines.append(f"- Hands: {temp_interval['accessories']['hands']}")
    lines.append(f"- Head/Face: {temp_interval['accessories']['head_face']}")
    if 'notes' in temp_interval['accessories']:
        lines.append(f"- Notes: {temp_interval['accessories']['notes']}")
    lines.append("")

    # Always carried items
    lines.append("**Always Carried (Core):**")
    for category, items in clothing_data['clothing']['always_carried_core_items'].items():
        category_name = category.replace('_', ' ').title()
        lines.append(f"- {category_name}: {', '.join(items)}")
    lines.append("")

    # Precipitation overrides
    if has_heavy_snow:
        lines.append("**⚠️ Heavy Snow Conditions:**")
        precip_info = clothing_data['clothing']['precipitation_overrides']['heavy_snow']
        for item in precip_info['required_additions']:
            lines.append(f"- {item}")
        lines.append(f"- {precip_info['notes']}")
        lines.append("")
    elif has_wet_precip:
        lines.append("**⚠️ Wet Precipitation (Rain/Wet Snow):**")
        precip_info = clothing_data['clothing']['precipitation_overrides']['wet_snow_or_rain']
        for item in precip_info['required_additions']:
            lines.append(f"- {item}")
        lines.append(f"- {precip_info['notes']}")
        lines.append("")

    # Equipment section
    lines.append("**Essential Equipment:**")
    lines.append("")
    lines.append("*Mandatory Safety (Avalanche):*")
    for item in clothing_data['equipment']['mandatory_safety_kit_3_4']:
        lines.append(f"- {item}")
    lines.append("")

    lines.append("*Ski Touring System:*")
    for item in clothing_data['equipment']['ski_touring_system']:
        lines.append(f"- {item}")
    lines.append("")

    lines.append("*Navigation & Communication:*")
    for item in clothing_data['equipment']['navigation_communication']:
        lines.append(f"- {item}")
    lines.append("")

    lines.append("*Emergency & Repair:*")
    for item in clothing_data['equipment']['emergency_repair']:
        lines.append(f"- {item}")
    lines.append("")

    lines.append("*Food & Hydration:*")
    for item in clothing_data['equipment']['food_hydration']:
        lines.append(f"- {item}")

    return '\n'.join(lines)


def _generate_report_text(points: List[HourlyForecastPoint], summary: TomorrowWindowSummary, location: dict) -> str:
    """Generate a formatted weather report text for the given hourly points."""
    if not points:
        return "No data available"

    # Use data from the summary object passed in
    temp_min = summary.temp_min
    temp_max = summary.temp_max
    precip_total = summary.precip_total
    precip_prob_max = summary.precip_prob_max
    wind_avg = summary.wind_avg
    wind_max = summary.wind_max
    gust_max = summary.gust_max
    dominant_text = summary.dominant_conditions
    timezone = summary.timezone
    dominant_wind_direction = summary.dominant_wind_direction

    lines = []
    lines.append("Hour | Temp | Precip | Precip% | Wind | Gusts | Wind Dir | Conditions")
    lines.append("-----|------|--------|---------|------|-------|----------|-----------")
    for p in points:
        prob_str = f"{p.precipitation_probability:.0f}%" if p.precipitation_probability is not None else "—"
        gust_str = f"{p.wind_gusts:.0f}km/h" if p.wind_gusts is not None else "—"
        wind_dir_str = f"{p.wind_direction:.0f}°" if p.wind_direction is not None else "—"
        lines.append(
            f"{p.hour:02d}:00 | "
            f"{p.temperature:.1f}°C | "
            f"{p.precipitation:.1f}mm | "
            f"{prob_str:>6} | "
            f"{p.wind_speed:.0f}km/h | "
            f"{gust_str:>5} | "
            f"{wind_dir_str:>8} | "
            f"{p.conditions}"
        )

    prob_phrase = (
        f"Peak precipitation chance: {precip_prob_max:.0f}%."
        if precip_prob_max is not None else
        "Precipitation probability not available."
    )
    gust_phrase = ""
    if gust_max is not None:
        gust_phrase = f" Gusts up to {gust_max:.0f}km/h."

    start_hour = points[0].hour
    end_hour = points[-1].hour
    time_window_str = f"{start_hour:02d}:00–{end_hour:02d}:00"

    report = (
        f"Tomorrow (local time: {timezone}), {time_window_str}:\n"
        f"- Dominant conditions: {dominant_text}.\n"
        f"- Temperature: {temp_min:.1f}°C to {temp_max:.1f}°C.\n"
        f"- Precipitation: about {precip_total:.1f}mm total. {prob_phrase}\n"
        f"- Wind: average {wind_avg:.0f}km/h, max {wind_max:.0f}km/h.{gust_phrase}\n"
        f"- Dominant Wind Direction: {dominant_wind_direction:.0f}°\n\n"
        f"Hourly breakdown:\n" + "\n".join(lines)
    )

    return report



def main():
    console = Console()
    print("Generating ski touring clothing advice for mountain locations...")

    with open('mountain_locations.json', 'r') as f:
        mountain_locations = json.load(f)

    # Load equipment reference list
    with open('ski_touring_equipment.json', 'r') as f:
        equipment_data = json.load(f)

    snow_weather_codes = {71, 73, 75, 77, 85, 86}

    tomorrow = date.today() + timedelta(days=1)
    output_dir = os.path.join(
        "tomorrow_mountain_forecast_data",
        f"date={tomorrow.isoformat()}"
    )
    os.makedirs(output_dir, exist_ok=True)

    for loc in mountain_locations:
        print(f"\n--- {loc['name']} ({loc['mountain_range']}, {loc['zone']}) ---")

        base_filename = f"{loc['mountain_range'].replace(' ', '_').lower()}_{loc['zone'].replace(' ', '_')}"
        weather_cache_path = os.path.join(output_dir, f"{base_filename}_weather_data_24h.json")

        # Check if we have cached weather data
        if os.path.exists(weather_cache_path):
            print(f"Loading cached weather data from {weather_cache_path}")
            with open(weather_cache_path, 'r') as f:
                cached_data = json.load(f)
                summary_24h_dict = cached_data['weather_summary']
                
                # Check for 'dominant_wind_direction' to handle older cache formats
                if 'dominant_wind_direction' not in summary_24h_dict:
                    print(f"⚠️  Cached data for {loc['name']} is outdated (missing dominant_wind_direction). Re-fetching from API...")
                    os.remove(weather_cache_path) # Invalidate old cache
                    # Force re-fetch by falling through to the 'else' block
                else:
                    report_24h = cached_data['weather_report_text']
                    # Reconstruct dataclass from dict
                    summary_24h = TomorrowWindowSummary(**summary_24h_dict)
                    # Reconstruct hourly points (remove temperature_feel if present, it will be recalculated)
                    points_24h = []
                    for p in cached_data['hourly_points']:
                        # Remove enriched fields not in dataclass
                        p_clean = {k: v for k, v in p.items() if k != 'temperature_feel'}
                        points_24h.append(HourlyForecastPoint(**p_clean))
        
        # If cache was invalid or didn't exist, fetch new data
        if not os.path.exists(weather_cache_path): # Check again if it was removed
            print("Fetching weather data from API...")
            # Fetch full 24h weather data
            report_24h, summary_24h, points_24h = _get_tomorrow_weather_report_internal(
                loc['latitude'],
                loc['longitude'],
                0,
                23
            )

            # Save weather data immediately to cache
            cache_data = {
                "location_data": loc,
                "weather_report_text": report_24h,
                "weather_summary": summary_24h.__dict__,
                "hourly_points": [_enrich_hourly_point(p) for p in points_24h]
            }
            with open(weather_cache_path, 'w') as f:
                json.dump(cache_data, f, indent=2)
            print(f"Weather data cached to {weather_cache_path}")

        # Filter to 7am-10pm for clothing advice

            # Fetch full 24h weather data
            report_24h, summary_24h, points_24h = _get_tomorrow_weather_report_internal(
                loc['latitude'],
                loc['longitude'],
                0,
                23
            )

            # Save weather data immediately to cache
            cache_data = {
                "location_data": loc,
                "weather_report_text": report_24h,
                "weather_summary": summary_24h.__dict__,
                "hourly_points": [_enrich_hourly_point(p) for p in points_24h]
            }
            with open(weather_cache_path, 'w') as f:
                json.dump(cache_data, f, indent=2)
            print(f"Weather data cached to {weather_cache_path}")

        # Filter to 7am-10pm for clothing advice
        points_7_22 = [p for p in points_24h if 7 <= p.hour <= 22]
        is_snowy = any(p.weather_code in snow_weather_codes for p in points_7_22)

        # Generate a weather report summary for 7am-10pm window
        report_7_22 = _generate_report_text(points_7_22, summary_24h, loc)

        # Generate clothing advice for all languages
        languages = ['en', 'ro', 'hu']
        for lang in languages:
            model_advice_path = os.path.join(output_dir, f"{base_filename}_model_advice_{lang}.md")

            if os.path.exists(model_advice_path):
                print(f"✓ Using cached clothing advice for {loc['name']} ({lang.upper()})")
                continue

            print(f"📋 Generating clothing advice from JSON for {loc['name']} ({lang.upper()})...")

            # Generate advice from structured JSON data
            try:
                clothing_advice = _generate_clothing_advice_from_json(points_7_22, loc, is_snowy, language=lang)

                # Save the advice
                with open(model_advice_path, 'w', encoding='utf-8') as f:
                    f.write(clothing_advice)
                print(f"✓ Saved {lang.upper()} advice to {model_advice_path}")

            except Exception as e:
                print(f"⚠️  Error generating {lang.upper()} advice from JSON: {e}")
                if lang == 'en':
                    # Only fall back to LLM for English
                    print(f"   Falling back to LLM for English...")

                    try:
                        # Fallback to LLM if JSON generation fails (English only)
                        equipment_text = "AVAILABLE EQUIPMENT LIST (use ONLY items from this list):\n\n"
                        for zone in equipment_data:
                            equipment_text += f"{zone['body_zone']}:\n"
                            for item in zone['must_haves']:
                                equipment_text += f"  - {item}\n"
                            equipment_text += "\n"

                        weather_system_prompt = (
                            "You are an expert ski touring guide. Your task is to recommend clothing and equipment from a predefined list based on weather conditions. "
                            "You MUST ONLY recommend items that exist in the provided equipment list. Do not suggest any items not in the list."
                        )

                        weather_prompt = (
                            f"{equipment_text}"
                            f"Based on this forecast for {loc['name']} ({loc['elevation']}m), recommend clothing/equipment for ski touring between 7am-10pm. "
                            f"{'Snowy conditions expected.' if is_snowy else 'No snow expected.'} Select ONLY from the equipment list above. "
                            f"Provide as a bullet list, ordered head to toe. "
                            f"Response format: bullet list only, no title, no explanations.\n\n"
                            f"Weather Report:\n{report_7_22}"
                        )

                        clothing_advice = query_model(weather_system_prompt, weather_prompt).lower()

                        # Save LLM fallback advice
                        with open(model_advice_path, 'w', encoding='utf-8') as f:
                            f.write(clothing_advice)
                        print(f"✓ Saved LLM fallback advice to {model_advice_path}")
                    except Exception as llm_err:
                        print(f"   ❌ LLM fallback also failed: {llm_err}")

        # Save weather report text (7am-10pm window)
        weather_report_path = os.path.join(output_dir, f"{base_filename}_weather_report_7am_10pm.txt")
        with open(weather_report_path, 'w') as f:
            f.write(report_7_22)
        print(f"Weather report (7am-10pm) saved to {weather_report_path}")

        # Save clothing advice as markdown (if it was newly generated)
        if not os.path.exists(model_advice_path):
            with open(model_advice_path, 'w') as f:
                f.write(clothing_advice)
            print(f"Clothing advice saved to {model_advice_path}")
        else:
            print(f"Clothing advice already exists at {model_advice_path}")

        # Save hourly data for 7am-10pm with temperature_feel enrichment
        hourly_data_path = os.path.join(output_dir, f"{base_filename}_hourly_data_7am_10pm.json")
        hourly_data = [_enrich_hourly_point(p) for p in points_7_22]
        with open(hourly_data_path, 'w') as f:
            json.dump(hourly_data, f, indent=2)
        print(f"Hourly data (7am-10pm) saved to {hourly_data_path}")

    print(f"\n✅ All forecasts generated successfully!")
    print(f"📄 Open web/index.html to view all locations")

    # Create metadata file with forecast date
    metadata = {
        "forecast_date": tomorrow.isoformat(),
        "generated_at": date.today().isoformat(),
        "locations_count": len(mountain_locations),
        "time_window": "7am-10pm"
    }
    metadata_path = os.path.join(output_dir, "forecast_metadata.json")
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"Metadata saved to {metadata_path}")

    # Upload to S3
    print(f"\n{'='*60}")
    print("📤 Uploading data to S3...")
    print(f"{'='*60}")

    upload_success = upload_directory_to_s3(output_dir, tomorrow.isoformat())

    if upload_success:
        # Configure bucket policy and CORS for web access
        # print("\n🔧 Configuring bucket policy (making files public)...")
        # configure_bucket_policy()
        # print("\n🔧 Configuring CORS for web access...")
        # configure_bucket_cors()
        print(f"\n🌐 Latest forecast uploaded to S3!")
        print(f"📍 S3 Bucket: s3://static-sites-outdoor-activities-clothing-romania/")
        print(f"🌐 Public URL: https://static-sites-outdoor-activities-clothing-romania.s3.us-east-1.amazonaws.com/")
        print(f"\n💡 Files are uploaded to bucket root (overwritten each time)")
        print(f"   No historical data is kept on S3 - only the most recent forecast")
        print(f"   Historical data is kept locally in: {output_dir}")
    else:
        print(f"\n⚠️  S3 upload failed. Data is still available locally in: {output_dir}")
        print("   Check AWS credentials and try again.")

if __name__ == "__main__":
    main()

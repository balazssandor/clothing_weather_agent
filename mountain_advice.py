import argparse
import json
import os
from datetime import date, timedelta
from typing import List
from main import query_model
from weather import (_get_tomorrow_weather_report_internal, HourlyForecastPoint, TomorrowWindowSummary,
                     wind_chill_with_gusts, get_historical_wind_analysis, HistoricalWindAnalysis)
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


def _format_wind_analysis(wind_data: dict) -> str:
    """Format historical wind analysis as readable text."""
    if not wind_data:
        return "⚠️ Historical wind data unavailable"

    lines = []
    lines.append(f"📊 7-DAY WIND ANALYSIS - AVALANCHE RISK ASSESSMENT")
    lines.append(f"   Period: {wind_data['date_analyzed']}")
    lines.append(f"   (Recent wind patterns for avalanche risk & snow transport)")
    lines.append("")
    lines.append(f"Analyzed: {wind_data['total_hours']} hours over 7 days")
    lines.append(f"Dominant Direction: {wind_data['dominant_direction']}")
    lines.append(f"Average Wind Speed: {wind_data['avg_wind_speed']:.1f} km/h")
    lines.append(f"Maximum Gust: {wind_data['max_gust']:.1f} km/h")
    lines.append("")
    lines.append("Wind Distribution by Direction:")
    lines.append("Direction | Time % | Avg Speed | Max Gust")
    lines.append("----------|--------|-----------|----------")

    for stat in wind_data['direction_stats']:
        lines.append(
            f"{stat['direction']:>9} | {stat['percentage']:>5.1f}% | "
            f"{stat['avg_speed']:>7.1f} km/h | {stat['max_gust']:>6.1f} km/h"
        )

    lines.append("")
    lines.append("⚠️  AVALANCHE CONSIDERATIONS:")
    # Find top wind directions
    top_directions = wind_data['direction_stats'][:3] if wind_data['direction_stats'] else []
    if top_directions:
        lines.append(f"- Wind primarily from: {', '.join([s['direction'] for s in top_directions])}")
        lines.append(f"- Snow likely deposited on: LEE SLOPES (opposite of wind direction)")

        # Calculate lee slopes (opposite directions)
        lee_directions = []
        direction_map = {'N': 'S', 'NE': 'SW', 'E': 'W', 'SE': 'NW', 'S': 'N', 'SW': 'NE', 'W': 'E', 'NW': 'SE'}
        for stat in top_directions:
            lee_directions.append(direction_map.get(stat['direction'], '?'))

        lines.append(f"- Higher avalanche risk on slopes facing: {', '.join(lee_directions)}")

    return '\n'.join(lines)


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
    parser = argparse.ArgumentParser(description='Generate ski touring clothing advice for mountain locations')
    parser.add_argument('--use-cache', action='store_true', default=False,
                        help='Use cached data if available (default: always fetch fresh)')
    args = parser.parse_args()

    use_cache = args.use_cache
    console = Console()
    print("Generating ski touring clothing advice for mountain locations...")
    if not use_cache:
        print("🔄 Cache disabled - fetching fresh data for all locations")

    with open('mountain_locations.json', 'r') as f:
        mountain_locations = json.load(f)

    # Load equipment reference list
    with open('ski_touring_equipment.json', 'r') as f:
        equipment_data = json.load(f)

    snow_weather_codes = {71, 73, 75, 77, 85, 86}

    # Generate forecasts for 3 days (tomorrow, +2, +3)
    forecast_days = []
    for day_offset in range(1, 4):  # 1, 2, 3
        forecast_date = date.today() + timedelta(days=day_offset)
        forecast_days.append(forecast_date)

    print(f"📅 Generating forecasts for {len(forecast_days)} days: {[d.isoformat() for d in forecast_days]}")

    # Process each forecast day
    for forecast_date in forecast_days:
        print(f"\n{'='*80}")
        print(f"📆 Processing forecast for: {forecast_date.isoformat()}")
        print(f"{'='*80}")

        output_dir = os.path.join(
            "tomorrow_mountain_forecast_data",
            f"date={forecast_date.isoformat()}"
        )
        os.makedirs(output_dir, exist_ok=True)

        for loc in mountain_locations:
            print(f"\n--- {loc['name']} ({loc['mountain_range']}, {loc['zone']}) ---")

            base_filename = f"{loc['mountain_range'].replace(' ', '_').lower()}_{loc['zone'].replace(' ', '_')}"
            weather_cache_path = os.path.join(output_dir, f"{base_filename}_weather_data_24h.json")

            # Check if we have cached weather data (only if --use-cache is enabled)
            cache_valid = False
            if use_cache and os.path.exists(weather_cache_path):
                print(f"Loading cached weather data from {weather_cache_path}")
                with open(weather_cache_path, 'r') as f:
                    cached_data = json.load(f)
                    summary_24h_dict = cached_data['weather_summary']

                    # Check for 'dominant_wind_direction' to handle older cache formats
                    if 'dominant_wind_direction' not in summary_24h_dict:
                        print(f"⚠️  Cached data for {loc['name']} is outdated (missing dominant_wind_direction). Re-fetching from API...")
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
                        cache_valid = True

            # Fetch new data if cache is disabled or invalid
            if not cache_valid:
                print("Fetching weather data from API...")
                # Calculate which day offset to use (1 = tomorrow, 2 = day after, etc.)
                day_offset = (forecast_date - date.today()).days

                # Fetch full 24h weather data for the specific forecast date
                report_24h, summary_24h, points_24h = _get_tomorrow_weather_report_internal(
                    loc['latitude'],
                    loc['longitude'],
                    0,
                    23,
                    day_offset=day_offset
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

            # Fetch historical wind analysis for avalanche risk assessment
            wind_analysis_cache_path = os.path.join(output_dir, f"{base_filename}_wind_analysis.json")
            wind_analysis_dict = None
            if use_cache and os.path.exists(wind_analysis_cache_path):
                print(f"✓ Using cached wind analysis for {loc['name']}")
                with open(wind_analysis_cache_path, 'r') as f:
                    wind_analysis_dict = json.load(f)

            if wind_analysis_dict is None:
                print(f"📊 Analyzing historical wind patterns for {loc['name']}...")
                try:
                    wind_analysis = get_historical_wind_analysis(
                        loc['latitude'],
                        loc['longitude'],
                        forecast_date
                    )
                    # Convert to dict for JSON serialization
                    wind_analysis_dict = {
                        "date_analyzed": wind_analysis.date_analyzed,
                        "total_hours": wind_analysis.total_hours,
                        "dominant_direction": wind_analysis.dominant_direction,
                        "avg_wind_speed": round(wind_analysis.avg_wind_speed, 1),
                        "max_gust": round(wind_analysis.max_gust, 1),
                        "direction_stats": [
                            {
                                "direction": stat.direction,
                                "percentage": round(stat.percentage, 1),
                                "avg_speed": round(stat.avg_speed, 1),
                                "max_gust": round(stat.max_gust, 1),
                                "hours_count": stat.hours_count
                            }
                            for stat in wind_analysis.direction_stats
                        ]
                    }
                    # Save wind analysis
                    with open(wind_analysis_cache_path, 'w') as f:
                        json.dump(wind_analysis_dict, f, indent=2)
                    print(f"✓ Wind analysis saved to {wind_analysis_cache_path}")
                except Exception as e:
                    print(f"⚠️  Error fetching wind analysis: {e}")
                    wind_analysis_dict = None

            # Use full 24h data for clothing advice (no filtering)
            is_snowy = any(p.weather_code in snow_weather_codes for p in points_24h)

            # Generate a weather report summary for full 24h
            report_full_day = _generate_report_text(points_24h, summary_24h, loc)

            # Append wind analysis to the report
            if wind_analysis_dict:
                wind_analysis_text = _format_wind_analysis(wind_analysis_dict)
                report_full_day = report_full_day + "\n\n" + "="*80 + "\n" + wind_analysis_text

            # Generate clothing advice for all languages
            languages = ['en', 'ro', 'hu']
            for lang in languages:
                model_advice_path = os.path.join(output_dir, f"{base_filename}_model_advice_{lang}.md")

                if use_cache and os.path.exists(model_advice_path):
                    print(f"✓ Using cached clothing advice for {loc['name']} ({lang.upper()})")
                    continue

                print(f"📋 Generating clothing advice from JSON for {loc['name']} ({lang.upper()})...")

                # Generate advice from structured JSON data (full 24h)
                try:
                    clothing_advice = _generate_clothing_advice_from_json(points_24h, loc, is_snowy, language=lang)

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
                                f"Based on this forecast for {loc['name']} ({loc['elevation']}m), recommend clothing/equipment for ski touring (full day). "
                                f"{'Snowy conditions expected.' if is_snowy else 'No snow expected.'} Select ONLY from the equipment list above. "
                                f"Provide as a bullet list, ordered head to toe. "
                                f"Response format: bullet list only, no title, no explanations.\n\n"
                                f"Weather Report:\n{report_full_day}"
                            )

                            clothing_advice = query_model(weather_system_prompt, weather_prompt).lower()

                            # Save LLM fallback advice
                            with open(model_advice_path, 'w', encoding='utf-8') as f:
                                f.write(clothing_advice)
                            print(f"✓ Saved LLM fallback advice to {model_advice_path}")
                        except Exception as llm_err:
                            print(f"   ❌ LLM fallback also failed: {llm_err}")

            # Save weather report text (full 24h)
            weather_report_path = os.path.join(output_dir, f"{base_filename}_weather_report_full_day.txt")
            with open(weather_report_path, 'w') as f:
                f.write(report_full_day)
            print(f"Weather report (full day) saved to {weather_report_path}")

            # Save clothing advice as markdown (if it was newly generated)
            if not use_cache or not os.path.exists(model_advice_path):
                with open(model_advice_path, 'w') as f:
                    f.write(clothing_advice)
                print(f"Clothing advice saved to {model_advice_path}")

            # Save hourly data for full 24h with temperature_feel enrichment
            hourly_data_path = os.path.join(output_dir, f"{base_filename}_hourly_data_full_day.json")
            hourly_data = [_enrich_hourly_point(p) for p in points_24h]
            with open(hourly_data_path, 'w') as f:
                json.dump(hourly_data, f, indent=2)
            print(f"Hourly data (full day) saved to {hourly_data_path}")

        # Create metadata file for this forecast date
        metadata = {
            "forecast_date": forecast_date.isoformat(),
            "generated_at": date.today().isoformat(),
            "locations_count": len(mountain_locations),
            "time_window": "full_day_24h"
        }
        metadata_path = os.path.join(output_dir, "forecast_metadata.json")
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        print(f"Metadata saved to {metadata_path}")

    print(f"\n{'='*80}")
    print(f"✅ All forecasts generated successfully for {len(forecast_days)} days!")
    print(f"📄 Open web/index.html to view all locations")
    print(f"{'='*80}")

    # Upload all forecast days to S3
    print(f"\n{'='*60}")
    print("📤 Uploading data to S3...")
    print(f"{'='*60}")

    all_uploads_successful = True
    for forecast_date in forecast_days:
        output_dir = os.path.join(
            "tomorrow_mountain_forecast_data",
            f"date={forecast_date.isoformat()}"
        )
        print(f"\n📤 Uploading forecast for {forecast_date.isoformat()}...")
        upload_success = upload_directory_to_s3(output_dir, forecast_date.isoformat())
        if not upload_success:
            all_uploads_successful = False
            print(f"⚠️  Upload failed for {forecast_date.isoformat()}")

    if all_uploads_successful:
        print(f"\n🌐 All forecasts uploaded to S3 successfully!")
        print(f"📍 S3 Bucket: s3://static-sites-outdoor-activities-clothing-romania/")
        print(f"🌐 Public URL: https://static-sites-outdoor-activities-clothing-romania.s3.us-east-1.amazonaws.com/")
        print(f"\n💡 Files for {len(forecast_days)} days uploaded:")
        for forecast_date in forecast_days:
            print(f"   - {forecast_date.isoformat()}")
        print(f"\n📦 Historical data is kept locally in: tomorrow_mountain_forecast_data/")
    else:
        print(f"\n⚠️  Some S3 uploads failed. Data is still available locally.")
        print("   Check AWS credentials and try again.")

if __name__ == "__main__":
    main()

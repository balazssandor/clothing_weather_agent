import argparse
import json
import os
import time
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
from weather import (_get_tomorrow_weather_report_internal, HourlyForecastPoint, TomorrowWindowSummary,
                     wind_chill_with_gusts)


from s3_uploader import upload_directory_to_s3


def degrees_to_cardinal(degrees: float) -> str:
    """Convert wind direction degrees to cardinal direction."""
    directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    index = round(degrees / 45) % 8
    return directions[index]


def _analyze_wind_from_saved_data(
    base_filename: str,
    forecast_date: date,
    days_back: int = 7,
    include_forecast_days: bool = True
) -> Optional[Dict[str, Any]]:
    """
    Analyze historical wind data from previously saved hourly JSON files.

    Args:
        base_filename: The base filename pattern for this location
        forecast_date: The date we're forecasting for
        days_back: How many days of past data to look for
        include_forecast_days: Whether to include forecast data for days before forecast_date

    Returns:
        Dictionary with wind analysis data or None if no data found
    """
    base_dir = "tomorrow_mountain_forecast_data"

    # Collect all hourly data from saved files
    all_wind_data = []
    dates_with_data = []

    # Look for past days' saved data
    for day_offset in range(1, days_back + 1):
        check_date = forecast_date - timedelta(days=day_offset)
        date_dir = os.path.join(base_dir, f"date={check_date.isoformat()}")
        hourly_file = os.path.join(date_dir, f"{base_filename}_hourly_data_full_day.json")

        if os.path.exists(hourly_file):
            try:
                with open(hourly_file, 'r') as f:
                    hourly_data_raw = json.load(f)
                    # Handle both old array format and new object format with 'data' property
                    if isinstance(hourly_data_raw, dict) and 'data' in hourly_data_raw:
                        hourly_data = hourly_data_raw['data']
                    else:
                        hourly_data = hourly_data_raw
                    for hour_data in hourly_data:
                        if hour_data.get('wind_speed') is not None and hour_data.get('wind_direction') is not None:
                            all_wind_data.append({
                                'date': check_date.isoformat(),
                                'hour': hour_data.get('hour'),
                                'wind_speed': hour_data['wind_speed'],
                                'wind_gusts': hour_data.get('wind_gusts', 0),
                                'wind_direction': hour_data['wind_direction']
                            })
                    dates_with_data.append(check_date)
            except (json.JSONDecodeError, KeyError) as e:
                print(f"  ⚠️ Could not read {hourly_file}: {e}")

    # Also include forecast data for upcoming days if requested
    if include_forecast_days:
        # For forecast_date day+2 or day+3, include tomorrow's forecast wind
        for day_offset in range(0, 2):  # Check today's date and tomorrow
            check_date = forecast_date - timedelta(days=day_offset)
            if check_date > date.today():  # Only future dates
                continue
            date_dir = os.path.join(base_dir, f"date={check_date.isoformat()}")
            hourly_file = os.path.join(date_dir, f"{base_filename}_hourly_data_full_day.json")

            if os.path.exists(hourly_file) and check_date not in dates_with_data:
                try:
                    with open(hourly_file, 'r') as f:
                        hourly_data_raw = json.load(f)
                        # Handle both old array format and new object format with 'data' property
                        if isinstance(hourly_data_raw, dict) and 'data' in hourly_data_raw:
                            hourly_data = hourly_data_raw['data']
                        else:
                            hourly_data = hourly_data_raw
                        for hour_data in hourly_data:
                            if hour_data.get('wind_speed') is not None and hour_data.get('wind_direction') is not None:
                                all_wind_data.append({
                                    'date': check_date.isoformat(),
                                    'hour': hour_data.get('hour'),
                                    'wind_speed': hour_data['wind_speed'],
                                    'wind_gusts': hour_data.get('wind_gusts', 0),
                                    'wind_direction': hour_data['wind_direction'],
                                    'is_forecast': True
                                })
                        dates_with_data.append(check_date)
                except (json.JSONDecodeError, KeyError):
                    pass

    if not all_wind_data:
        return None

    # Analyze wind by direction
    direction_data = defaultdict(lambda: {"speeds": [], "gusts": [], "count": 0})
    total_hours = 0
    total_speed = 0.0
    max_gust_overall = 0.0

    for data_point in all_wind_data:
        cardinal_dir = degrees_to_cardinal(data_point['wind_direction'])
        direction_data[cardinal_dir]["count"] += 1
        direction_data[cardinal_dir]["speeds"].append(data_point['wind_speed'])

        gust = data_point.get('wind_gusts', 0)
        if gust:
            direction_data[cardinal_dir]["gusts"].append(gust)
            max_gust_overall = max(max_gust_overall, gust)

        total_hours += 1
        total_speed += data_point['wind_speed']

    # Calculate statistics for each direction
    direction_stats = []
    for direction in ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']:
        data_for_dir = direction_data[direction]
        count = data_for_dir["count"]

        if count == 0:
            direction_stats.append({
                "direction": direction,
                "percentage": 0.0,
                "avg_speed": 0.0,
                "max_gust": 0.0,
                "hours_count": 0
            })
        else:
            avg_speed = sum(data_for_dir["speeds"]) / count
            max_gust = max(data_for_dir["gusts"]) if data_for_dir["gusts"] else 0.0
            percentage = (count / total_hours) * 100
            direction_stats.append({
                "direction": direction,
                "percentage": round(percentage, 1),
                "avg_speed": round(avg_speed, 1),
                "max_gust": round(max_gust, 1),
                "hours_count": count
            })

    # Sort by percentage (most common first)
    direction_stats.sort(key=lambda x: x['percentage'], reverse=True)

    # Determine dominant direction
    dominant_direction = direction_stats[0]['direction'] if direction_stats else "N/A"
    avg_wind_speed = total_speed / total_hours if total_hours > 0 else 0.0

    # Calculate actual data coverage
    dates_with_data.sort()
    days_with_data = round(total_hours / 24, 1)
    start_date = min(dates_with_data).isoformat() if dates_with_data else ""
    end_date = max(dates_with_data).isoformat() if dates_with_data else ""
    date_range_str = f"{start_date} to {end_date}" if start_date and end_date else "No data"

    return {
        "date_analyzed": date_range_str,
        "total_hours": total_hours,
        "days_requested": days_back,
        "days_with_data": days_with_data,
        "days_found": len(dates_with_data),
        "start_date": start_date,
        "end_date": end_date,
        "dominant_direction": dominant_direction,
        "avg_wind_speed": round(avg_wind_speed, 1),
        "max_gust": round(max_gust_overall, 1),
        "direction_stats": direction_stats,
        "source": "saved_forecast_data"
    }


def _generate_7day_history(
    base_filename: str,
    reference_date: date,
    days_back: int = 7
) -> Optional[Dict[str, Any]]:
    """
    Generate 7-day weather history from saved hourly forecast data.

    Args:
        base_filename: The base filename pattern for this location
        reference_date: The reference date (usually forecast_date)
        days_back: How many days of history to include

    Returns:
        Dictionary with daily weather summaries or None if no data
    """
    import math

    base_dir = "tomorrow_mountain_forecast_data"

    daily_summaries = []

    # Weather codes
    FOG_CODES = [45, 48]
    SNOW_CODES = [71, 73, 75, 77, 85, 86]  # Snow fall and snow showers

    # Look for past days' saved data
    for day_offset in range(1, days_back + 1):
        check_date = reference_date - timedelta(days=day_offset)
        date_dir = os.path.join(base_dir, f"date={check_date.isoformat()}")
        hourly_file = os.path.join(date_dir, f"{base_filename}_hourly_data_full_day.json")

        if os.path.exists(hourly_file):
            try:
                with open(hourly_file, 'r') as f:
                    hourly_data_raw = json.load(f)
                    # Handle both old array format and new object format
                    if isinstance(hourly_data_raw, dict) and 'data' in hourly_data_raw:
                        hourly_data = hourly_data_raw['data']
                    else:
                        hourly_data = hourly_data_raw

                    if not hourly_data:
                        continue

                    # Calculate daily aggregates
                    temps = [h.get('temperature', 0) for h in hourly_data if h.get('temperature') is not None]
                    temp_feels = [h.get('temperature_feel', h.get('temperature', 0)) for h in hourly_data if h.get('temperature') is not None]
                    precips = [h.get('precipitation', 0) for h in hourly_data]
                    wind_speeds = [h.get('wind_speed', 0) for h in hourly_data if h.get('wind_speed') is not None]
                    wind_gusts = [h.get('wind_gusts', 0) for h in hourly_data if h.get('wind_gusts') is not None]
                    cloud_covers = [h.get('cloud_cover', 0) for h in hourly_data if h.get('cloud_cover') is not None]
                    cloud_lows = [h.get('cloud_cover_low', 0) for h in hourly_data if h.get('cloud_cover_low') is not None]
                    cloud_mids = [h.get('cloud_cover_mid', 0) for h in hourly_data if h.get('cloud_cover_mid') is not None]
                    cloud_highs = [h.get('cloud_cover_high', 0) for h in hourly_data if h.get('cloud_cover_high') is not None]
                    weather_codes = [h.get('weather_code') for h in hourly_data if h.get('weather_code') is not None]

                    # Count fog hours
                    fog_hours = sum(1 for code in weather_codes if code in FOG_CODES)
                    has_rime_fog = 48 in weather_codes

                    # Detect snow: either snow weather codes OR cold temp with precipitation
                    snow_hours = 0
                    total_snow_precip = 0.0
                    for h in hourly_data:
                        code = h.get('weather_code')
                        temp = h.get('temperature', 10)
                        precip = h.get('precipitation', 0)
                        is_snow = code in SNOW_CODES or (temp < 2 and precip > 0)
                        if is_snow:
                            snow_hours += 1
                            total_snow_precip += precip
                    has_snow = snow_hours > 0

                    # Calculate vector-averaged wind direction weighted by wind speed
                    # This gives the "net" wind direction considering that stronger winds
                    # have more impact on snow transport and conditions
                    wind_vector_x = 0.0  # East component
                    wind_vector_y = 0.0  # North component
                    total_wind_weight = 0.0

                    for h in hourly_data:
                        speed = h.get('wind_speed')
                        direction = h.get('wind_direction')
                        if speed is not None and direction is not None and speed > 0:
                            # Convert meteorological direction (from) to radians
                            # Meteorological: 0=N, 90=E, 180=S, 270=W
                            rad = math.radians(direction)
                            wind_vector_x += speed * math.sin(rad)
                            wind_vector_y += speed * math.cos(rad)
                            total_wind_weight += speed

                    # Calculate resultant direction
                    if total_wind_weight > 0:
                        avg_direction = math.degrees(math.atan2(wind_vector_x, wind_vector_y))
                        if avg_direction < 0:
                            avg_direction += 360
                        dominant_wind_direction = round(avg_direction, 0)
                    else:
                        dominant_wind_direction = None

                    # Determine dominant weather condition
                    if weather_codes:
                        from collections import Counter
                        code_counts = Counter(weather_codes)
                        dominant_code = code_counts.most_common(1)[0][0]
                    else:
                        dominant_code = None

                    daily_summary = {
                        "date": check_date.isoformat(),
                        "temp_min": round(min(temps), 1) if temps else None,
                        "temp_max": round(max(temps), 1) if temps else None,
                        "temp_feel_min": round(min(temp_feels), 1) if temp_feels else None,
                        "temp_feel_max": round(max(temp_feels), 1) if temp_feels else None,
                        "precip_total": round(sum(precips), 1),
                        "wind_avg": round(sum(wind_speeds) / len(wind_speeds), 1) if wind_speeds else 0,
                        "wind_max": round(max(wind_speeds), 1) if wind_speeds else 0,
                        "gust_max": round(max(wind_gusts), 1) if wind_gusts else 0,
                        "wind_direction": dominant_wind_direction,  # Vector-averaged direction
                        "cloud_avg": round(sum(cloud_covers) / len(cloud_covers), 0) if cloud_covers else None,
                        "cloud_low_avg": round(sum(cloud_lows) / len(cloud_lows), 0) if cloud_lows else None,
                        "cloud_mid_avg": round(sum(cloud_mids) / len(cloud_mids), 0) if cloud_mids else None,
                        "cloud_high_avg": round(sum(cloud_highs) / len(cloud_highs), 0) if cloud_highs else None,
                        "fog_hours": fog_hours,
                        "has_rime_fog": has_rime_fog,
                        "has_snow": has_snow,
                        "snow_hours": snow_hours,
                        "snow_precip_mm": round(total_snow_precip, 1),
                        "dominant_weather_code": dominant_code
                    }
                    daily_summaries.append(daily_summary)

            except (json.JSONDecodeError, KeyError) as e:
                print(f"  ⚠️ Could not read {hourly_file}: {e}")

    if not daily_summaries:
        return None

    # Sort by date (oldest first)
    daily_summaries.sort(key=lambda x: x['date'])

    return {
        "days_requested": days_back,
        "days_found": len(daily_summaries),
        "start_date": daily_summaries[0]['date'] if daily_summaries else None,
        "end_date": daily_summaries[-1]['date'] if daily_summaries else None,
        "daily_data": daily_summaries,
        "source": "saved_forecast_data"
    }


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

    days_requested = wind_data.get('days_requested', 7)
    days_with_data = wind_data.get('days_with_data', wind_data['total_hours'] / 24)
    days_found = wind_data.get('days_found', 0)
    source = wind_data.get('source', 'api')

    lines = []
    lines.append(f"📊 WIND ANALYSIS - AVALANCHE RISK ASSESSMENT")
    lines.append(f"   Period: {wind_data['date_analyzed']}")
    if source == 'saved_forecast_data':
        lines.append(f"   Data: {days_found} days found ({wind_data['total_hours']}h), looked back {days_requested} days")
    else:
        lines.append(f"   Data coverage: {days_with_data:.1f} days of data (requested {days_requested} days)")
    lines.append(f"   (Recent wind patterns for avalanche risk & snow transport)")
    lines.append("")
    lines.append(f"Analyzed: {wind_data['total_hours']} hours ({days_with_data:.1f} days of data)")
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
    parser = argparse.ArgumentParser(description='Generate weather forecasts for mountain locations')
    parser.add_argument('--use-cache', action='store_true', default=False,
                        help='Use cached data if available (default: always fetch fresh)')
    args = parser.parse_args()

    use_cache = args.use_cache
    print("Generating weather forecasts for mountain locations...")
    if not use_cache:
        print("🔄 Cache disabled - fetching fresh data for all locations")

    with open('mountain_locations.json', 'r') as f:
        mountain_locations = json.load(f)

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

            # Create unique filename using mountain range and location name
            safe_name = loc['name'].replace(' ', '_').replace(',', '').replace('(', '').replace(')', '').lower()
            base_filename = f"{loc['mountain_range'].replace(' ', '_').lower()}_{safe_name}"
            weather_cache_path = os.path.join(output_dir, f"{base_filename}_weather_data_24h.json")

            # Check if we have cached weather data (only if --use-cache is enabled)
            cache_valid = False
            fetched_at = None  # Track when data was fetched from API
            if use_cache and os.path.exists(weather_cache_path):
                print(f"Loading cached weather data from {weather_cache_path}")
                with open(weather_cache_path, 'r') as f:
                    cached_data = json.load(f)
                    summary_24h_dict = cached_data['weather_summary']

                    # Check for 'dominant_wind_direction' to handle older cache formats
                    if 'dominant_wind_direction' not in summary_24h_dict:
                        print(f"⚠️  Cached data for {loc['name']} is outdated (missing dominant_wind_direction). Re-fetching from API...")
                    else:
                        # Reconstruct dataclass from dict
                        summary_24h = TomorrowWindowSummary(**summary_24h_dict)
                        # Reconstruct hourly points (remove temperature_feel if present, it will be recalculated)
                        points_24h = []
                        for p in cached_data['hourly_points']:
                            # Remove enriched fields not in dataclass
                            p_clean = {k: v for k, v in p.items() if k != 'temperature_feel'}
                            points_24h.append(HourlyForecastPoint(**p_clean))
                        # Preserve fetched_at from cache
                        fetched_at = cached_data.get('fetched_at')
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

                # Wait between API calls to avoid rate limiting/timeouts
                time.sleep(0.5)

                # Record the time when data was fetched from API
                fetched_at = datetime.now(timezone.utc).isoformat()

                # Save weather data immediately to cache
                cache_data = {
                    "location_data": loc,
                    "weather_report_text": report_24h,
                    "weather_summary": summary_24h.__dict__,
                    "hourly_points": [_enrich_hourly_point(p) for p in points_24h],
                    "fetched_at": fetched_at  # When API was called
                }
                with open(weather_cache_path, 'w') as f:
                    json.dump(cache_data, f, indent=2)
                print(f"Weather data cached to {weather_cache_path}")

            # Analyze historical wind from saved forecast data
            wind_analysis_cache_path = os.path.join(output_dir, f"{base_filename}_wind_analysis.json")
            wind_analysis_dict = None
            if use_cache and os.path.exists(wind_analysis_cache_path):
                print(f"✓ Using cached wind analysis for {loc['name']}")
                with open(wind_analysis_cache_path, 'r') as f:
                    wind_analysis_dict = json.load(f)

            if wind_analysis_dict is None:
                print(f"📊 Analyzing wind patterns from saved data for {loc['name']}...")
                wind_analysis_dict = _analyze_wind_from_saved_data(
                    base_filename,
                    forecast_date,
                    days_back=7,
                    include_forecast_days=True
                )
                if wind_analysis_dict:
                    # Save wind analysis
                    with open(wind_analysis_cache_path, 'w') as f:
                        json.dump(wind_analysis_dict, f, indent=2)
                    print(f"✓ Wind analysis saved ({wind_analysis_dict['days_found']} days of data found)")
                else:
                    print(f"⚠️  No saved wind data found for {loc['name']}")

            # Generate 7-day weather history from saved data
            history_cache_path = os.path.join(output_dir, f"{base_filename}_7day_history.json")
            history_data = None
            if use_cache and os.path.exists(history_cache_path):
                print(f"✓ Using cached 7-day history for {loc['name']}")
                with open(history_cache_path, 'r') as f:
                    history_data = json.load(f)

            if history_data is None:
                print(f"📊 Generating 7-day history from saved data for {loc['name']}...")
                history_data = _generate_7day_history(
                    base_filename,
                    forecast_date,
                    days_back=7
                )
                if history_data:
                    with open(history_cache_path, 'w') as f:
                        json.dump(history_data, f, indent=2)
                    print(f"✓ 7-day history saved ({history_data['days_found']} days of data found)")
                else:
                    print(f"⚠️  No saved history data found for {loc['name']}")

            # Generate a weather report summary for full 24h
            report_full_day = _generate_report_text(points_24h, summary_24h, loc)

            # Append wind analysis to the report
            if wind_analysis_dict:
                wind_analysis_text = _format_wind_analysis(wind_analysis_dict)
                report_full_day = report_full_day + "\n\n" + "="*80 + "\n" + wind_analysis_text

            # Save weather report text (full 24h)
            weather_report_path = os.path.join(output_dir, f"{base_filename}_weather_report_full_day.txt")
            with open(weather_report_path, 'w') as f:
                f.write(report_full_day)
            print(f"Weather report (full day) saved to {weather_report_path}")

            # Save hourly data for full 24h with temperature_feel enrichment and fetched_at timestamp
            hourly_data_path = os.path.join(output_dir, f"{base_filename}_hourly_data_full_day.json")
            hourly_data = {
                "fetched_at": fetched_at,  # When API was called (ISO format UTC)
                "forecast_date": forecast_date.isoformat(),
                "location": loc['name'],
                "data": [_enrich_hourly_point(p) for p in points_24h]
            }
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

"""
AWS Lambda handler for mountain weather forecast generation and data archival.

This handler:
1. Generates weather forecasts for all mountain locations
2. Generates wind analysis from saved historical data
3. Uploads all data to S3
4. Archives data older than DATA_RETENTION_DAYS to archive/ prefix
"""

import json
import os
import time
import boto3
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from typing import List, Dict, Any, Optional

# Import forecast generation modules
from weather import (_get_tomorrow_weather_report_internal, HourlyForecastPoint,
                     TomorrowWindowSummary, wind_chill_with_gusts)

# Environment variables
S3_BUCKET_NAME = os.environ.get('S3_BUCKET_NAME', 'static-sites-outdoor-activities-clothing-romania')
DATA_RETENTION_DAYS = int(os.environ.get('DATA_RETENTION_DAYS', '7'))
AWS_REGION = os.environ.get('AWS_REGION_OVERRIDE', os.environ.get('AWS_REGION', 'us-east-1'))

# S3 client
s3_client = boto3.client('s3', region_name=AWS_REGION)

# Data directory prefix in S3
DATA_PREFIX = 'tomorrow_mountain_forecast_data'
ARCHIVE_PREFIX = 'archive/tomorrow_mountain_forecast_data'


def _enrich_hourly_point(point: HourlyForecastPoint) -> dict:
    """Convert HourlyForecastPoint to dict and add temperature_feel field."""
    data = point.__dict__.copy()
    data['temperature_feel'] = wind_chill_with_gusts(
        point.temperature,
        point.wind_speed,
        point.wind_gusts
    )
    return data


def degrees_to_cardinal(degrees: float) -> str:
    """Convert wind direction degrees to cardinal direction."""
    directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    index = round(degrees / 45) % 8
    return directions[index]


def load_mountain_locations() -> List[Dict]:
    """Load mountain locations from JSON file."""
    locations_path = os.path.join(os.path.dirname(__file__), 'mountain_locations.json')
    with open(locations_path, 'r') as f:
        return json.load(f)


def upload_to_s3(data: Any, s3_key: str, content_type: str = 'application/json'):
    """Upload data to S3."""
    if isinstance(data, dict) or isinstance(data, list):
        body = json.dumps(data, indent=2)
    else:
        body = str(data)

    s3_client.put_object(
        Bucket=S3_BUCKET_NAME,
        Key=s3_key,
        Body=body.encode('utf-8'),
        ContentType=content_type
    )
    print(f"  Uploaded: {s3_key}")


def get_s3_json(s3_key: str) -> Optional[Dict]:
    """Get JSON data from S3."""
    try:
        response = s3_client.get_object(Bucket=S3_BUCKET_NAME, Key=s3_key)
        return json.loads(response['Body'].read().decode('utf-8'))
    except s3_client.exceptions.NoSuchKey:
        return None
    except Exception as e:
        print(f"  Error reading {s3_key}: {e}")
        return None


def analyze_wind_from_s3_data(
    base_filename: str,
    forecast_date: date,
    days_back: int = 7
) -> Optional[Dict[str, Any]]:
    """
    Analyze historical wind data from previously saved hourly JSON files in S3.
    """
    all_wind_data = []
    dates_with_data = []

    # Look for past days' saved data in S3
    for day_offset in range(1, days_back + 1):
        check_date = forecast_date - timedelta(days=day_offset)
        s3_key = f"{DATA_PREFIX}/date={check_date.isoformat()}/{base_filename}_hourly_data_full_day.json"

        hourly_data_raw = get_s3_json(s3_key)
        if hourly_data_raw:
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


def generate_7day_history_from_s3(
    base_filename: str,
    reference_date: date,
    days_back: int = 7
) -> Optional[Dict[str, Any]]:
    """
    Generate 7-day weather history from saved hourly forecast data in S3.
    """
    import math

    daily_summaries = []
    FOG_CODES = [45, 48]
    SNOW_CODES = [71, 73, 75, 77, 85, 86]  # Snow fall and snow showers

    for day_offset in range(1, days_back + 1):
        check_date = reference_date - timedelta(days=day_offset)
        s3_key = f"{DATA_PREFIX}/date={check_date.isoformat()}/{base_filename}_hourly_data_full_day.json"

        hourly_data_raw = get_s3_json(s3_key)
        if hourly_data_raw:
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


def generate_weather_report_text(points: List[Dict], summary: Dict, loc: Dict) -> str:
    """Generate a formatted weather report text."""
    if not points:
        return "No data available"

    temp_min = summary['temp_min']
    temp_max = summary['temp_max']
    precip_total = summary['precip_total']
    precip_prob_max = summary.get('precip_prob_max')
    wind_avg = summary['wind_avg']
    wind_max = summary['wind_max']
    gust_max = summary.get('gust_max')
    dominant_text = summary['dominant_conditions']
    timezone = summary['timezone']
    dominant_wind_direction = summary.get('dominant_wind_direction', 0)

    lines = []
    lines.append("Hour | Temp | Precip | Precip% | Wind | Gusts | Wind Dir | Conditions")
    lines.append("-----|------|--------|---------|------|-------|----------|-----------")
    for p in points:
        prob_str = f"{p.get('precipitation_probability', 0):.0f}%"
        gust_str = f"{p.get('wind_gusts', 0):.0f}km/h"
        wind_dir_str = f"{p.get('wind_direction', 0):.0f}°"
        lines.append(
            f"{p['hour']:02d}:00 | "
            f"{p['temperature']:.1f}°C | "
            f"{p.get('precipitation', 0):.1f}mm | "
            f"{prob_str:>6} | "
            f"{p['wind_speed']:.0f}km/h | "
            f"{gust_str:>5} | "
            f"{wind_dir_str:>8} | "
            f"{p.get('conditions', '')}"
        )

    prob_phrase = f"Peak precipitation chance: {precip_prob_max:.0f}%." if precip_prob_max else ""
    gust_phrase = f" Gusts up to {gust_max:.0f}km/h." if gust_max else ""

    start_hour = points[0]['hour']
    end_hour = points[-1]['hour']
    time_window_str = f"{start_hour:02d}:00–{end_hour:02d}:00"

    report = (
        f"Forecast (local time: {timezone}), {time_window_str}:\n"
        f"- Location: {loc['name']} ({loc['mountain_range']}, {loc['elevation']}m)\n"
        f"- Dominant conditions: {dominant_text}.\n"
        f"- Temperature: {temp_min:.1f}°C to {temp_max:.1f}°C.\n"
        f"- Precipitation: about {precip_total:.1f}mm total. {prob_phrase}\n"
        f"- Wind: average {wind_avg:.0f}km/h, max {wind_max:.0f}km/h.{gust_phrase}\n"
        f"- Dominant Wind Direction: {dominant_wind_direction:.0f}°\n\n"
        f"Hourly breakdown:\n" + "\n".join(lines)
    )

    return report


def generate_forecasts(forecast_date: date, locations: List[Dict]) -> Dict[str, Any]:
    """Generate forecasts for all locations for a specific date."""
    results = {
        'date': forecast_date.isoformat(),
        'locations_processed': 0,
        'files_uploaded': 0,
        'errors': []
    }

    date_prefix = f"{DATA_PREFIX}/date={forecast_date.isoformat()}"

    for loc in locations:
        try:
            print(f"Processing: {loc['name']} ({loc['mountain_range']})")

            # Create filename
            safe_name = loc['name'].replace(' ', '_').replace(',', '').replace('(', '').replace(')', '').lower()
            base_filename = f"{loc['mountain_range'].replace(' ', '_').lower()}_{safe_name}"

            # Calculate day offset
            day_offset = (forecast_date - date.today()).days

            # Fetch weather data from API
            report_24h, summary_24h, points_24h = _get_tomorrow_weather_report_internal(
                loc['latitude'],
                loc['longitude'],
                0,
                23,
                day_offset=day_offset
            )

            # Wait between API calls to avoid rate limiting/timeouts
            time.sleep(0.5)

            # Record when data was fetched from API
            fetched_at = datetime.now(timezone.utc).isoformat()

            # Enrich hourly data
            enriched_points = [_enrich_hourly_point(p) for p in points_24h]

            # 1. Upload hourly data with fetched_at timestamp
            hourly_data = {
                "fetched_at": fetched_at,
                "forecast_date": forecast_date.isoformat(),
                "location": loc['name'],
                "data": enriched_points
            }
            hourly_key = f"{date_prefix}/{base_filename}_hourly_data_full_day.json"
            upload_to_s3(hourly_data, hourly_key)
            results['files_uploaded'] += 1

            # 2. Upload weather cache data
            cache_data = {
                "location_data": loc,
                "weather_report_text": report_24h,
                "weather_summary": summary_24h.__dict__,
                "hourly_points": enriched_points,
                "fetched_at": fetched_at
            }
            cache_key = f"{date_prefix}/{base_filename}_weather_data_24h.json"
            upload_to_s3(cache_data, cache_key)
            results['files_uploaded'] += 1

            # 3. Upload weather report text
            report_text = generate_weather_report_text(enriched_points, summary_24h.__dict__, loc)
            report_key = f"{date_prefix}/{base_filename}_weather_report_full_day.txt"
            upload_to_s3(report_text, report_key, content_type='text/plain')
            results['files_uploaded'] += 1

            # 4. Generate and upload wind analysis from saved data
            wind_analysis = analyze_wind_from_s3_data(base_filename, forecast_date, days_back=7)
            if wind_analysis:
                wind_key = f"{date_prefix}/{base_filename}_wind_analysis.json"
                upload_to_s3(wind_analysis, wind_key)
                results['files_uploaded'] += 1
                print(f"  Wind analysis: {wind_analysis['days_found']} days of data")
            else:
                print(f"  Wind analysis: No historical data available yet")

            # 5. Generate and upload 7-day weather history from saved data
            history_data = generate_7day_history_from_s3(base_filename, forecast_date, days_back=7)
            if history_data:
                history_key = f"{date_prefix}/{base_filename}_7day_history.json"
                upload_to_s3(history_data, history_key)
                results['files_uploaded'] += 1
                print(f"  7-day history: {history_data['days_found']} days of data")
            else:
                print(f"  7-day history: No historical data available yet")

            results['locations_processed'] += 1

        except Exception as e:
            error_msg = f"Error processing {loc['name']}: {str(e)}"
            print(error_msg)
            results['errors'].append(error_msg)

    # Upload metadata
    metadata = {
        "forecast_date": forecast_date.isoformat(),
        "generated_at": date.today().isoformat(),
        "locations_count": len(locations),
        "time_window": "full_day_24h"
    }
    metadata_key = f"{date_prefix}/forecast_metadata.json"
    upload_to_s3(metadata, metadata_key)
    results['files_uploaded'] += 1

    return results


def archive_old_data(retention_days: int) -> Dict[str, Any]:
    """
    Archive data older than retention_days by moving to archive/ prefix.
    """
    results = {
        'dates_archived': [],
        'objects_moved': 0,
        'errors': []
    }

    cutoff_date = date.today() - timedelta(days=retention_days)
    print(f"Archiving data older than {cutoff_date.isoformat()} ({retention_days} days)")

    try:
        paginator = s3_client.get_paginator('list_objects_v2')

        for page in paginator.paginate(Bucket=S3_BUCKET_NAME, Prefix=f"{DATA_PREFIX}/date=", Delimiter='/'):
            for prefix_info in page.get('CommonPrefixes', []):
                prefix = prefix_info['Prefix']

                try:
                    date_str = prefix.split('date=')[1].rstrip('/')
                    prefix_date = date.fromisoformat(date_str)

                    if prefix_date < cutoff_date:
                        print(f"Archiving data for {date_str}...")
                        archived_count = archive_date_folder(prefix, date_str)
                        results['dates_archived'].append(date_str)
                        results['objects_moved'] += archived_count

                except (IndexError, ValueError) as e:
                    results['errors'].append(f"Could not parse date from prefix {prefix}: {e}")

    except Exception as e:
        results['errors'].append(f"Error listing S3 objects: {str(e)}")

    return results


def archive_date_folder(source_prefix: str, date_str: str) -> int:
    """Move all objects from source prefix to archive prefix."""
    objects_moved = 0
    archive_prefix = f"{ARCHIVE_PREFIX}/date={date_str}/"

    try:
        paginator = s3_client.get_paginator('list_objects_v2')

        for page in paginator.paginate(Bucket=S3_BUCKET_NAME, Prefix=source_prefix):
            for obj in page.get('Contents', []):
                source_key = obj['Key']
                relative_path = source_key[len(source_prefix):]
                archive_key = f"{archive_prefix}{relative_path}"

                try:
                    s3_client.copy_object(
                        Bucket=S3_BUCKET_NAME,
                        CopySource={'Bucket': S3_BUCKET_NAME, 'Key': source_key},
                        Key=archive_key
                    )
                    s3_client.delete_object(Bucket=S3_BUCKET_NAME, Key=source_key)
                    objects_moved += 1

                except Exception as e:
                    print(f"  Error archiving {source_key}: {e}")

    except Exception as e:
        print(f"Error archiving folder {source_prefix}: {e}")

    return objects_moved


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Lambda handler entry point."""
    print(f"Starting mountain weather forecast generation")
    print(f"Event: {json.dumps(event)}")
    print(f"S3 Bucket: {S3_BUCKET_NAME}")
    print(f"Data Retention: {DATA_RETENTION_DAYS} days")

    response = {
        'statusCode': 200,
        'forecast_results': {},
        'archive_results': {},
        'errors': []
    }

    try:
        locations = load_mountain_locations()
        print(f"Loaded {len(locations)} mountain locations")

        # Generate forecasts for 3 days (tomorrow, +2, +3)
        all_forecast_results = []
        for day_offset in range(1, 4):
            forecast_date = date.today() + timedelta(days=day_offset)
            print(f"\n{'='*60}")
            print(f"Generating forecast for: {forecast_date.isoformat()}")
            print(f"{'='*60}")

            result = generate_forecasts(forecast_date, locations)
            all_forecast_results.append(result)

            if result['errors']:
                response['errors'].extend(result['errors'])

        response['forecast_results'] = {
            'days_processed': len(all_forecast_results),
            'total_locations': sum(r['locations_processed'] for r in all_forecast_results),
            'total_files': sum(r['files_uploaded'] for r in all_forecast_results),
            'details': all_forecast_results
        }

        # Archive old data
        print(f"\n{'='*60}")
        print("Archiving old data...")
        print(f"{'='*60}")

        archive_result = archive_old_data(DATA_RETENTION_DAYS)
        response['archive_results'] = archive_result

        if archive_result['errors']:
            response['errors'].extend(archive_result['errors'])

        if response['errors']:
            response['statusCode'] = 207

        print(f"\n{'='*60}")
        print("Processing complete!")
        print(f"Forecasts: {response['forecast_results']['total_locations']} locations, {response['forecast_results']['total_files']} files")
        print(f"Archived: {len(archive_result['dates_archived'])} dates, {archive_result['objects_moved']} objects")
        print(f"{'='*60}")

    except Exception as e:
        response['statusCode'] = 500
        response['errors'].append(f"Critical error: {str(e)}")
        print(f"Critical error: {e}")
        raise

    return response


if __name__ == "__main__":
    test_event = {"source": "local_test"}
    result = handler(test_event, None)
    print(json.dumps(result, indent=2))

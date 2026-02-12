from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple
from collections import defaultdict
import requests


_WMO_CODE_TO_TEXT: Dict[int, str] = {
    0: "clear sky",
    1: "mainly clear",
    2: "partly cloudy",
    3: "overcast",
    45: "fog",
    48: "depositing rime fog",
    51: "light drizzle",
    53: "moderate drizzle",
    55: "dense drizzle",
    56: "light freezing drizzle",
    57: "dense freezing drizzle",
    61: "light rain",
    63: "moderate rain",
    65: "heavy rain",
    66: "light freezing rain",
    67: "heavy freezing rain",
    71: "light snow",
    73: "moderate snow",
    75: "heavy snow",
    77: "snow grains",
    80: "slight rain showers",
    81: "moderate rain showers",
    82: "violent rain showers",
    85: "slight snow showers",
    86: "heavy snow showers",
    95: "thunderstorm",
    96: "thunderstorm with hail",
    99: "thunderstorm with heavy hail",
}


@dataclass(frozen=True)
class HourlyForecastPoint:
    time_local: str                 # e.g. "2026-01-27T09:00"
    hour: int                       # 0-23
    temperature: float
    precipitation: float
    precipitation_probability: Optional[float]  # percent
    wind_speed: float
    wind_gusts: Optional[float]
    weather_code: Optional[int]
    wind_direction: Optional[float]
    conditions: str                 # resolved text
    cloud_cover: Optional[float] = None        # total cloud cover (%)
    cloud_cover_low: Optional[float] = None    # low level clouds (%)
    cloud_cover_mid: Optional[float] = None    # mid level clouds (%)
    cloud_cover_high: Optional[float] = None   # high level clouds (%)


@dataclass
class WindDirectionStats:
    """Statistics for wind from a specific direction."""
    direction: str  # N, NE, E, SE, S, SW, W, NW
    percentage: float  # Percentage of time wind was from this direction
    avg_speed: float  # Average wind speed (km/h)
    max_gust: float  # Maximum gust (km/h)
    hours_count: int  # Number of hours with this direction


@dataclass
class HistoricalWindAnalysis:
    """Analysis of historical wind patterns for avalanche risk assessment."""
    date_analyzed: str  # Date range string (e.g., "2026-02-05 to 2026-02-11")
    total_hours: int  # Total hours with valid data
    direction_stats: List[WindDirectionStats]  # Stats for each direction, sorted by percentage
    dominant_direction: str  # Most common wind direction
    avg_wind_speed: float  # Overall average wind speed
    max_gust: float  # Maximum gust observed
    days_requested: int  # Number of days requested for analysis
    days_with_data: float  # Actual days of data received (total_hours / 24)
    start_date: str  # Start date of analysis period (YYYY-MM-DD)
    end_date: str  # End date of analysis period (YYYY-MM-DD)


@dataclass(frozen=True)
class TomorrowWindowSummary:
    latitude: float
    longitude: float
    timezone: str
    window_start_local: str
    window_end_local: str

    temp_min: float
    temp_max: float
    temp_unit: str

    precip_total: float
    precip_unit: str
    precip_prob_max: Optional[float]  # percent

    wind_avg: float
    wind_max: float
    gust_max: Optional[float]
    wind_unit: str
    dominant_wind_direction: Optional[float]

    dominant_conditions: str



def _get_tomorrow_weather_report_internal(
    latitude: float,
    longitude: float,
    start_hour: int,
    end_hour: int,
    *,
    day_offset: int = 1,
    timeout_seconds: int = 20,
) -> Tuple[str, TomorrowWindowSummary, List[HourlyForecastPoint]]:
    """
    Fetch Open-Meteo hourly forecast for a future day (local timezone at the coordinates)
    and craft a readable report focusing on a specified time window.

    Args:
        day_offset: Number of days from today (1 = tomorrow, 2 = day after, etc.)

    Returns:
        (report_text, summary_struct, hourly_points)

    hourly_points is designed for downstream use.
    """
    if not (-90.0 <= latitude <= 90.0):
        raise ValueError("latitude must be between -90 and 90")
    if not (-180.0 <= longitude <= 180.0):
        raise ValueError("longitude must be between -180 and 180")
    if not (0 <= start_hour <= 23 and 0 <= end_hour <= 23):
        raise ValueError("start_hour and end_hour must be between 0 and 23")

    forecast_date = date.today() + timedelta(days=day_offset)
    forecast_date_str = forecast_date.isoformat()

    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "timezone": "auto",
        "start_date": forecast_date_str,
        "end_date": forecast_date_str,
        "hourly": ",".join(
            [
                "temperature_2m",
                "precipitation",
                "precipitation_probability",
                "wind_speed_10m",
                "wind_gusts_10m",
                "weather_code",
                "wind_direction_10m",
                "cloud_cover",
                "cloud_cover_low",
                "cloud_cover_mid",
                "cloud_cover_high",
            ]
        ),
    }

    resp = requests.get(url, params=params, timeout=timeout_seconds)
    resp.raise_for_status()
    data: Dict[str, Any] = resp.json()

    tz = data.get("timezone") or "unknown"
    hourly = data.get("hourly") or {}
    units = data.get("hourly_units") or {}

    times: List[str] = hourly.get("time") or []
    temps: List[float] = hourly.get("temperature_2m") or []
    precips: List[float] = hourly.get("precipitation") or []
    precip_probs: List[Optional[float]] = hourly.get("precipitation_probability") or []
    wind_speeds: List[float] = hourly.get("wind_speed_10m") or []
    gusts: List[Optional[float]] = hourly.get("wind_gusts_10m") or []
    codes: List[Optional[int]] = hourly.get("weather_code") or []
    wind_directions: List[Optional[float]] = hourly.get("wind_direction_10m") or []
    cloud_covers: List[Optional[float]] = hourly.get("cloud_cover") or []
    cloud_covers_low: List[Optional[float]] = hourly.get("cloud_cover_low") or []
    cloud_covers_mid: List[Optional[float]] = hourly.get("cloud_cover_mid") or []
    cloud_covers_high: List[Optional[float]] = hourly.get("cloud_cover_high") or []

    if not times:
        raise RuntimeError("No hourly 'time' data returned by Open-Meteo")

    def safe_get(seq, idx):
        try:
            return seq[idx]
        except Exception:
            return None

    points: List[HourlyForecastPoint] = []
    for i, t in enumerate(times):
        dt = datetime.fromisoformat(t)
        if dt.date().isoformat() != forecast_date_str:
            continue
        if not (start_hour <= dt.hour <= end_hour):
            continue

        code = safe_get(codes, i)
        cond = _WMO_CODE_TO_TEXT.get(int(code), f"weather code {code}") if code is not None else "unknown"

        points.append(
            HourlyForecastPoint(
                time_local=t,
                hour=dt.hour,
                temperature=float(safe_get(temps, i)),
                precipitation=float(safe_get(precips, i)),
                precipitation_probability=(
                    float(safe_get(precip_probs, i)) if safe_get(precip_probs, i) is not None else None
                ),
                wind_speed=float(safe_get(wind_speeds, i)),
                wind_gusts=(float(safe_get(gusts, i)) if safe_get(gusts, i) is not None else None),
                weather_code=(int(code) if code is not None else None),
                wind_direction=(float(safe_get(wind_directions, i)) if safe_get(wind_directions, i) is not None else None),
                conditions=cond,
                cloud_cover=(float(safe_get(cloud_covers, i)) if safe_get(cloud_covers, i) is not None else None),
                cloud_cover_low=(float(safe_get(cloud_covers_low, i)) if safe_get(cloud_covers_low, i) is not None else None),
                cloud_cover_mid=(float(safe_get(cloud_covers_mid, i)) if safe_get(cloud_covers_mid, i) is not None else None),
                cloud_cover_high=(float(safe_get(cloud_covers_high, i)) if safe_get(cloud_covers_high, i) is not None else None),
            )
        )

    if not points:
        raise RuntimeError(f"No hourly points found for tomorrow {start_hour:02d}:00–{end_hour:02d}:00 in the API response")

    temp_min = min(p.temperature for p in points)
    temp_max = max(p.temperature for p in points)
    precip_total = sum(p.precipitation for p in points)
    probs = [p.precipitation_probability for p in points if p.precipitation_probability is not None]
    precip_prob_max = max(probs) if probs else None

    wind_avg = sum(p.wind_speed for p in points) / len(points)
    wind_max = max(p.wind_speed for p in points)
    gust_vals = [p.wind_gusts for p in points if p.wind_gusts is not None]
    gust_max = max(gust_vals) if gust_vals else None

    dominant_text = "unknown conditions"
    codes_present = [p.weather_code for p in points if p.weather_code is not None]
    if codes_present:
        from collections import Counter

        c = Counter(codes_present)
        top_count = c.most_common(1)[0][1]
        tied = [code for code, cnt in c.items() if cnt == top_count]
        chosen = max(tied)
        dominant_text = _WMO_CODE_TO_TEXT.get(int(chosen), f"weather code {chosen}")

    # Calculate dominant wind direction
    wind_directions_present = [p.wind_direction for p in points if p.wind_direction is not None]
    dominant_wind_direction = None
    if wind_directions_present:
        # Simple average for now, more complex circular mean might be needed for better accuracy
        dominant_wind_direction = sum(wind_directions_present) / len(wind_directions_present)

    caution_reasons: List[str] = []
    if precip_prob_max is not None and precip_prob_max >= 60:
        caution_reasons.append(f"high chance of precipitation (up to {precip_prob_max:.0f}%)")
    if precip_total >= 2.0:
        caution_reasons.append(f"wet conditions (≈{precip_total:.1f}{units.get('precipitation', 'mm')} total)")
    if wind_max >= 35:
        caution_reasons.append(f"windy (peaks around {wind_max:.0f}{units.get('wind_speed_10m', 'km/h')})")
    if gust_max is not None and gust_max >= 50:
        gust_unit = units.get("wind_gusts_10m", units.get("wind_speed_10m", "km/h"))
        caution_reasons.append(f"strong gusts (up to {gust_max:.0f}{gust_unit})")

    suggestion = "Looks generally OK for a hike." if not caution_reasons else (
        "Caution advised: " + "; ".join(caution_reasons) + "."
    )

    start_local = points[0].time_local
    end_local = points[-1].time_local

    summary = TomorrowWindowSummary(
        latitude=latitude,
        longitude=longitude,
        timezone=tz,
        window_start_local=start_local,
        window_end_local=end_local,
        temp_min=temp_min,
        temp_max=temp_max,
        temp_unit=units.get("temperature_2m", "°C"),
        precip_total=precip_total,
        precip_unit=units.get("precipitation", "mm"),
        precip_prob_max=precip_prob_max,
        wind_avg=wind_avg,
        wind_max=wind_max,
        gust_max=gust_max,
        wind_unit=units.get("wind_speed_10m", "km/h"),
        dominant_wind_direction=dominant_wind_direction,
        dominant_conditions=dominant_text,
    )

    temp_u = units.get("temperature_2m", "°C")
    pr_u = units.get("precipitation", "mm")
    wind_u = units.get("wind_speed_10m", "km/h")

    lines = []
    lines.append("Hour | Temp | Precip | Precip% | Wind | Gusts | Wind Dir | Conditions")
    lines.append("-----|------|--------|---------|------|-------|----------|-----------")
    for p in points:
        prob_str = f"{p.precipitation_probability:.0f}%" if p.precipitation_probability is not None else "—"
        gust_str = f"{p.wind_gusts:.0f}{wind_u}" if p.wind_gusts is not None else "—"
        wind_dir_str = f"{p.wind_direction:.0f}°" if p.wind_direction is not None else "—"
        lines.append(
            f"{p.hour:02d}:00 | "
            f"{p.temperature:.1f}{temp_u} | "
            f"{p.precipitation:.1f}{pr_u} | "
            f"{prob_str:>6} | "
            f"{p.wind_speed:.0f}{wind_u} | "
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
        gust_unit = units.get("wind_gusts_10m", wind_u)
        gust_phrase = f" Gusts up to {gust_max:.0f}{gust_unit}."
    
    time_window_str = f"{start_hour:02d}:00–{end_hour:02d}:00" if (start_hour != 0 or end_hour != 23) else "full day"
    
    report = (
        f"Tomorrow (local time: {tz}), {time_window_str}:\n"
        f"- Dominant conditions: {dominant_text}.\n"
        f"- Temperature: {temp_min:.1f}{temp_u} to {temp_max:.1f}{temp_u}.\n"
        f"- Precipitation: about {precip_total:.1f}{pr_u} total. {prob_phrase}\n"
        f"- Wind: average {wind_avg:.0f}{wind_u}, max {wind_max:.0f}{wind_u}.{gust_phrase}\n"
        f"- Dominant Wind Direction: {dominant_wind_direction:.0f}°\n"
        f"- Recommendation: {suggestion}\n\n"
        f"Hourly breakdown:\n" + "\n".join(lines)
    )

    return report, summary, points


def get_tomorrow_8_to_5_weather_report(
    latitude: float,
    longitude: float,
    *,
    timeout_seconds: int = 20,
) -> Tuple[str, TomorrowWindowSummary, List[HourlyForecastPoint]]:
    """
    Fetch Open-Meteo hourly forecast for tomorrow (local timezone at the coordinates)
    and craft a readable report focusing on 08:00–17:00 inclusive.

    Returns:
        (report_text, summary_struct, hourly_points)

    hourly_points is designed for downstream use (e.g. "how to dress" for a sub-interval).
    """
    return _get_tomorrow_weather_report_internal(
        latitude, longitude, 8, 17, timeout_seconds=timeout_seconds
    )


def get_tomorrow_weather_report(
    latitude: float,
    longitude: float,
    *,
    timeout_seconds: int = 20,
) -> Tuple[str, TomorrowWindowSummary, List[HourlyForecastPoint]]:
    """
    Fetch Open-Meteo hourly forecast for tomorrow (local timezone at the coordinates)
    and craft a readable report for the entire day.

    Returns:
        (report_text, summary_struct, hourly_points)

    hourly_points is designed for downstream use.
    """
    return _get_tomorrow_weather_report_internal(
        latitude, longitude, 0, 23, timeout_seconds=timeout_seconds
    )


def degrees_to_cardinal(degrees: Optional[float]) -> str:
    """Convert wind direction in degrees to 8-point compass direction."""
    if degrees is None:
        return "N/A"

    # Normalize to 0-360
    degrees = degrees % 360

    # 8 directions, each covering 45 degrees
    # N: 337.5-22.5, NE: 22.5-67.5, E: 67.5-112.5, etc.
    directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    index = round(degrees / 45) % 8
    return directions[index]


def get_historical_wind_analysis(
    latitude: float,
    longitude: float,
    analysis_date: date,
    *,
    days_back: int = 7,
    timeout_seconds: int = 20
) -> HistoricalWindAnalysis:
    """
    Fetch and analyze historical wind data for the past N days before the analysis_date.
    This is useful for avalanche risk assessment and understanding snow transport patterns.

    Args:
        latitude: Location latitude
        longitude: Location longitude
        analysis_date: The forecast date (will fetch data for days BEFORE this)
        days_back: Number of days to analyze (default: 7)
        timeout_seconds: API timeout

    Returns:
        HistoricalWindAnalysis with wind direction statistics
    """
    # Fetch data for the past N days
    end_date = analysis_date - timedelta(days=1)  # Day before forecast
    start_date = end_date - timedelta(days=days_back - 1)  # Go back N days

    start_date_str = start_date.isoformat()
    end_date_str = end_date.isoformat()
    date_range_str = f"{start_date_str} to {end_date_str}"

    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "timezone": "auto",
        "start_date": start_date_str,
        "end_date": end_date_str,
        "hourly": "wind_speed_10m,wind_gusts_10m,wind_direction_10m",
    }

    resp = requests.get(url, params=params, timeout=timeout_seconds)
    resp.raise_for_status()
    data: Dict[str, Any] = resp.json()

    hourly = data.get("hourly") or {}
    wind_speeds: List[Optional[float]] = hourly.get("wind_speed_10m") or []
    gusts: List[Optional[float]] = hourly.get("wind_gusts_10m") or []
    wind_directions: List[Optional[float]] = hourly.get("wind_direction_10m") or []

    # Analyze wind by direction
    direction_data = defaultdict(lambda: {"speeds": [], "gusts": [], "count": 0})

    total_hours = 0
    total_speed = 0.0
    max_gust_overall = 0.0

    for i in range(len(wind_directions)):
        direction_deg = wind_directions[i] if i < len(wind_directions) else None
        speed = wind_speeds[i] if i < len(wind_speeds) else None
        gust = gusts[i] if i < len(gusts) else None

        if direction_deg is None or speed is None:
            continue

        cardinal_dir = degrees_to_cardinal(direction_deg)
        direction_data[cardinal_dir]["count"] += 1
        direction_data[cardinal_dir]["speeds"].append(speed)

        if gust is not None:
            direction_data[cardinal_dir]["gusts"].append(gust)
            max_gust_overall = max(max_gust_overall, gust)

        total_hours += 1
        total_speed += speed

    # Calculate statistics for each direction
    direction_stats = []
    for direction in ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']:
        data_for_dir = direction_data[direction]
        count = data_for_dir["count"]

        if count == 0:
            continue

        percentage = (count / total_hours * 100) if total_hours > 0 else 0
        avg_speed = sum(data_for_dir["speeds"]) / count
        max_gust = max(data_for_dir["gusts"]) if data_for_dir["gusts"] else 0.0

        direction_stats.append(WindDirectionStats(
            direction=direction,
            percentage=percentage,
            avg_speed=avg_speed,
            max_gust=max_gust,
            hours_count=count
        ))

    # Sort by percentage (most common first)
    direction_stats.sort(key=lambda x: x.percentage, reverse=True)

    # Determine dominant direction
    dominant_direction = direction_stats[0].direction if direction_stats else "N/A"
    avg_wind_speed = total_speed / total_hours if total_hours > 0 else 0.0

    # Calculate actual days with data
    days_with_data = round(total_hours / 24, 1)

    return HistoricalWindAnalysis(
        date_analyzed=date_range_str,
        total_hours=total_hours,
        direction_stats=direction_stats,
        dominant_direction=dominant_direction,
        avg_wind_speed=avg_wind_speed,
        max_gust=max_gust_overall,
        days_requested=days_back,
        days_with_data=days_with_data,
        start_date=start_date_str,
        end_date=end_date_str
    )


def wind_chill_with_gusts(temp_c, wind_kmh, gust_kmh=None):
    """
    Calculate wind chill (°C) using sustained wind speed,
    with a small penalty for strong gusts (max wind).
    """

    # Wind chill is not defined in mild conditions
    if temp_c > 10 or wind_kmh < 4.8:
        return round(temp_c, 1)

    # Base wind chill (Environment Canada / NOAA)
    v16 = wind_kmh ** 0.16
    wind_chill = (
        13.12
        + 0.6215 * temp_c
        - 11.37 * v16
        + 0.3965 * temp_c * v16
    )

    # Optional gust penalty (uses max wind)
    if gust_kmh is None or temp_c > 5:
        return round(wind_chill, 1)

    gust_delta = gust_kmh - wind_kmh

    # Ignore minor gust differences
    if gust_delta < 5:
        return round(wind_chill, 1)

    # Gust penalty: sqrt scaling, capped
    # ~0.5–2.0 °C typical
    gust_penalty = min(2.0, 0.15 * (gust_delta ** 0.5))

    return round(wind_chill - gust_penalty, 1)



if __name__ == "__main__":
    # Cheile Turzii, Romania
    latitude = 46.5560
    longitude = 23.6990

    report, summary, hourly = get_tomorrow_weather_report(latitude, longitude)
    print(report)

    # Example downstream: pick a sub-interval, e.g. 11:00–14:00
    sub = [p for p in hourly if 11 <= p.hour <= 14]
    # print(sub)

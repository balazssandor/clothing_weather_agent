from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple
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
    conditions: str                 # resolved text


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

    dominant_conditions: str



def _get_tomorrow_weather_report_internal(
    latitude: float,
    longitude: float,
    start_hour: int,
    end_hour: int,
    *,
    timeout_seconds: int = 20,
) -> Tuple[str, TomorrowWindowSummary, List[HourlyForecastPoint]]:
    """
    Fetch Open-Meteo hourly forecast for tomorrow (local timezone at the coordinates)
    and craft a readable report focusing on a specified time window.

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

    tomorrow = date.today() + timedelta(days=1)
    tomorrow_str = tomorrow.isoformat()

    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "timezone": "auto",
        "start_date": tomorrow_str,
        "end_date": tomorrow_str,
        "hourly": ",".join(
            [
                "temperature_2m",
                "precipitation",
                "precipitation_probability",
                "wind_speed_10m",
                "wind_gusts_10m",
                "weather_code",
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
        if dt.date().isoformat() != tomorrow_str:
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
                conditions=cond,
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
        dominant_conditions=dominant_text,
    )

    temp_u = units.get("temperature_2m", "°C")
    pr_u = units.get("precipitation", "mm")
    wind_u = units.get("wind_speed_10m", "km/h")

    lines = []
    lines.append("Hour | Temp | Precip | Precip% | Wind | Gusts | Conditions")
    lines.append("-----|------|--------|---------|------|-------|-----------")
    for p in points:
        prob_str = f"{p.precipitation_probability:.0f}%" if p.precipitation_probability is not None else "—"
        gust_str = f"{p.wind_gusts:.0f}{wind_u}" if p.wind_gusts is not None else "—"
        lines.append(
            f"{p.hour:02d}:00 | "
            f"{p.temperature:.1f}{temp_u} | "
            f"{p.precipitation:.1f}{pr_u} | "
            f"{prob_str:>6} | "
            f"{p.wind_speed:.0f}{wind_u} | "
            f"{gust_str:>5} | "
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


if __name__ == "__main__":
    # Cheile Turzii, Romania
    latitude = 46.5560
    longitude = 23.6990

    report, summary, hourly = get_tomorrow_weather_report(latitude, longitude)
    print(report)

    # Example downstream: pick a sub-interval, e.g. 11:00–14:00
    sub = [p for p in hourly if 11 <= p.hour <= 14]
    # print(sub)

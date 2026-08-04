"""Live weather via the Open-Meteo API (keyless, free).

Open-Meteo's official Python client uses a binary flatbuffers protocol and pulls
heavy deps (openmeteo-sdk, pandas). Instead we call its plain JSON REST endpoint
directly with `requests` — same data, no native build steps, and it matches the
pattern we already use for Gemini and Google News. This keeps the backend working
on the newest Python versions where some native wheels are missing.

The frontend passes the user's device coordinates; we return a small, clean
"current weather" object plus a farmer-friendly description. Results are cached
per-location for a few minutes so we don't re-hit the API on every page load.
Any failure returns None so the UI can hide the card gracefully.
"""
import time

import requests

_ENDPOINT = "https://api.open-meteo.com/v1/forecast"
_GEOCODE_ENDPOINT = "https://geocoding-api.open-meteo.com/v1/search"

# WMO weather interpretation codes -> (short label, emoji). Open-Meteo returns a
# numeric weather_code; we translate it into something a farmer can read at a glance.
_WMO = {
    0: ("Clear sky", "☀️"),
    1: ("Mainly clear", "\U0001f324️"),
    2: ("Partly cloudy", "⛅"),
    3: ("Overcast", "☁️"),
    45: ("Fog", "\U0001f32b️"),
    48: ("Rime fog", "\U0001f32b️"),
    51: ("Light drizzle", "\U0001f326️"),
    53: ("Drizzle", "\U0001f326️"),
    55: ("Heavy drizzle", "\U0001f326️"),
    56: ("Freezing drizzle", "\U0001f327️"),
    57: ("Freezing drizzle", "\U0001f327️"),
    61: ("Light rain", "\U0001f327️"),
    63: ("Rain", "\U0001f327️"),
    65: ("Heavy rain", "\U0001f327️"),
    66: ("Freezing rain", "\U0001f327️"),
    67: ("Freezing rain", "\U0001f327️"),
    71: ("Light snow", "\U0001f328️"),
    73: ("Snow", "\U0001f328️"),
    75: ("Heavy snow", "\U0001f328️"),
    77: ("Snow grains", "\U0001f328️"),
    80: ("Light showers", "\U0001f326️"),
    81: ("Showers", "\U0001f327️"),
    82: ("Violent showers", "⛈️"),
    85: ("Snow showers", "\U0001f328️"),
    86: ("Snow showers", "\U0001f328️"),
    95: ("Thunderstorm", "⛈️"),
    96: ("Thunderstorm, hail", "⛈️"),
    99: ("Thunderstorm, hail", "⛈️"),
}


class WeatherService:
    def __init__(self, config):
        self.ttl = int(getattr(config, "WEATHER_CACHE_TTL", 600))  # 10 minutes
        self._cache = {}  # {(lat, lon): (fetched_at, data)}

    def geocode(self, query: str, count: int = 5):
        """Turn a place name into candidate coordinates. Returns a list of
        {name, admin1, country, latitude, longitude} (Sri Lanka first). Never raises."""
        query = (query or "").strip()
        if len(query) < 2:
            return []
        try:
            resp = requests.get(
                _GEOCODE_ENDPOINT,
                params={"name": query, "count": count, "language": "en", "format": "json"},
                timeout=10,
            )
            resp.raise_for_status()
            results = resp.json().get("results") or []
        except Exception:
            return []

        places = [
            {
                "name": r.get("name"),
                "admin1": r.get("admin1"),
                "country": r.get("country"),
                "country_code": r.get("country_code"),
                "latitude": r.get("latitude"),
                "longitude": r.get("longitude"),
            }
            for r in results
            if r.get("latitude") is not None and r.get("longitude") is not None
        ]
        # Surface Sri Lankan matches first — that's the primary audience.
        places.sort(key=lambda p: p.get("country_code") != "LK")
        return places

    def get_weather(self, lat: float, lon: float):
        """Return current weather for a coordinate, or None on failure. Never raises."""
        # Round the key so nearby requests share a cache entry.
        key = (round(lat, 2), round(lon, 2))
        now = time.time()
        cached = self._cache.get(key)
        if cached and now - cached[0] < self.ttl:
            return cached[1]
        try:
            data = self._fetch(lat, lon)
            self._cache[key] = (now, data)
            return data
        except Exception:
            return cached[1] if cached else None

    def _fetch(self, lat: float, lon: float):
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": ",".join(
                [
                    "temperature_2m",
                    "relative_humidity_2m",
                    "apparent_temperature",
                    "precipitation",
                    "weather_code",
                    "wind_speed_10m",
                    "is_day",
                ]
            ),
            "timezone": "auto",
        }
        resp = requests.get(_ENDPOINT, params=params, timeout=10)
        resp.raise_for_status()
        payload = resp.json()

        current = payload.get("current", {})
        units = payload.get("current_units", {})
        code = int(current.get("weather_code", -1))
        label, emoji = _WMO.get(code, ("Unknown", "\U0001f321️"))

        return {
            "temperature": current.get("temperature_2m"),
            "feels_like": current.get("apparent_temperature"),
            "humidity": current.get("relative_humidity_2m"),
            "precipitation": current.get("precipitation"),
            "wind_speed": current.get("wind_speed_10m"),
            "is_day": bool(current.get("is_day", 1)),
            "weather_code": code,
            "description": label,
            "emoji": emoji,
            "time": current.get("time"),
            "timezone": payload.get("timezone"),
            "units": {
                "temperature": units.get("temperature_2m", "°C"),
                "wind_speed": units.get("wind_speed_10m", "km/h"),
                "humidity": units.get("relative_humidity_2m", "%"),
                "precipitation": units.get("precipitation", "mm"),
            },
            "latitude": payload.get("latitude"),
            "longitude": payload.get("longitude"),
        }

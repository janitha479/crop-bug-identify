"""Live, location-aware context for the chatbot.

The knowledge base tells the assistant WHAT a pest is and how to treat it, but a
farmer's real questions are often about NOW: "is it a good day to spray?", "will
rain wash this off?", "what should I watch for next month?".

This module inspects the question and, when it is about weather/timing or pest
risk, pulls the live figures from the weather and forecast services and formats
them as an extra grounding block for the LLM. The model is told to use these real
numbers rather than guessing — and we only spend the API calls when the question
actually needs them.
"""

# Words that signal the answer depends on current conditions.
_WEATHER_WORDS = (
    "weather", "rain", "raining", "rainy", "shower", "wet", "dry", "temperature",
    "hot", "cold", "warm", "humid", "humidity", "wind", "windy", "sun", "sunny",
    "spray", "spraying", "irrigate", "irrigation", "water", "watering",
    "today", "tomorrow", "right now", "this week", "harvest", "plant", "sow",
)

# Words that signal the answer is about what's coming / seasonal risk.
_FORECAST_WORDS = (
    "forecast", "predict", "next month", "coming", "season", "seasonal", "expect",
    "outbreak", "risk", "warn", "warning", "upcoming", "future", "watch out",
    "prepare", "prevent", "which pest", "what pest",
)


def _matches(message: str, words) -> bool:
    lowered = (message or "").lower()
    return any(w in lowered for w in words)


def needs_weather(message: str) -> bool:
    return _matches(message, _WEATHER_WORDS)


def needs_forecast(message: str) -> bool:
    return _matches(message, _FORECAST_WORDS)


def build_live_context(services, message: str, lat, lon) -> str:
    """Return a text block of live conditions relevant to `message`, or "".

    Never raises — if a lookup fails we simply omit that part, and the assistant
    falls back to general advice.
    """
    if lat is None or lon is None:
        return ""

    want_weather = needs_weather(message)
    want_forecast = needs_forecast(message)
    if not (want_weather or want_forecast):
        return ""

    blocks = []

    if want_weather:
        try:
            w = services["weather"].get_weather(lat, lon)
        except Exception:
            w = None
        if w:
            blocks.append(
                "CURRENT WEATHER AT THE FARMER'S LOCATION (real, live data — use these "
                "actual numbers):\n"
                f"  - Conditions: {w.get('description')}\n"
                f"  - Temperature: {w.get('temperature')}°C "
                f"(feels like {w.get('feels_like')}°C)\n"
                f"  - Humidity: {w.get('humidity')}%\n"
                f"  - Wind speed: {w.get('wind_speed')} km/h\n"
                f"  - Precipitation right now: {w.get('precipitation')} mm"
            )

    if want_forecast:
        try:
            fc = services["forecast"].forecast(lat, lon, months_ahead=3)
            warnings = (fc.get("warnings") or [])[:5]
        except Exception:
            warnings = []
        if warnings:
            lines = [
                "PEST OUTBREAK FORECAST FOR THE COMING MONTHS AT THIS LOCATION "
                "(from our seasonal model blended with live climate):"
            ]
            for w in warnings:
                lines.append(
                    f"  - {w['common_name']}: {w['risk_level'].upper()} risk, "
                    f"{w['when_label']}. {w['reason']}"
                )
            blocks.append("\n".join(lines))

    if not blocks:
        return ""

    return "\n\n" + "\n\n".join(blocks)

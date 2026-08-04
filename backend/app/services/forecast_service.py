"""Outbreak forecast: predicts which pests are likely to surge in the coming
months at a given location.

How it works (transparent, rule-based — not a black box):
  1. A MOCK seasonal calendar (knowledge_base/outbreak_calendar.json) says which
     months each pest usually peaks in Sri Lanka, and the temperature/humidity
     that favour it. This stands in for real historical outbreak records until we
     have them.
  2. We look at the next few months from today. A pest whose peak falls in that
     window is "due".
  3. We then check the CURRENT climate (live temperature + humidity from the
     weather service) against that pest's favoured range. Matching conditions
     raise the risk; clearly wrong conditions lower it.
  4. The pest's own severity (from the knowledge base) nudges the final level.

The result is a ranked list of warnings with a plain-language reason, the crops
at stake, and a couple of prevention tips pulled straight from the knowledge base
— so the advice stays grounded in the project's own data.
"""
import calendar
import json
from datetime import date
from pathlib import Path

_MONTH = list(calendar.month_name)  # ['', 'January', ... 'December']


class ForecastService:
    def __init__(self, config, kb, weather):
        self.kb = kb
        self.weather = weather
        path = Path(config.KB_PATH).parent / "outbreak_calendar.json"
        with open(path, encoding="utf-8") as fh:
            raw = json.load(fh)
        self._calendar = raw.get("pests", {})
        self._meta = raw.get("_meta", {})

    # ------------------------------------------------------------------ #
    def forecast(self, lat: float, lon: float, months_ahead: int = 3, today: date = None):
        """Return an outbreak forecast for the next `months_ahead` months."""
        today = today or date.today()
        months_ahead = max(1, min(int(months_ahead), 6))

        # Months we're forecasting for, e.g. Aug -> [8, 9, 10].
        window = [((today.month - 1 + i) % 12) + 1 for i in range(months_ahead + 1)]

        # Live climate is our proxy for the season's conditions. If it's
        # unavailable (offline / blocked location), we forecast on season alone.
        weather = self.weather.get_weather(lat, lon)
        temp = weather.get("temperature") if weather else None
        humidity = weather.get("humidity") if weather else None

        warnings = []
        for label, cal in self._calendar.items():
            peak_in_window = [m for m in cal.get("peak_months", []) if m in window]
            if not peak_in_window:
                continue

            entry = self.kb.get(label) or {}
            if entry.get("beneficial"):
                continue  # never warn about beneficial insects

            when_month = self._earliest_in_window(peak_in_window, window)
            months_until = window.index(when_month)

            score, climate_note = self._score(cal, entry, temp, humidity, months_until)
            level = self._level(score)

            warnings.append(
                {
                    "pest": label,
                    "common_name": entry.get("common_name", label.replace("_", " ").title()),
                    "risk_level": level,
                    "risk_score": round(score, 1),
                    "peak_month": _MONTH[when_month],
                    "peak_month_num": when_month,
                    "months_until": months_until,
                    "when_label": self._when_label(months_until, when_month),
                    "season": cal.get("season", ""),
                    "reason": cal.get("driver", ""),
                    "climate_note": climate_note,
                    "crops_affected": entry.get("crops_affected", []),
                    "severity": entry.get("severity", "unknown"),
                    "prevention": (entry.get("prevention") or [])[:3],
                    "data_source": self._source_label(cal),
                }
            )

        # Highest risk first, then soonest.
        warnings.sort(key=lambda w: (-w["risk_score"], w["months_until"]))

        return {
            "location": {"latitude": lat, "longitude": lon},
            "generated_for": today.isoformat(),
            "months_ahead": months_ahead,
            "window_months": [_MONTH[m] for m in window],
            "current_climate": (
                {"temperature": temp, "humidity": humidity} if weather else None
            ),
            "data_note": "Predictions use a mock seasonal calendar (demo data), not "
            "validated field records.",
            "warnings": warnings,
        }

    # ------------------------------------------------------------------ #
    @staticmethod
    def _earliest_in_window(peaks, window):
        """The peak month that comes soonest given the window ordering."""
        return min(peaks, key=lambda m: window.index(m))

    @staticmethod
    def _score(cal, entry, temp, humidity, months_until):
        """Combine season + live climate + pest severity into a ~0-6 score.

        Weighted so that climate mismatch and timing genuinely separate pests,
        instead of everything landing in the top band."""
        # In-season baseline (only in-window pests reach this function).
        score = 2.0
        # Urgency: sooner peaks score higher (this-month +1.0 ... 3-months +0.1).
        score += max(0.0, 1.0 - 0.3 * months_until)

        climate_note = "Season-based estimate (no live weather)."
        if temp is not None and humidity is not None:
            temp_ok = cal["temp_min"] <= temp <= cal["temp_max"]
            humid_ok = humidity >= cal["humidity_min"]
            if temp_ok and humid_ok:
                score += 2.0
                climate_note = "Current temperature and humidity strongly favour this pest."
            elif temp_ok or humid_ok:
                score += 0.7
                climate_note = "Current conditions partly favour this pest."
            else:
                score -= 1.5
                climate_note = "Current conditions are unfavourable — lower risk, but stay alert."

        # A pest's own damage potential lifts the priority.
        sev = (entry.get("severity") or "").lower()
        score += {"high": 1.0, "medium": 0.4}.get(sev, 0.0)

        return max(0.0, score), climate_note

    @staticmethod
    def _level(score):
        if score >= 5.5:
            return "severe"
        if score >= 4.5:
            return "high"
        if score >= 3.3:
            return "moderate"
        return "low"

    @staticmethod
    def _source_label(cal):
        """Human-readable provenance for the peak-month timing."""
        src = cal.get("peak_source", "mock")
        recs = cal.get("gbif_records", 0)
        rank = (cal.get("gbif_rank") or "").lower()
        if src == "gbif_lk":
            return f"Real GBIF sightings — Sri Lanka ({recs:,} records, {rank})"
        if src == "gbif_region":
            return f"Real GBIF sightings — tropical Asia ({recs:,} records, {rank})"
        return "Seasonal estimate (no observation data)"

    @staticmethod
    def _when_label(months_until, when_month):
        if months_until == 0:
            return f"This month ({_MONTH[when_month]})"
        if months_until == 1:
            return f"Next month ({_MONTH[when_month]})"
        return f"In {months_until} months ({_MONTH[when_month]})"

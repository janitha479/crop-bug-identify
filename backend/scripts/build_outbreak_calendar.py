"""Rebuild the outbreak calendar's peak months from REAL GBIF observation data.

GBIF (gbif.org) is a free, open biodiversity database with billions of species
occurrence records, each carrying a species, a date and a location. This script
turns those records into a real seasonal calendar to replace the hand-written
mock `peak_months` in knowledge_base/outbreak_calendar.json.

For each pest already in the calendar we:
  1. Resolve its scientific name (from pests.json) to a GBIF taxon key.
  2. Ask GBIF for a month-by-month count of observations, first for Sri Lanka
     alone, and — because Sri Lanka has very few records — falling back to a
     tropical-Asia region (LK, IN, BD, MM, TH, VN, PH, KH, LA) whose seasons
     line up with Sri Lanka's. If even that is too sparse, we keep the existing
     mock months so the calendar is never left empty.
  3. Derive peak_months = the months whose counts are at least half of the
     busiest month (the clear seasonal peak).

We only touch `peak_months` and add provenance fields (source, record count,
matched taxon). The climate thresholds (temp/humidity) and the human-written
`driver`/`season` text are kept as-is — GBIF tells us WHEN, our own model still
says under WHICH conditions.

Usage (from the backend/ folder, using the project venv):
    .venv/Scripts/python.exe scripts/build_outbreak_calendar.py           # write
    .venv/Scripts/python.exe scripts/build_outbreak_calendar.py --dry-run # preview only
"""
import argparse
import json
import re
import sys
import time
from pathlib import Path

import requests

BACKEND = Path(__file__).resolve().parent.parent
KB_DIR = BACKEND / "knowledge_base"
PESTS_PATH = KB_DIR / "pests.json"
CAL_PATH = KB_DIR / "outbreak_calendar.json"
BACKUP_PATH = KB_DIR / "outbreak_calendar.mock.json"

GBIF = "https://api.gbif.org/v1"
# Tropical-Asia countries whose monsoon seasonality is comparable to Sri Lanka's.
REGION = ["LK", "IN", "BD", "MM", "TH", "VN", "PH", "KH", "LA"]
MIN_LK = 30       # enough Sri Lanka records to trust country-only seasonality
MIN_REGION = 40   # enough regional records to trust the fallback
HEADERS = {"User-Agent": "SmartPestDetection/1.0 (final-year project; calendar builder)"}

# Noise words to strip when turning a KB scientific_name into a clean query.
_NOISE = re.compile(
    r"\b(Order|Family|Superfamily|Suborder|Subfamily|Class|Genus|spp?\.?|incl\.?|e\.g\.?)\b",
    re.IGNORECASE,
)


def clean_name(sci: str) -> str:
    """Turn a messy KB scientific_name into GBIF's best single query term.

    'Scirpophaga incertulas (yellow stem borer) / Chilo spp.' -> 'Scirpophaga incertulas'
    'Order Coleoptera' -> 'Coleoptera'
    'Bactrocera spp. (e.g., Bactrocera dorsalis)' -> prefers the binomial in the ()
    """
    # Prefer a binomial given inside parentheses (e.g. "e.g., Bactrocera dorsalis").
    for inside in re.findall(r"\(([^)]*)\)", sci):
        m = re.search(r"[A-Z][a-z]+ [a-z]{3,}", inside)
        if m:
            return m.group(0)
    # Otherwise take the part before the first '/', drop parentheticals & noise.
    head = sci.split("/")[0]
    head = re.sub(r"\([^)]*\)", " ", head)
    head = _NOISE.sub(" ", head)
    return re.sub(r"\s+", " ", head).strip(" ,.")


def match_taxon(name: str):
    """Resolve a name to a GBIF (usageKey, scientificName, rank) or None."""
    r = requests.get(f"{GBIF}/species/match", params={"name": name}, headers=HEADERS, timeout=20)
    r.raise_for_status()
    d = r.json()
    if d.get("matchType") == "NONE" or "usageKey" not in d:
        return None
    return d["usageKey"], d.get("scientificName", name), d.get("rank", "")


def month_counts(taxon_key: int, countries):
    """Return (total, {month:int -> count}) for a taxon across the given countries."""
    params = [("taxonKey", taxon_key), ("limit", 0), ("facet", "month"), ("facetLimit", 12)]
    params += [("country", c) for c in countries]
    r = requests.get(f"{GBIF}/occurrence/search", params=params, headers=HEADERS, timeout=30)
    r.raise_for_status()
    d = r.json()
    facets = d.get("facets") or []
    counts = {}
    if facets:
        for f in facets[0].get("counts", []):
            try:
                counts[int(f["name"])] = f["count"]
            except (ValueError, KeyError):
                continue
    return d.get("count", 0), counts


def derive_peaks(counts: dict):
    """Peak months = those with count >= 50% of the busiest month (max 6)."""
    if not counts:
        return None
    top = max(counts.values())
    threshold = top * 0.5
    strong = [m for m, c in counts.items() if c >= threshold]
    # Keep the 6 busiest if a flat distribution qualifies too many.
    strong.sort(key=lambda m: -counts[m])
    return sorted(strong[:6])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="print results without writing")
    args = ap.parse_args()

    pests = json.loads(PESTS_PATH.read_text(encoding="utf-8"))
    original_text = CAL_PATH.read_text(encoding="utf-8")  # keep pristine copy for backup
    cal = json.loads(original_text)

    print(f"Rebuilding peak months for {len(cal['pests'])} pests from GBIF…\n")
    updated = 0

    for key, entry in cal["pests"].items():
        sci = pests.get(key, {}).get("scientific_name", key)
        query = clean_name(sci)
        source, records, taxon_label, rank = "mock", 0, None, None
        peaks = entry.get("peak_months")

        try:
            matched = match_taxon(query)
            if matched:
                taxon_key, taxon_label, rank = matched
                # 1) Sri Lanka only, if it has enough records.
                total_lk, counts_lk = month_counts(taxon_key, ["LK"])
                if total_lk >= MIN_LK:
                    peaks, source, records = derive_peaks(counts_lk), "gbif_lk", total_lk
                else:
                    # 2) Tropical-Asia region fallback.
                    total_r, counts_r = month_counts(taxon_key, REGION)
                    if total_r >= MIN_REGION:
                        peaks, source, records = derive_peaks(counts_r), "gbif_region", total_r
        except requests.RequestException as exc:
            print(f"  ! {key}: GBIF error ({exc}); keeping mock months")

        if not peaks:  # never leave a pest without months
            peaks, source = entry.get("peak_months"), "mock"

        entry["peak_months"] = peaks
        entry["peak_source"] = source
        entry["gbif_records"] = records
        entry["gbif_taxon"] = taxon_label
        entry["gbif_rank"] = rank
        if source != "mock":
            updated += 1

        tag = {"gbif_lk": "LK", "gbif_region": "region", "mock": "MOCK"}[source]
        print(f"  {key:20} [{tag:6}] {records:>5} recs  peaks={peaks}  ({query})")
        time.sleep(0.3)  # be polite to the free API

    cal["_meta"]["peak_months_source"] = (
        "peak_months derived from GBIF occurrence records where available "
        "(source/record count per pest); climate thresholds remain expert-set. "
        "'mock' entries fell back to the original hand-written calendar."
    )

    print(f"\n{updated}/{len(cal['pests'])} pests now use real GBIF data.")

    if args.dry_run:
        print("Dry run — no file written.")
        return

    # Preserve the original hand-written calendar once, before overwriting.
    if not BACKUP_PATH.exists():
        BACKUP_PATH.write_text(original_text, encoding="utf-8")
        print(f"Backed up original mock calendar -> {BACKUP_PATH.name}")
    CAL_PATH.write_text(json.dumps(cal, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {CAL_PATH}")


if __name__ == "__main__":
    sys.exit(main())

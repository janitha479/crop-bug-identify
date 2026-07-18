"""Knowledge-base service: loads pests.json and answers lookups.

The knowledge base is the project's *own* source of pest facts and treatments.
Keys in pests.json match the model's class labels.
"""
import json
from pathlib import Path
from typing import Optional


class KnowledgeBase:
    def __init__(self, kb_path: Path):
        self.kb_path = Path(kb_path)
        with open(self.kb_path, encoding="utf-8") as fh:
            raw = json.load(fh)
        # Drop meta block; keep only pest entries.
        self._entries = {k: v for k, v in raw.items() if not k.startswith("_")}
        self._meta = raw.get("_meta", {})

    @property
    def classes(self):
        return list(self._entries.keys())

    def get(self, label: str) -> Optional[dict]:
        """Return the KB entry for a class label, or None if unknown."""
        if label is None:
            return None
        entry = self._entries.get(label.lower())
        if entry is None:
            return None
        # Return a copy with the label attached for convenience.
        result = dict(entry)
        result["label"] = label.lower()
        return result

    def summary_text(self, label: str) -> str:
        """Plain-text summary used as grounding context for the LLM and as the
        template fallback reply."""
        entry = self.get(label)
        if entry is None:
            return f"No knowledge-base entry found for '{label}'."

        lines = []
        name = entry.get("common_name", label)
        sci = entry.get("scientific_name", "")
        header = name if not sci else f"{name} ({sci})"
        lines.append(header)

        if entry.get("beneficial"):
            lines.append(
                "This organism is BENEFICIAL — it helps the crop/soil and should NOT be killed."
            )
        sev = entry.get("severity")
        if sev and sev != "none":
            lines.append(f"Severity if left uncontrolled: {sev}.")

        crops = entry.get("crops_affected") or []
        if crops:
            lines.append("Crops affected: " + ", ".join(crops) + ".")

        def bullet_block(title, items):
            if not items:
                return
            lines.append(f"\n{title}:")
            for it in items:
                lines.append(f"  - {it}")

        bullet_block("Damage / symptoms", entry.get("damage_symptoms"))
        bullet_block("Organic / cultural control", entry.get("organic_treatments"))
        bullet_block("Chemical control (use with care)", entry.get("chemical_treatments"))
        bullet_block("Prevention", entry.get("prevention"))
        return "\n".join(lines)

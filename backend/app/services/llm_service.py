"""LLM service: turns knowledge-base facts into a conversational reply.

Uses Google Gemini (free tier) via its REST API when GEMINI_API_KEY is set,
strictly grounded in the knowledge-base text we pass in. With no key (or on any
error) it falls back to a readable template reply built from the same KB text —
so the chatbot always answers, online or offline, free or paid.

We call the REST endpoint directly with `requests` instead of the
google-generativeai SDK, to avoid heavy native dependencies (grpcio) that lack
wheels on the newest Python versions.
"""
from typing import Optional

import requests

SYSTEM_INSTRUCTION = (
    "You are Ksetha, a warm and down-to-earth farming friend who helps Sri Lankan "
    "farmers with pest problems. You talk the way a helpful neighbour who happens to "
    "know a lot about crops would talk — calm, encouraging, and human.\n\n"
    "HOW TO TALK:\n"
    "- Write in flowing, natural sentences and short paragraphs, like you're speaking "
    "to the farmer in person. Do NOT dump everything as a bullet-point list.\n"
    "- Open with a friendly, reassuring line (e.g. acknowledge the pest, tell them not "
    "to worry, it's manageable). Then explain what's going on in plain words.\n"
    "- Weave the treatment advice into the conversation. You may use a SHORT numbered "
    "list ONLY for step-by-step actions — but wrap it with real sentences before and "
    "after, never a bare list.\n"
    "- Sound confident and kind, never robotic. Avoid headings, markdown symbols, and "
    "jargon. Keep it to a few tight paragraphs, not an essay.\n"
    "- Reply in simple, clear English a busy farmer can read quickly.\n\n"
    "GROUND RULES (never break these):\n"
    "- Answer ONLY using the pest knowledge base provided to you. Never invent pesticide "
    "names, dosages, or facts that are not in the knowledge base.\n"
    "- If the knowledge base does not cover the question, gently say you're not sure and "
    "suggest checking with a local agricultural extension officer.\n"
    "- Always steer them to organic and cultural controls first; mention chemical options "
    "only as a last resort, with a short safety reminder to follow the label."
)

_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"


class LLMService:
    def __init__(self, config):
        self.config = config
        self.enabled = bool(config.GEMINI_API_KEY)
        self.model = config.GEMINI_MODEL
        if self.enabled:
            print(f"[llm_service] Gemini REST enabled ({self.model}).")
        else:
            print("[llm_service] No GEMINI_API_KEY — using template replies.")

    # ------------------------------------------------------------------ #
    def reply(self, user_message: str, kb_context: str, pest_name: Optional[str] = None) -> str:
        """Conversational answer grounded in kb_context."""
        if self.enabled:
            try:
                text = self._call_gemini(user_message, kb_context, pest_name)
                if text:
                    return text
            except Exception as exc:  # pragma: no cover - network dependent
                print(f"[llm_service] Gemini call failed: {exc}. Falling back to template.")
        return self._template_reply(user_message, kb_context, pest_name)

    # ------------------------------------------------------------------ #
    def _call_gemini(self, user_message: str, kb_context: str, pest_name: Optional[str]) -> str:
        prompt = self._build_prompt(user_message, kb_context, pest_name)
        url = _ENDPOINT.format(model=self.model)
        payload = {
            "system_instruction": {"parts": [{"text": SYSTEM_INSTRUCTION}]},
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            # Gemini 2.5/3.x are "thinking" models: they spend a chunk of the token
            # budget (~600+) on hidden reasoning before writing. The old 800 cap left
            # too little for the visible reply, truncating it mid-sentence. 2048 gives
            # the answer plenty of room. (thinkingBudget can't be disabled on these.)
            "generationConfig": {"temperature": 0.6, "maxOutputTokens": 2048},
        }
        resp = requests.post(
            url,
            params={"key": self.config.GEMINI_API_KEY},
            json=payload,
            timeout=20,
        )
        resp.raise_for_status()
        data = resp.json()
        candidates = data.get("candidates") or []
        if not candidates:
            return ""
        parts = candidates[0].get("content", {}).get("parts", [])
        return "".join(p.get("text", "") for p in parts).strip()

    # ------------------------------------------------------------------ #
    @staticmethod
    def _build_prompt(user_message: str, kb_context: str, pest_name: Optional[str]) -> str:
        header = f"Detected/asked-about pest: {pest_name}\n\n" if pest_name else ""
        question = user_message.strip() if user_message.strip() else (
            "Explain what this is and how to control it."
        )
        return (
            f"{header}KNOWLEDGE BASE (your only source of truth):\n"
            f'"""\n{kb_context}\n"""\n\n'
            f"Farmer's question: {question}\n\n"
            "Reply as Ksetha would — warm, reassuring, in natural flowing sentences and "
            "short paragraphs (not a bare bullet list) — using only the knowledge base above."
        )

    @staticmethod
    def _template_reply(user_message: str, kb_context: str, pest_name: Optional[str]) -> str:
        """Readable reply assembled directly from the KB text (no LLM)."""
        if pest_name:
            intro = (
                f"Don't worry — it looks like you're dealing with {pest_name}, and "
                "that's something you can manage. Here's what I know that should help:\n\n"
            )
        else:
            intro = "Happy to help. Here's what I can tell you:\n\n"
        note = (
            "\n\nMy advice: start with the organic and cultural methods first — they're "
            "safer for you and your soil. Only reach for chemical sprays if you really "
            "need to, and always follow the product label. You've got this!"
        )
        return f"{intro}{kb_context}{note}"

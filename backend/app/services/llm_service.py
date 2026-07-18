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
    "You are a friendly agricultural pest-advisory assistant for Sri Lankan farmers. "
    "Answer ONLY using the pest knowledge base provided to you. Do not invent pesticide "
    "names, dosages, or facts that are not in the knowledge base. If the knowledge base "
    "does not cover the question, say so and suggest consulting a local agricultural "
    "extension officer. Keep replies clear, practical, and encouraging. Prefer organic/"
    "cultural controls first, mention chemical options as a last resort with a safety note. "
    "Use short paragraphs or bullet points. Reply in simple English."
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
            "generationConfig": {"temperature": 0.4, "maxOutputTokens": 800},
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
            "Write a helpful reply using only the knowledge base above."
        )

    @staticmethod
    def _template_reply(user_message: str, kb_context: str, pest_name: Optional[str]) -> str:
        """Readable reply assembled directly from the KB text (no LLM)."""
        intro = ""
        if pest_name:
            intro = f"Here's what I know about {pest_name}:\n\n"
        note = (
            "\n\nTip: try organic/cultural methods first; use chemicals only if needed "
            "and always follow the product label."
        )
        return f"{intro}{kb_context}{note}"

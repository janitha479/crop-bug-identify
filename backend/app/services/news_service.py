"""Live agriculture news, fetched server-side from Google News RSS.

Google News RSS is keyless and CORS-free from the server, so we proxy it here and
hand the frontend clean JSON. Results are cached in-memory for a few minutes so we
don't hammer the feed on every page load. Any failure returns an empty list (the
frontend falls back to its curated tips), so the site never breaks if we're offline.
"""
import re
import time
import xml.etree.ElementTree as ET
from html import unescape

import requests

_TAG_RE = re.compile(r"<[^>]+>")


def _strip_html(text: str) -> str:
    if not text:
        return ""
    return unescape(_TAG_RE.sub("", text)).strip()


class NewsService:
    def __init__(self, config):
        # A Sri-Lanka-focused agriculture query.
        self.query = getattr(
            config, "NEWS_QUERY", "Sri Lanka agriculture OR farming OR paddy OR crops"
        )
        self.ttl = int(getattr(config, "NEWS_CACHE_TTL", 900))  # 15 minutes
        self.limit = int(getattr(config, "NEWS_LIMIT", 12))
        self._cache = None
        self._fetched_at = 0.0

    @property
    def _url(self) -> str:
        from urllib.parse import quote_plus

        return (
            "https://news.google.com/rss/search?"
            f"q={quote_plus(self.query)}&hl=en-US&gl=US&ceid=US:en"
        )

    def get_news(self, force: bool = False):
        """Return a list of news items (cached). Never raises."""
        now = time.time()
        if not force and self._cache is not None and now - self._fetched_at < self.ttl:
            return self._cache
        try:
            items = self._fetch()
            self._cache = items
            self._fetched_at = now
            return items
        except Exception:
            # Keep any stale cache; otherwise signal "no live news" with an empty list.
            return self._cache or []

    def _fetch(self):
        resp = requests.get(
            self._url,
            timeout=10,
            headers={"User-Agent": "SmartPestDetection/1.0 (news reader)"},
        )
        resp.raise_for_status()
        root = ET.fromstring(resp.content)

        items = []
        for item in root.iterfind(".//item"):
            title = _strip_html(item.findtext("title", ""))
            link = (item.findtext("link", "") or "").strip()
            pub = (item.findtext("pubDate", "") or "").strip()
            source_el = item.find("source")
            source = (source_el.text or "").strip() if source_el is not None else ""

            # Google News titles are "Headline - Source"; drop the trailing source.
            if source and title.endswith(f" - {source}"):
                title = title[: -(len(source) + 3)].strip()

            if not title or not link:
                continue
            items.append(
                {
                    "title": title,
                    "link": link,
                    "source": source,
                    "published": pub,
                }
            )
            if len(items) >= self.limit:
                break
        return items

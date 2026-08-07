"""Styled PDF farm advisory report (fpdf2).

Layout: a branded header band and a page-numbered footer repeated on every page,
then the content organised into labelled sections - farmer details, a summary
strip, a farms table, per-farm detail cards and the recent scan history.

Only the built-in Helvetica core font is used, which keeps the file small but
means text must be Latin-1 encodable; `_s()` sanitises anything that isn't.
"""
from datetime import datetime

from fpdf import FPDF, XPos, YPos

# Brand palette (RGB), mirroring the web design system.
FOREST = (20, 59, 37)
BRAND = (45, 122, 79)
LIGHT = (233, 242, 234)
LINE = (214, 226, 216)
INK = (22, 38, 28)
MUTED = (110, 125, 115)
WHITE = (255, 255, 255)

RISK_COLOURS = {
    "severe": (179, 45, 45),
    "high": (194, 102, 28),
    "moderate": (168, 131, 15),
    "low": (45, 122, 79),
}

_REPLACEMENTS = {
    "—": "-", "–": "-", "‘": "'", "’": "'",
    "“": '"', "”": '"', "…": "...", "·": "-",
}


def _s(text):
    """Make text safe for the Latin-1 core fonts (drops emoji, normalises dashes)."""
    if text is None:
        return ""
    out = str(text)
    for bad, good in _REPLACEMENTS.items():
        out = out.replace(bad, good)
    return out.encode("latin-1", "ignore").decode("latin-1")


class FarmReport(FPDF):
    def __init__(self, farmer_name, generated):
        super().__init__(orientation="P", unit="mm", format="A4")
        self.farmer_name = _s(farmer_name)
        self.generated = generated
        self.set_auto_page_break(auto=True, margin=22)
        self.set_margins(15, 15, 15)

    # ---------------------------------------------------------------- header
    def header(self):
        self.set_fill_color(*FOREST)
        self.rect(0, 0, self.w, 26, style="F")

        # Accent rule under the band.
        self.set_fill_color(*BRAND)
        self.rect(0, 26, self.w, 1.2, style="F")

        self.set_xy(15, 7)
        self.set_text_color(*WHITE)
        self.set_font("Helvetica", "B", 13)
        self.cell(120, 6, "Smart Pest Detection & Prediction", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        self.set_x(15)
        self.set_font("Helvetica", "", 9)
        self.set_text_color(200, 216, 204)
        self.cell(120, 5, "Farm Advisory Report")

        # Right-aligned meta.
        self.set_xy(-95, 8)
        self.set_font("Helvetica", "", 8.5)
        self.set_text_color(200, 216, 204)
        self.cell(80, 5, _s(self.farmer_name), align="R",
                  new_x=XPos.RIGHT, new_y=YPos.NEXT)
        self.set_xy(-95, 13.5)
        self.cell(80, 5, self.generated.strftime("%d %b %Y, %H:%M UTC"), align="R")

        self.set_y(36)
        self.set_text_color(*INK)

    # ---------------------------------------------------------------- footer
    def footer(self):
        self.set_y(-16)
        self.set_draw_color(*LINE)
        self.set_line_width(0.2)
        self.line(15, self.get_y(), self.w - 15, self.get_y())

        self.set_y(-13)
        self.set_font("Helvetica", "", 7.5)
        self.set_text_color(*MUTED)
        self.cell(
            120, 5,
            "Advisory only. Confirm with your local agricultural extension officer.",
        )
        self.set_font("Helvetica", "", 8)
        self.cell(0, 5, f"Page {self.page_no()} of {{nb}}", align="R")

    # --------------------------------------------------------------- helpers
    def section_title(self, text):
        if self.get_y() > self.h - 60:
            self.add_page()
        self.ln(3)
        self.set_font("Helvetica", "B", 11.5)
        self.set_text_color(*FOREST)
        self.cell(0, 7, _s(text), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_draw_color(*BRAND)
        self.set_line_width(0.5)
        y = self.get_y()
        self.line(15, y, 15 + 22, y)
        self.ln(3.5)
        self.set_text_color(*INK)

    def kv_box(self, pairs):
        """A light panel of label/value pairs, two per row."""
        x0, y0 = 15, self.get_y()
        width = self.w - 30
        rows = (len(pairs) + 1) // 2
        height = rows * 9 + 6

        self.set_fill_color(*LIGHT)
        self.set_draw_color(*LINE)
        self.set_line_width(0.2)
        self.rect(x0, y0, width, height, style="DF")

        col_w = width / 2
        for i, (label, value) in enumerate(pairs):
            col, row = i % 2, i // 2
            x = x0 + col * col_w + 5
            y = y0 + 4 + row * 9
            self.set_xy(x, y)
            self.set_font("Helvetica", "", 7.5)
            self.set_text_color(*MUTED)
            self.cell(col_w - 10, 3.6, _s(label).upper(),
                      new_x=XPos.LEFT, new_y=YPos.NEXT)
            self.set_x(x)
            self.set_font("Helvetica", "B", 9.5)
            self.set_text_color(*INK)
            self.cell(col_w - 10, 4.6, _s(value))

        self.set_y(y0 + height + 4)

    def stat_row(self, stats):
        """Evenly spaced summary tiles across the page."""
        x0, y0 = 15, self.get_y()
        width = self.w - 30
        gap = 4
        tile_w = (width - gap * (len(stats) - 1)) / len(stats)
        height = 17

        for i, (value, label) in enumerate(stats):
            x = x0 + i * (tile_w + gap)
            self.set_fill_color(*WHITE)
            self.set_draw_color(*LINE)
            self.rect(x, y0, tile_w, height, style="DF")
            self.set_fill_color(*BRAND)
            self.rect(x, y0, 1.2, height, style="F")

            self.set_xy(x + 5, y0 + 3.5)
            self.set_font("Helvetica", "B", 14)
            self.set_text_color(*INK)
            self.cell(tile_w - 8, 6, _s(value), new_x=XPos.LEFT, new_y=YPos.NEXT)
            self.set_x(x + 5)
            self.set_font("Helvetica", "", 7.5)
            self.set_text_color(*MUTED)
            self.cell(tile_w - 8, 4, _s(label).upper())

        self.set_y(y0 + height + 5)

    def _fit(self, text, width):
        """Trim text with an ellipsis so it never bleeds into the next column."""
        text = _s(text)
        avail = width - 3  # keep a small right-hand gutter
        if self.get_string_width(text) <= avail:
            return text
        while text and self.get_string_width(text + "...") > avail:
            text = text[:-1]
        return text.rstrip() + "..."

    def table(self, headers, widths, rows, risk_col=None):
        """Simple striped table. `risk_col` colours that column by risk level."""
        self.set_font("Helvetica", "B", 8)
        self.set_fill_color(*FOREST)
        self.set_text_color(*WHITE)
        for h, w in zip(headers, widths):
            self.cell(w, 7, self._fit(h, w), border=0, align="L", fill=True)
        self.ln()

        self.set_font("Helvetica", "", 8.5)
        for i, row in enumerate(rows):
            if self.get_y() > self.h - 30:
                self.add_page()
                self.set_font("Helvetica", "B", 8)
                self.set_fill_color(*FOREST)
                self.set_text_color(*WHITE)
                for h, w in zip(headers, widths):
                    self.cell(w, 7, self._fit(h, w), border=0, fill=True)
                self.ln()
                self.set_font("Helvetica", "", 8.5)

            fill = i % 2 == 1
            self.set_fill_color(248, 251, 248)
            for c, (cell_text, w) in enumerate(zip(row, widths)):
                if risk_col is not None and c == risk_col:
                    key = str(cell_text).split()[-1].strip("()").lower()
                    self.set_text_color(*RISK_COLOURS.get(key, INK))
                    self.set_font("Helvetica", "B", 8.5)
                else:
                    self.set_text_color(*INK)
                    self.set_font("Helvetica", "", 8.5)
                self.cell(w, 6.5, self._fit(cell_text, w), border=0, fill=fill)
            self.ln()

        self.set_text_color(*INK)
        self.ln(1)

    def note(self, text):
        self.ln(2)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(*MUTED)
        self.multi_cell(0, 4.2, _s(text))
        self.set_text_color(*INK)

    def empty_note(self, text):
        self.set_font("Helvetica", "I", 9)
        self.set_text_color(*MUTED)
        self.cell(0, 6, _s(text), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_text_color(*INK)


def build_report(user, snapshots, detections):
    """Render the report. `snapshots` is a list of {farm, weather, top_risk}."""
    generated = datetime.utcnow()
    who = user.full_name or user.email

    pdf = FarmReport(who, generated)
    pdf.alias_nb_pages()
    pdf.add_page()

    # ----- Farmer details -------------------------------------------------
    pdf.section_title("Farmer details")
    high = sum(
        1 for s in snapshots
        if s["top_risk"] and s["top_risk"]["risk_level"] in ("severe", "high")
    )
    pdf.kv_box([
        ("Name", user.full_name or "Not provided"),
        ("Email", user.email),
        ("District", user.district or "Not provided"),
        ("Report generated", generated.strftime("%d %B %Y, %H:%M UTC")),
    ])

    # ----- Summary --------------------------------------------------------
    pdf.section_title("Summary")
    pdf.stat_row([
        (str(len(snapshots)), "Farms registered"),
        (str(high), "At high risk"),
        (str(len(detections)), "Recent scans"),
    ])

    # ----- Farms overview -------------------------------------------------
    pdf.section_title("Registered farms")
    if not snapshots:
        pdf.empty_note("No farms have been saved yet.")
    else:
        rows = []
        for s in snapshots:
            f, w, r = s["farm"], s["weather"], s["top_risk"]
            weather_txt = (
                f"{round(w['temperature'])} C, {w['description']}, {round(w['humidity'])}% RH"
                if w else "Unavailable"
            )
            risk_txt = (
                f"{r['common_name']} ({r['risk_level']})" if r else "None predicted"
            )
            place = f["place_label"] or f"{f['latitude']:.2f}, {f['longitude']:.2f}"
            rows.append([f["name"], place, weather_txt, risk_txt])
        pdf.table(
            ["Farm", "Location", "Current weather", "Top pest risk"],
            [38, 45, 52, 45],
            rows,
            risk_col=3,
        )

    # ----- Per-farm detail ------------------------------------------------
    if snapshots:
        pdf.section_title("Farm details and recommended action")
        for s in snapshots:
            f, w, r = s["farm"], s["weather"], s["top_risk"]
            if pdf.get_y() > pdf.h - 55:
                pdf.add_page()

            y0 = pdf.get_y()
            pdf.set_draw_color(*LINE)
            pdf.set_fill_color(*WHITE)
            pdf.rect(15, y0, pdf.w - 30, 26, style="DF")
            lvl = r["risk_level"] if r else "low"
            pdf.set_fill_color(*RISK_COLOURS.get(lvl, BRAND))
            pdf.rect(15, y0, 1.5, 26, style="F")

            pdf.set_xy(20, y0 + 3)
            pdf.set_font("Helvetica", "B", 10)
            pdf.cell(90, 5, pdf._fit(f["name"], 90), new_x=XPos.LEFT, new_y=YPos.NEXT)
            pdf.set_x(20)
            pdf.set_font("Helvetica", "", 8)
            pdf.set_text_color(*MUTED)
            place = f["place_label"] or f"{f['latitude']:.4f}, {f['longitude']:.4f}"
            pdf.cell(120, 4.5, pdf._fit(place, 120), new_x=XPos.LEFT, new_y=YPos.NEXT)

            pdf.set_x(20)
            pdf.set_text_color(*INK)
            pdf.set_font("Helvetica", "", 8.5)
            if w:
                pdf.cell(120, 5,
                         _s(f"Weather: {round(w['temperature'])} C, {w['description']}, "
                            f"humidity {round(w['humidity'])}%, wind {round(w['wind_speed'])} km/h"),
                         new_x=XPos.LEFT, new_y=YPos.NEXT)
            else:
                pdf.cell(120, 5, "Weather: unavailable", new_x=XPos.LEFT, new_y=YPos.NEXT)

            pdf.set_x(20)
            if r:
                pdf.set_font("Helvetica", "B", 8.5)
                pdf.set_text_color(*RISK_COLOURS.get(lvl, INK))
                pdf.cell(60, 5, _s(f"Watch for: {r['common_name']} ({lvl})"))
                pdf.set_text_color(*MUTED)
                pdf.set_font("Helvetica", "", 8.5)
                pdf.cell(60, 5, _s(r["when_label"]))
            else:
                pdf.set_text_color(*MUTED)
                pdf.cell(120, 5, "No significant pest risk predicted.")

            pdf.set_text_color(*INK)
            pdf.set_y(y0 + 30)

    # ----- Scan history ---------------------------------------------------
    pdf.section_title("Recent pest scans")
    if not detections:
        pdf.empty_note("No pest scans have been recorded yet.")
    else:
        rows = [
            [
                d.created_at.strftime("%d %b %Y") if d.created_at else "",
                d.common_name or d.pest_label or "Unknown",
                f"{round(d.confidence * 100)}%",
                "Confident" if d.confident == "yes" else "Uncertain",
            ]
            for d in detections
        ]
        pdf.table(["Date", "Pest identified", "Confidence", "Result"],
                  [32, 78, 30, 40], rows)

    # ----- Notes ----------------------------------------------------------
    pdf.section_title("About this report")
    pdf.note(
        "Pest predictions combine a seasonal outbreak calendar (derived from GBIF "
        "occurrence records where available) with live weather at each farm location. "
        "Identifications come from a custom-trained convolutional neural network and are "
        "reported with a confidence score. This report is advisory: always confirm "
        "findings and treatment choices with your local agricultural extension officer "
        "before applying any control measure."
    )

    return bytes(pdf.output())

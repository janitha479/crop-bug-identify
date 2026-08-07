"""Farm & dashboard endpoints (all require a signed-in farmer).

- CRUD for saved farms
- /farms/overview: weather + top pest risk for ALL farms in one call
- /detections: the farmer's pest scan history
- /report.pdf: a downloadable summary of farms, weather and risks
"""
from datetime import datetime
from io import BytesIO

from flask import Blueprint, current_app, g, jsonify, request, send_file

from .auth import login_required
from .models import Detection, Farm

farms_api = Blueprint("farms_api", __name__)


def _services():
    return current_app.extensions["pest_services"]


def _farm_snapshot(farm, want_risk=True):
    """Weather (+ optional top pest risk) for one farm."""
    svc = _services()
    weather = svc["weather"].get_weather(farm.latitude, farm.longitude)
    top_risk = None
    if want_risk:
        fc = svc["forecast"].forecast(farm.latitude, farm.longitude, months_ahead=1)
        warnings = fc.get("warnings") or []
        if warnings:
            top = warnings[0]
            top_risk = {
                "common_name": top["common_name"],
                "risk_level": top["risk_level"],
                "when_label": top["when_label"],
            }
    return {"farm": farm.to_dict(), "weather": weather, "top_risk": top_risk}


@farms_api.get("/farms")
@login_required
def list_farms():
    farms = g.db.query(Farm).filter_by(user_id=g.user.id).order_by(Farm.created_at).all()
    return jsonify({"farms": [f.to_dict() for f in farms]})


@farms_api.post("/farms")
@login_required
def create_farm():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    try:
        lat = float(data["latitude"])
        lon = float(data["longitude"])
    except (KeyError, TypeError, ValueError):
        return jsonify({"error": "latitude and longitude are required numbers."}), 400
    if not name:
        return jsonify({"error": "Give your farm a name."}), 400
    if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
        return jsonify({"error": "Coordinates are out of range."}), 400

    farm = Farm(
        user_id=g.user.id,
        name=name,
        latitude=lat,
        longitude=lon,
        place_label=(data.get("place_label") or "").strip(),
    )
    g.db.add(farm)
    g.db.commit()
    return jsonify({"farm": farm.to_dict()}), 201


@farms_api.delete("/farms/<int:farm_id>")
@login_required
def delete_farm(farm_id):
    farm = g.db.get(Farm, farm_id)
    if farm is None or farm.user_id != g.user.id:
        return jsonify({"error": "Farm not found."}), 404
    g.db.delete(farm)
    g.db.commit()
    return jsonify({"ok": True})


@farms_api.get("/farms/overview")
@login_required
def farms_overview():
    """Weather + top pest risk for every saved farm, in one response."""
    farms = g.db.query(Farm).filter_by(user_id=g.user.id).order_by(Farm.created_at).all()
    items = [_farm_snapshot(f) for f in farms]
    return jsonify({"count": len(items), "farms": items})


@farms_api.get("/detections")
@login_required
def list_detections():
    rows = (
        g.db.query(Detection)
        .filter_by(user_id=g.user.id)
        .order_by(Detection.created_at.desc())
        .limit(50)
        .all()
    )
    return jsonify({"detections": [d.to_dict() for d in rows]})


@farms_api.get("/report.pdf")
@login_required
def report_pdf():
    """Styled PDF summary of the farmer's farms, current weather and top risks."""
    # Imported lazily so the app still runs if fpdf2 isn't installed.
    from .pdf_report import build_report

    farms = g.db.query(Farm).filter_by(user_id=g.user.id).order_by(Farm.created_at).all()
    recent = (
        g.db.query(Detection)
        .filter_by(user_id=g.user.id)
        .order_by(Detection.created_at.desc())
        .limit(10)
        .all()
    )

    snapshots = [_farm_snapshot(f) for f in farms]
    out = build_report(g.user, snapshots, recent)

    return send_file(
        BytesIO(out),
        mimetype="application/pdf",
        as_attachment=True,
        download_name="farm-report.pdf",
    )

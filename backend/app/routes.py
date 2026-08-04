"""REST API endpoints for the pest chatbot."""
import io

from flask import Blueprint, current_app, jsonify, request
from PIL import Image, UnidentifiedImageError

api = Blueprint("api", __name__)


def _allowed(filename: str) -> bool:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return ext in current_app.config["APP_CONFIG"].ALLOWED_EXTENSIONS


def _services():
    return current_app.extensions["pest_services"]


@api.get("/health")
def health():
    svc = _services()
    return jsonify(
        {
            "status": "ok",
            "model": "mock" if svc["model"].is_mock else "trained",
            "llm": "gemini" if svc["llm"].enabled else "template",
            "classes": svc["kb"].classes,
        }
    )


@api.get("/news")
def news():
    """Live agriculture news headlines (Sri Lanka focused), proxied from Google
    News RSS server-side. Returns {items: [...]}; an empty list means no live feed
    is available and the frontend should fall back to its curated tips."""
    svc = _services()
    items = svc["news"].get_news()
    return jsonify({"items": items, "count": len(items)})


@api.get("/geocode")
def geocode():
    """Look up coordinates for a place name (Open-Meteo geocoding, keyless).

    Query param:
      q (str, required) — place name, e.g. "Kandy"

    Returns {results: [{name, admin1, country, latitude, longitude}, ...]}."""
    query = (request.args.get("q") or "").strip()
    if len(query) < 2:
        return jsonify({"error": "Provide a place name of at least 2 characters."}), 400
    results = _services()["weather"].geocode(query)
    return jsonify({"results": results, "count": len(results)})


@api.get("/weather")
def weather():
    """Current weather for the user's location, via Open-Meteo (keyless).

    Query params:
      lat (float, required) — latitude from the browser's geolocation
      lon (float, required) — longitude

    Returns {weather: {...}} or {weather: null} if the lookup fails."""
    try:
        lat = float(request.args.get("lat", ""))
        lon = float(request.args.get("lon", ""))
    except (TypeError, ValueError):
        return jsonify({"error": "lat and lon query params are required (numbers)."}), 400

    if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
        return jsonify({"error": "lat/lon out of range."}), 400

    data = _services()["weather"].get_weather(lat, lon)
    return jsonify({"weather": data})


@api.get("/forecast")
def forecast():
    """Outbreak forecast for the next few months at the user's location.

    Query params:
      lat (float, required) — latitude
      lon (float, required) — longitude
      months (int, optional, default 3, max 6) — how far ahead to look

    Returns a ranked list of likely pest surges with reasons and prevention tips."""
    try:
        lat = float(request.args.get("lat", ""))
        lon = float(request.args.get("lon", ""))
    except (TypeError, ValueError):
        return jsonify({"error": "lat and lon query params are required (numbers)."}), 400

    if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
        return jsonify({"error": "lat/lon out of range."}), 400

    try:
        months = int(request.args.get("months", 3))
    except (TypeError, ValueError):
        months = 3

    data = _services()["forecast"].forecast(lat, lon, months_ahead=months)
    return jsonify(data)


@api.post("/detect")
def detect():
    """Image -> pest identification + treatment reply.

    multipart/form-data:
      image   (file, required)
      message (str, optional)  — a question to answer alongside the detection
    """
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded. Send a file under the 'image' field."}), 400

    file = request.files["image"]
    if not file or file.filename == "":
        return jsonify({"error": "Empty file."}), 400
    if not _allowed(file.filename):
        return jsonify({"error": "Unsupported file type. Use PNG, JPG, JPEG, WEBP or BMP."}), 400

    try:
        image = Image.open(io.BytesIO(file.read()))
        image.load()
    except (UnidentifiedImageError, OSError):
        return jsonify({"error": "Could not read that image file."}), 400

    cfg = current_app.config["APP_CONFIG"]
    svc = _services()

    predictions = svc["model"].predict(image, top_k=3)
    top = predictions[0]
    runner_up = predictions[1]["confidence"] if len(predictions) > 1 else 0.0
    # Assert if the top guess clears the threshold outright, or if it's a clear
    # leader over the runner-up (borderline-but-obvious, e.g. 54% vs 42%).
    confident = top["confidence"] >= cfg.CONFIDENCE_THRESHOLD or (
        top["confidence"] >= cfg.MARGIN_MIN_CONFIDENCE
        and top["confidence"] - runner_up >= cfg.MARGIN_GAP
    )

    kb_entry = svc["kb"].get(top["label"]) if confident else None
    user_message = (request.form.get("message") or "").strip()

    if confident and kb_entry is not None:
        kb_text = svc["kb"].summary_text(top["label"])
        reply = svc["llm"].reply(
            user_message=user_message,
            kb_context=kb_text,
            pest_name=kb_entry.get("common_name", top["label"]),
        )
    else:
        # Low confidence: don't assert a wrong answer.
        candidates = ", ".join(
            f"{p['label']} ({p['confidence'] * 100:.0f}%)" for p in predictions
        )
        reply = (
            "I'm not fully sure what this is from the photo. "
            f"My closest guesses are: {candidates}. "
            "Please try a clearer, closer, well-lit photo of the insect for a better result."
        )

    return jsonify(
        {
            "confident": confident,
            "top_prediction": top,
            "predictions": predictions,
            "pest": kb_entry,           # full KB entry or null
            "reply": reply,
        }
    )


@api.post("/chat")
def chat():
    """Follow-up text question, optionally about a previously detected pest.

    JSON body:
      message (str, required)
      pest    (str, optional)  — class label from a previous /detect
    """
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    pest_label = (data.get("pest") or "").strip().lower()

    if not message:
        return jsonify({"error": "message is required."}), 400

    svc = _services()

    # No explicit context? See if the question itself names a pest we know
    # (e.g. "how do I stop snails in my paddy"). Simple singular/plural match.
    if not pest_label or svc["kb"].get(pest_label) is None:
        lowered = message.lower()
        for cls in svc["kb"].classes:
            if cls in lowered or cls.rstrip("s") in lowered or f"{cls}s" in lowered:
                pest_label = cls
                break

    if pest_label and svc["kb"].get(pest_label) is not None:
        kb_text = svc["kb"].summary_text(pest_label)
        pest_name = svc["kb"].get(pest_label).get("common_name", pest_label)
    else:
        # No specific pest in context: give the model the whole KB so it can
        # answer general questions grounded in our data.
        classes = ", ".join(svc["kb"].classes)
        kb_text = (
            "General pest knowledge base. Known pests/insects: "
            f"{classes}. Ask the farmer to upload a photo for a specific identification."
        )
        pest_name = None

    reply = svc["llm"].reply(message, kb_context=kb_text, pest_name=pest_name)
    return jsonify({"reply": reply, "pest": pest_label or None})

"""Smoke tests for the pest API (runs against the mock model — no trained model needed).

Run:  .venv\\Scripts\\python -m pytest   (or:  python -m pytest backend/tests)
"""
import io
import os
import sys

import numpy as np
import pytest
from PIL import Image

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app  # noqa: E402


@pytest.fixture()
def client():
    app = create_app()
    app.config.update(TESTING=True)
    with app.test_client() as c:
        yield c


def _make_image_bytes(seed=0):
    arr = (np.random.default_rng(seed).random((224, 224, 3)) * 255).astype("uint8")
    buf = io.BytesIO()
    Image.fromarray(arr).save(buf, format="JPEG")
    buf.seek(0)
    return buf


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    body = r.get_json()
    assert body["status"] == "ok"
    assert len(body["classes"]) == 19  # 12 general + 7 crop pests


def test_detect_returns_prediction_and_reply(client):
    data = {"image": (_make_image_bytes(1), "bug.jpg")}
    r = client.post("/api/detect", data=data, content_type="multipart/form-data")
    assert r.status_code == 200
    body = r.get_json()
    assert "top_prediction" in body
    assert len(body["predictions"]) == 3
    assert isinstance(body["reply"], str) and body["reply"]


def test_detect_is_deterministic(client):
    img1 = _make_image_bytes(7)
    r1 = client.post("/api/detect", data={"image": (img1, "a.jpg")},
                     content_type="multipart/form-data").get_json()
    img2 = _make_image_bytes(7)
    r2 = client.post("/api/detect", data={"image": (img2, "a.jpg")},
                     content_type="multipart/form-data").get_json()
    assert r1["top_prediction"]["label"] == r2["top_prediction"]["label"]


def test_detect_rejects_missing_image(client):
    r = client.post("/api/detect", data={}, content_type="multipart/form-data")
    assert r.status_code == 400


def test_chat_requires_message(client):
    r = client.post("/api/chat", json={})
    assert r.status_code == 400


def test_chat_with_known_pest(client):
    r = client.post("/api/chat", json={"message": "how do I control this?", "pest": "beetle"})
    assert r.status_code == 200
    body = r.get_json()
    assert "beetle" in body["reply"].lower() or "beetle" in (body["pest"] or "")

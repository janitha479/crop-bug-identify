"""Model service: image -> top-k pest predictions.

Loads the trained CNN when it (and a compatible runtime) is available. Otherwise
falls back to a deterministic MockModel so the whole app is usable before the
real model is trained. Same interface either way:

    model = load_model(config)
    preds = model.predict(pil_image, top_k=3)
    # -> [{"label": "beetle", "confidence": 0.91}, ...]  (sorted desc)
"""
import hashlib
import io
import json
from pathlib import Path
from typing import List

import numpy as np
from PIL import Image

IMG_SIZE = (224, 224)


def _load_class_names(path: Path) -> List[str]:
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def _preprocess(image: Image.Image) -> np.ndarray:
    """RGB, resize to 224x224, float32 array shaped (1, 224, 224, 3)."""
    image = image.convert("RGB").resize(IMG_SIZE)
    arr = np.asarray(image, dtype=np.float32)
    return np.expand_dims(arr, axis=0)


def _top_k(probs: np.ndarray, class_names: List[str], top_k: int):
    probs = np.asarray(probs, dtype=np.float64).ravel()
    idx = np.argsort(probs)[::-1][:top_k]
    return [
        {"label": class_names[i], "confidence": round(float(probs[i]), 4)}
        for i in idx
    ]


class MockModel:
    """Deterministic stand-in used until the real model is trained.

    Produces a stable probability distribution from a hash of the image bytes,
    so the same image always yields the same prediction (good for demos), while
    different images generally yield different pests.
    """

    is_mock = True

    def __init__(self, class_names: List[str]):
        self.class_names = class_names

    def predict(self, image: Image.Image, top_k: int = 3):
        buf = io.BytesIO()
        image.convert("RGB").resize(IMG_SIZE).save(buf, format="PNG")
        digest = hashlib.sha256(buf.getvalue()).digest()
        seed = int.from_bytes(digest[:8], "big")
        rng = np.random.default_rng(seed)
        # Skewed distribution so one class clearly "wins".
        logits = rng.normal(0, 1, size=len(self.class_names))
        logits[rng.integers(len(self.class_names))] += 3.0
        exp = np.exp(logits - logits.max())
        probs = exp / exp.sum()
        return _top_k(probs, self.class_names, top_k)


class KerasModel:
    """Wraps a trained tf.keras model (pest_model.keras)."""

    is_mock = False

    def __init__(self, model, class_names: List[str], preprocess_fn=None):
        self.model = model
        self.class_names = class_names
        # MobileNetV3 expects raw 0-255 input (preprocessing baked into the graph),
        # but allow an override if the training pipeline differs.
        self.preprocess_fn = preprocess_fn

    def predict(self, image: Image.Image, top_k: int = 3):
        x = _preprocess(image)
        if self.preprocess_fn is not None:
            x = self.preprocess_fn(x)
        probs = self.model.predict(x, verbose=0)[0]
        return _top_k(probs, self.class_names, top_k)


def load_model(config) -> object:
    """Return a KerasModel if possible, else a MockModel. Never raises."""
    class_names = _load_class_names(config.CLASS_NAMES_PATH)
    model_path = Path(config.MODEL_PATH)

    if not model_path.exists():
        print(f"[model_service] No model file at {model_path} — using MockModel.")
        return MockModel(class_names)

    try:
        # Imported lazily so the app runs even when TensorFlow isn't installed
        # (e.g. on a Python version TF has no wheels for yet).
        import tensorflow as tf  # noqa: WPS433

        model = tf.keras.models.load_model(model_path)
        print(f"[model_service] Loaded trained model from {model_path}.")
        return KerasModel(model, class_names)
    except Exception as exc:  # pragma: no cover - depends on environment
        print(
            f"[model_service] Could not load real model ({exc.__class__.__name__}: {exc}). "
            "Falling back to MockModel."
        )
        return MockModel(class_names)

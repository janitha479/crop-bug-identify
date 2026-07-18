# Smart Pest Detection & Prediction System

An AI-powered web platform for Sri Lankan farmers: upload a crop/pest photo, the system identifies the pest and replies (chatbot-style) with pest details and how to control it, using an on-project knowledge base.

Based on the project proposal *Smart Pest Detection and Prediction System* (U.P.U. Sudarika, SLIBA, 2026).

## What works now (Phase 1–4)

- **Chatbot web UI** — upload an image, get an identification + treatment advice, ask follow-up questions.
- **Own trained CNN** — MobileNetV3 fine-tuned on 12 agricultural-pest classes (trained on Google Colab).
- **Knowledge base** — [`backend/knowledge_base/pests.json`](backend/knowledge_base/pests.json) holds symptoms, organic + chemical treatments, and prevention for each class.
- **Conversational replies** — grounded in the knowledge base; uses a free-tier LLM (Google Gemini) when an API key is set, and falls back to templated replies with no key.

Later milestones (auth, dashboard, PDF reports, outbreak prediction, PostgreSQL, deployment) are tracked in the plan but not built yet.

## Architecture

```
frontend/   React (Vite) + Bootstrap 5  — chatbot UI
backend/    Flask REST API
            app/services/model_service.py  — loads the CNN, runs inference
            app/services/kb_service.py      — knowledge-base lookup
            app/services/llm_service.py      — Gemini reply, template fallback
            knowledge_base/pests.json        — pest facts + treatments
            model/                           — trained model + class_names.json
ml/         train_pest_classifier.ipynb      — Colab training notebook
```

Flow: image → `POST /api/detect` → CNN top-3 predictions → KB entry → reply. Follow-ups → `POST /api/chat`.

## The 19 pest classes

**12 general insects** (from the Kaggle *Agricultural Pests Image Dataset*):
ants, bees*, beetle, caterpillar, earthworms*, earwig, grasshopper, moth, slug, snail, wasp*, weevil
(\* beneficial — the system tells the user not to kill these.)

**7 Sri Lankan crop pests** (from the *IP102* dataset):
brown_planthopper, rice_stem_borer, fall_armyworm, fruit_fly, thrips, mealybug, leafhopper.

> The model committed to git still has the original 12 classes. Re-run
> [`ml/train_pest_classifier.ipynb`](ml/train_pest_classifier.ipynb) to train the full 19-class
> model, then replace `pest_model.keras` **and** `class_names.json` together.

## Quick start

### 1. Backend

```bash
cd backend
python -m venv .venv
# Windows:  .venv\Scripts\activate      Linux/Mac: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env      # then optionally add GEMINI_API_KEY
python run.py
```

Backend runs at `http://localhost:5000`. It works immediately with a **mock model** (random-but-consistent predictions) so the app is usable before the real model is trained. Drop `pest_model.keras` into `backend/model/` to switch to the real model.

> Note: TensorFlow may not yet publish wheels for the newest Python versions. If `tensorflow` won't install, the backend still runs on the mock model. For real inference use Python 3.11/3.12 for the backend venv, or the exported `.tflite`/`.onnx` model with a lighter runtime (see `ml/README.md`).

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the printed URL (default `http://localhost:5173`).

### 3. Train the model (Google Colab)

Open [`ml/train_pest_classifier.ipynb`](ml/train_pest_classifier.ipynb) in Google Colab, run all cells (free T4 GPU), then download `pest_model.keras` and `class_names.json` into `backend/model/`. See [`ml/README.md`](ml/README.md).

## Status

See the full work plan and milestone tracking in the project plan file. Current focus: end-to-end chatbot (identify → advise).

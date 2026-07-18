# Project Status — Smart Pest Detection & Prediction System

_Last updated: 2026-07-07_

A running progress tracker for the final-year project. The immediate goal — a chatbot
that takes a pest photo, identifies the bug, and replies with details + how to control it
using our own knowledge base — is **built and working end-to-end**.

Legend: ✅ done · 🚧 in progress / partial · ⬜ not started

---

## ✅ Done (Phase 1–4: the core chatbot)

### Project setup
- ✅ Git repository initialised, folder structure (`backend/`, `frontend/`, `ml/`, `docs/`).
- ✅ `.gitignore`, `README.md`, this `STATUS.md`.

### Knowledge base (our own pest data)
- ✅ `backend/knowledge_base/pests.json` — **19 pest classes** with: common + scientific
  name, crops affected, damage symptoms, organic treatments, chemical treatments, prevention,
  severity, and a `beneficial` flag.
- ✅ **12 general insects** (Kaggle *Agricultural Pests Image Dataset*): ants, bees\*, beetle,
  caterpillar, earthworms\*, earwig, grasshopper, moth, slug, snail, wasp\*, weevil
  (\* = beneficial; the bot tells the user not to kill these).
- ✅ **7 Sri Lankan crop pests** (IP102 dataset): brown_planthopper, rice_stem_borer,
  fall_armyworm, fruit_fly, thrips, mealybug, leafhopper.
- ⚠️ The committed model still recognises only the original 12. Re-run the notebook to train
  the full 19-class model, then replace `pest_model.keras` + `class_names.json` together.

### Backend (Flask REST API)
- ✅ App-factory structure (`backend/app/`) so later features slot in cleanly.
- ✅ `POST /api/detect` — image upload → top-3 predictions + pest details + treatment reply.
- ✅ `POST /api/chat` — follow-up questions, grounded in the knowledge base (also detects a
  pest named in plain text, e.g. "snails in my paddy").
- ✅ `GET /api/health` — reports model + LLM mode.
- ✅ `model_service` — loads a real trained CNN **or** falls back to a deterministic mock model
  so the app runs before training is finished.
- ✅ `kb_service` — knowledge-base lookup and summary text.
- ✅ `llm_service` — Google Gemini via REST for conversational replies; **template fallback
  when no API key** (so it works free/offline). LLM is instructed to answer only from our KB.
- ✅ Low-confidence handling: below 55% it shows top-3 guesses instead of a wrong answer.
- ✅ 6 automated tests (`backend/tests/test_api.py`) — all passing.

### Frontend (React + Bootstrap chatbot)
- ✅ Chat UI: message bubbles, image attach + preview, send.
- ✅ Detection reply shows a **pest card** (photo, name, scientific name, confidence badge,
  severity, affected crops) + treatment advice text.
- ✅ Follow-up questions keep the last detected pest as context.
- ✅ Mobile-friendly layout (verified at 375px, input bar pinned to bottom).
- ✅ Verified end-to-end in the browser: confident match, low-confidence path, and follow-up
  chat all work.

### Model training (ready to run)
- ✅ `ml/train_pest_classifier.ipynb` — Colab notebook: downloads the dataset, fine-tunes
  MobileNetV3, evaluates (target ≥80% accuracy), saves confusion matrix + model.
- ✅ `ml/README.md` — step-by-step Colab instructions.

---

## 🚧 In progress / needs you

- 🚧 **Train the real model (highest priority).** Run `ml/train_pest_classifier.ipynb` on
  Google Colab (free GPU), then put `pest_model.keras` + `class_names.json` into
  `backend/model/`. Until then the backend uses the **mock model** (status pill shows
  `model: mock`) — identification is random, not real.
- 🚧 **(Optional) Free Gemini API key** for nicer conversational replies. Get one from
  https://aistudio.google.com/app/apikey, put it in `backend/.env` as `GEMINI_API_KEY`.
  The chatbot works without it via template replies.

### Known constraint (noted, not blocking)
- This PC runs **Python 3.14**, which TensorFlow does not support yet, so the trained
  `.keras` model can't run locally as-is. Options when we get there: (a) make a Python
  3.11/3.12 virtual-env just for the backend, or (b) export the model to `.tflite` (the
  notebook has a cell for this) and load it with a lightweight runtime. Training on Colab
  is unaffected.

---

## ⬜ To do (later milestones, from the proposal)

In roughly the proposal's order:

- ⬜ **User authentication** — JWT login/registration (FR07).
- ⬜ **Detection event logging** — save each detection + treatment to a database (start SQLite,
  move to PostgreSQL for final) (FR04).
- ⬜ **Search & filter** history by crop, pest, date, severity (FR08).
- ⬜ **Dashboard** — pest activity trends, recent detections, risk indicators, charts (FR05).
- ⬜ **PDF report export** — detection + treatment history reports (FR06).
- ⬜ **Outbreak prediction module** — ML model on logged history + season/weather to forecast
  risk levels (FR02). Comes last; it needs accumulated detection data.
- ⬜ **PostgreSQL + cloud deployment** — deploy backend (Render/Railway free tier) and frontend
  (static host).
- ⬜ **(Stretch) Sinhala interface** — including verified Sinhala pest names in the KB
  (currently omitted rather than guessed).
- ⬜ **Test reports & user manual** — deliverables for the final submission.

---

## How to run what exists

**Backend**
```
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env      # optional: add GEMINI_API_KEY
python run.py               # http://localhost:5000
```

**Frontend**
```
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

**Tests**
```
cd backend
.venv\Scripts\python -m pytest -q
```

## Milestones vs. proposal timeline

| Proposal milestone | Target date | Status |
|---|---|---|
| Requirement analysis & system design | Apr W3 2026 | ✅ (design captured in plan) |
| Flask backend + DB integration | May W4 2026 | ✅ backend / ⬜ DB |
| AI pest detection model trained & integrated | Jun W3 2026 | 🚧 notebook ready, needs training run |
| React + Bootstrap UI | Jul W2 2026 | ✅ chatbot UI |
| Outbreak prediction module | Aug W1 2026 | ⬜ |
| Unit / integration / UAT testing | Sep W2 2026 | 🚧 backend tests done |
| Final deployment & documentation | Oct W1 2026 | ⬜ |

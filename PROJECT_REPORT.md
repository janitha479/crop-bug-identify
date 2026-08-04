# Smart Pest Detection & Prediction System — Project Report

> A web-based chatbot that lets a farmer upload a photo of an insect/pest on their crop,
> identifies the pest using a custom-trained Convolutional Neural Network (CNN), and replies
> with practical, knowledge-base-grounded treatment advice in simple English.

---

## 1. Introduction & Objective

Crop losses caused by insect pests are a serious problem for small-scale farmers, who often
cannot quickly access an agronomist to identify a pest and recommend a safe treatment. The
**Smart Pest Detection & Prediction System** addresses this by combining **computer vision**
(to recognise the pest from a photo) with a **curated agricultural knowledge base** and a
**conversational AI assistant** (to explain the problem and its control measures).

The core idea is a **hybrid AI pipeline**:

1. A farmer uploads a photo through a chat interface.
2. An **own trained CNN** classifies the pest into one of 17 pest/insect classes.
3. Facts are pulled from the project's **own knowledge base** (`pests.json`), compiled from
   Sri Lanka Department of Agriculture advisories and Integrated Pest Management (IPM) references.
4. A **large language model (Google Gemini)** rephrases those facts into a friendly, readable
   reply — *strictly grounded in the knowledge base* so it never invents pesticide names or dosages.

A key design goal was that the whole system **always works**, even with no GPU, no trained
model file, and no internet/API key, by degrading gracefully to deterministic fallbacks.

---

## 2. Technologies Used

### 2.1 Machine Learning / Computer Vision
| Technology | Role |
|---|---|
| **TensorFlow / Keras** | Model building, training, inference |
| **MobileNetV3-Large** | Pre-trained CNN backbone (transfer learning, ImageNet weights) |
| **Google Colab (T4 GPU)** | Training environment |
| **kagglehub** | Downloads the training datasets without login |
| **NumPy** | Array/probability maths, preprocessing |
| **Pillow (PIL)** | Image decoding, RGB conversion, resizing |
| **scikit-learn** | Classification report + confusion matrix |
| **Matplotlib** | Confusion-matrix visualisation |

### 2.2 Backend
| Technology | Role |
|---|---|
| **Python 3.12 / 3.14** | Backend language (dual-runtime — see §7) |
| **Flask** (application-factory pattern) | REST API server |
| **flask-cors** | Cross-origin requests from the React dev server |
| **requests** | Calls the Google Gemini REST API and Google News RSS |
| **python-dotenv** | Loads configuration from a `.env` file |
| **Google Gemini API** (`gemini-1.5-flash`) | Conversational reply generation |

### 2.3 Frontend
| Technology | Role |
|---|---|
| **React 18** | UI component framework |
| **Vite 5** | Dev server + build tool (proxies `/api` → Flask :5000) |
| **React Router 7** | Multi-page routing (Home, News, Bugs) |
| **Bootstrap 5** | Styling and layout |

### 2.4 Data Sources
- **Agricultural Pests Image Dataset** (Kaggle) — 12 general insect classes.
- **IP102** insect-pest benchmark (Kaggle) — 7 crop-specific pest classes added by name-matching.
- **Google News RSS** — live Sri Lanka agriculture headlines (keyless).

---

## 3. System Architecture

```
┌───────────────────────────┐        multipart / JSON        ┌────────────────────────────┐
│  Frontend (React + Vite)  │  ───────────────────────────►  │   Backend (Flask REST API) │
│  • Floating chat widget   │      POST /api/detect          │  • routes.py (endpoints)   │
│  • Photo upload + preview │      POST /api/chat            │  • model_service (CNN)     │
│  • PestCard result card   │      GET  /api/health / /news  │  • kb_service (pests.json) │
│  • Live news + bug guide  │  ◄───────────────────────────  │  • llm_service (Gemini)    │
└───────────────────────────┘        JSON reply              │  • news_service (RSS)      │
                                                             └──────────────┬─────────────┘
                                                                            │
                                          ┌─────────────────────────────────┼──────────────────────────┐
                                          ▼                                 ▼                          ▼
                                 pest_model.keras                    pests.json (KB)          Gemini REST API
                                 (MobileNetV3 CNN)              own facts & treatments      (grounded phrasing)
```

The Flask app is built with an **application-factory** (`create_app`) so services are
initialised **once at startup** and stored on `app.extensions["pest_services"]`
(`kb`, `model`, `llm`, `news`). This keeps the expensive model load out of the request path
and leaves room to add JWT auth / a database later without restructuring.

---

## 4. The Image Identification Process (in detail)

This is the heart of the system. It spans two stages: **(A) offline training** in Colab, and
**(B) online inference** in the Flask backend when a farmer uploads a photo.

### 4.1 Stage A — Training the CNN (`ml/train_pest_classifier.ipynb`)

**Step 1 — Dataset assembly (19 → 17 classes).**
Two Kaggle datasets are downloaded with `kagglehub` and merged into a single folder tree
(`/content/merged/<class_name>/`), one sub-folder per class:
- **12 general classes** from the *Agricultural Pests Image Dataset* (the mis-spelled folder
  `Catterpillar` is renamed to `caterpillar` so labels match the knowledge base).
- **7 crop-pest classes** taken from **IP102** by **name-matching** rather than hard-coded
  IDs (e.g. `brown_planthopper`, `rice_stem_borer`, `fall_armyworm`, `fruit_fly`, `leafhopper`,
  and originally `thrips`, `mealybug`). IP102 classes are **capped at 700 images** each to keep
  the dataset balanced.
- The weak `thrips` class (and mealybug) were **dropped**, because thrips scored only ~43% and
  was hurting neighbouring classes. The final deployed model has **17 classes**:
  `ants, bees, beetle, brown_planthopper, caterpillar, earthworms, earwig, fall_armyworm,
  fruit_fly, grasshopper, leafhopper, moth, rice_stem_borer, slug, snail, wasp, weevil`.

**Step 2 — Dataset splitting.**
Images are loaded with `image_dataset_from_directory`, resized to **224×224**, batched at 32,
and split roughly **80% train / 10% validation / 10% test** (the 20% "rest" split is halved
into val and test). Labels are one-hot (`categorical`).

**Step 3 — Class weighting.**
Because class sizes are uneven, per-class weights `total / (n_classes × count)` are computed so
large classes don't dominate training.

**Step 4 — Data augmentation** (applied only during training):
`RandomFlip('horizontal')`, `RandomRotation(0.15)`, `RandomZoom(0.15)`, `RandomContrast(0.15)`.
This makes the model robust to different photo angles, orientations, and lighting.

**Step 5 — Transfer-learning model.**
- Base: **MobileNetV3-Large**, `include_top=False`, pre-trained **ImageNet** weights, initially frozen.
- Head: `GlobalAveragePooling2D` → `Dropout(0.3)` → `Dense(num_classes, softmax)`.
- MobileNetV3 bakes its own pixel preprocessing into the graph, so the model is fed **raw 0–255 pixels**.

**Step 6 — Two-phase training.**
1. *Head training*: freeze the base, train the new head for up to 25 epochs with `Adam(1e-3)`.
2. *Fine-tuning*: unfreeze the **top ~120 layers** of the base and continue for up to 15 epochs
   at a low `Adam(1e-5)`. **BatchNormalization layers stay frozen** for stability on a small dataset.
- Callbacks: `EarlyStopping` (patience 8, restore best weights) and `ReduceLROnPlateau`
  (halve LR after 3 stalled epochs), both monitoring `val_accuracy`.

**Step 7 — Evaluation & export.**
The held-out **test set** is evaluated (target ≥ 80% accuracy). A `classification_report` and a
**confusion matrix** (`confusion_matrix.png`) are produced. The model is saved as
**`pest_model.keras`**, the class order as **`class_names.json`**, and an optional **TFLite**
export (`pest_model.tflite`) is provided for lightweight/newer-Python runtimes. These files are
copied into `backend/model/`.

### 4.2 Stage B — Inference in the backend (`backend/app/services/model_service.py`)

When a farmer uploads a photo, `POST /api/detect` runs this pipeline:

1. **Upload validation** (`routes.py`): the file must be present, non-empty, and have an allowed
   extension (`png, jpg, jpeg, webp, bmp`); max upload size is **8 MB**. The bytes are decoded with
   Pillow and `image.load()` verifies it is a real image (bad files return HTTP 400).

2. **Preprocessing** (`_preprocess`): the image is converted to **RGB**, resized to **224×224**,
   turned into a `float32` NumPy array, and reshaped to `(1, 224, 224, 3)` — a batch of one.

3. **Prediction**: the chosen model runs a forward pass and produces a probability vector over the
   17 classes (`softmax`).

4. **Top-K selection** (`_top_k`): probabilities are sorted descending and the **top 3** are returned as
   `[{"label": "beetle", "confidence": 0.91}, …]`.

5. **Confidence gating** (in `routes.py`) — the system avoids asserting a wrong answer:
   - **Assert** the top prediction if its confidence ≥ **0.55** (`CONFIDENCE_THRESHOLD`), **or**
   - if it is a clear leader — confidence ≥ **0.45** (`MARGIN_MIN_CONFIDENCE`) **and** ahead of the
     runner-up by ≥ **0.10** (`MARGIN_GAP`) — which catches borderline-but-obvious cases (e.g. 54% vs 42%).
   - Otherwise the bot replies **"I'm not fully sure…"** and shows the **top-3 guesses** with
     percentages, asking for a clearer, closer, well-lit photo.

6. **Knowledge-base lookup + reply**: if confident, the matching entry is fetched from `pests.json`,
   summarised, and passed to the LLM service to produce the final conversational reply
   (see §5). The JSON response includes `confident`, `top_prediction`, all `predictions`, the full
   `pest` KB entry, and the human-readable `reply`.

### 4.3 Deterministic MockModel fallback

If **no `pest_model.keras` file exists** or **TensorFlow can't be imported** (e.g. an unsupported
Python version), `load_model()` never raises — it returns a **`MockModel`**. The MockModel hashes
the image bytes (SHA-256) to seed a random generator, producing a **stable, skewed probability
distribution** where one class clearly wins. This means the *same image always gives the same
prediction*, so the entire frontend, API, chat flow, and demo remain fully functional before the
real model is trained or on a machine without TensorFlow. `/api/health` reports `model: "mock"` vs
`"trained"` so the UI badge shows which is active.

---

## 5. The Conversational Layer (grounded LLM)

`llm_service.py` turns dry KB facts into a friendly reply while preventing hallucination:

- **Grounding**: a strict `SYSTEM_INSTRUCTION` tells Gemini to answer **only** from the supplied
  knowledge-base text — never invent pesticide names or dosages, prefer organic/cultural controls
  first, mention chemicals only as a last resort with a safety note, and reply in simple English.
- **REST, not SDK**: Gemini is called directly over its **REST API with `requests`** (temperature
  0.4, max 800 tokens) instead of the `google-generativeai` SDK, to avoid the heavy `grpcio`
  native dependency that lacks wheels on the newest Python.
- **Template fallback**: with **no API key** or on any network error, the service assembles a
  readable reply directly from the KB text — so the chatbot answers **online or offline, free or paid**.
  `/api/health` reports `llm: "gemini"` vs `"template"`.

### Knowledge base (`kb_service.py` + `pests.json`)
Each pest entry contains: `common_name`, `scientific_name`, `beneficial` flag, `severity`,
`crops_affected`, `damage_symptoms`, `organic_treatments`, `chemical_treatments`, and `prevention`.
Beneficial organisms (**bees, earthworms, wasps**) are flagged so the bot advises *not* to kill them.
`summary_text()` renders an entry into the plain-text grounding block passed to the LLM.

---

## 6. Key Functions & Endpoints (reference)

### REST API endpoints (`backend/app/routes.py`)
| Endpoint | Method | Purpose |
|---|---|---|
| `/` | GET | API name + endpoint list |
| `/api/health` | GET | Reports model (`mock`/`trained`), llm (`gemini`/`template`), class list |
| `/api/detect` | POST | **Image → pest identification + treatment reply** (multipart: `image`, optional `message`) |
| `/api/chat` | POST | Follow-up text question (JSON: `message`, optional `pest` context) |
| `/api/news` | GET | Live Sri Lanka agriculture headlines (Google News RSS proxy) |

### Notable backend functions
| Function | File | Responsibility |
|---|---|---|
| `create_app(config)` | `app/__init__.py` | Flask factory; initialises services once |
| `load_model(config)` | `model_service.py` | Returns `KerasModel` if possible, else `MockModel` (never raises) |
| `_preprocess(image)` | `model_service.py` | RGB → 224×224 → `(1,224,224,3)` float32 |
| `_top_k(probs, names, k)` | `model_service.py` | Sorts probabilities, returns top-K labels + confidences |
| `MockModel.predict()` | `model_service.py` | Deterministic hash-seeded fallback prediction |
| `KerasModel.predict()` | `model_service.py` | Real CNN forward pass |
| `detect()` | `routes.py` | Validation → predict → confidence gate → KB lookup → reply |
| `chat()` | `routes.py` | Detects pest name in text, grounds a follow-up reply |
| `KnowledgeBase.get()` / `summary_text()` | `kb_service.py` | KB lookup + plain-text grounding block |
| `LLMService.reply()` | `llm_service.py` | Gemini call with template fallback |
| `LLMService._build_prompt()` | `llm_service.py` | Assembles the grounded prompt |
| `NewsService.get_news()` | `news_service.py` | Cached (15 min) Google News RSS fetch |

### Frontend structure (`frontend/src/`)
- `App.jsx` — site shell: NavBar + routed pages (Home, News, Bugs) + Footer + floating `ChatWidget`.
- `components/ChatBot.jsx` — the chatbot: photo upload + preview, message list, typing indicator,
  status badges, follow-up context (`lastPest`).
- `components/PestCard.jsx` — renders the identification result card.
- `api.js` — thin client: `detectPest()`, `chat()`, `health()`, `getNews()`.
- `pages/` — Home, News (live headlines), Bugs (pest guide); `data/` holds curated fallback content.

---

## 7. Notable Engineering Decisions

- **Graceful degradation everywhere.** The app runs with **no trained model** (MockModel), **no API
  key** (template replies), and **no internet** (empty news list → curated tips). Nothing hard-fails.
- **Dual Python runtime.** The dev machine runs **Python 3.14**, for which TensorFlow and `grpcio`
  have no wheels. So: the default `requirements.txt` installs *without* TensorFlow (mock model works
  out of the box), while `requirements-tf.txt` targets a **Python 3.12 venv** (`.venv312`) that can
  load the real `pest_model.keras`. Gemini is called over REST to avoid `grpcio` entirely.
- **Loose dependency lower bounds** (`>=` not exact pins) so pip can pick wheels that exist for the
  installed Python version.
- **Confidence + margin gating** avoids confidently stating a wrong pest on ambiguous photos.
- **LLM grounded strictly in an own KB** — safe, verifiable agricultural advice rather than free-form
  model output.

---

## 8. Testing

`backend/tests/test_api.py` covers the API surface (health, detect with a sample image, chat,
validation errors), passing against the deterministic MockModel so results are reproducible in CI
without a GPU or the large model file.

---

## 9. Possible Future Work

- User accounts (JWT auth) and a detection history dashboard.
- PostgreSQL logging of detections for outbreak **prediction/analytics**.
- Sinhala/Tamil localisation (KB currently English-only; `sinhala_name` field reserved).
- On-device/edge inference via the exported TFLite model.
- PDF advisory reports and a proper cloud deployment.

---

*Report generated from the current codebase of `crop-bug-identify` (Smart Pest Detection &
Prediction System).*

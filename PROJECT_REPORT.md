# Smart Pest Detection & Prediction System — Project Report

> A web platform for Sri Lankan farmers that identifies crop pests from a photo using a
> custom-trained Convolutional Neural Network (CNN), explains the problem through a
> knowledge-base-grounded conversational assistant, **predicts which pests are likely to
> break out in the coming months**, and gives each farmer a **personal dashboard** of their
> saved farms, live weather, pest risk, scan history and saved conversations.

---

## 1. Introduction & Objective

Crop losses caused by insect pests are a serious problem for small-scale farmers, who often
cannot quickly access an agronomist to identify a pest and recommend a safe treatment. The
**Smart Pest Detection & Prediction System** addresses this by combining **computer vision**
(to recognise the pest from a photo) with a **curated agricultural knowledge base**, a
**conversational AI assistant**, and a **seasonal outbreak-prediction engine**.

The system covers three questions a farmer actually asks:

| Question | System capability |
|---|---|
| *"What is this insect on my crop?"* | **Detection** — own trained CNN + knowledge base |
| *"What should I do about it / about my field?"* | **Advice** — grounded, weather-aware chatbot |
| *"What is coming next?"* | **Prediction** — seasonal outbreak forecast per location |

The core idea is a **hybrid AI pipeline**:

1. A farmer uploads a photo through a chat interface.
2. An **own trained CNN** classifies the pest into one of 17 pest/insect classes.
3. Facts are pulled from the project's **own knowledge base** (`pests.json`), compiled from
   Sri Lanka Department of Agriculture advisories and Integrated Pest Management (IPM) references.
4. A **large language model (Google Gemini)** rephrases those facts into a friendly, readable
   reply — *strictly grounded in the knowledge base* so it never invents pesticide names or dosages.
5. **Live weather and the outbreak forecast** are injected into the conversation when the
   question needs them, so advice such as spray timing reflects real current conditions.

Registered farmers additionally get **accounts (JWT)**, **saved farms in PostgreSQL**, a
**bulk dashboard** showing weather + top pest risk for every farm at once, **automatic scan
history**, **saved conversations**, and a **downloadable PDF advisory report**.

A key design goal was that the whole system **always works**, even with no GPU, no trained
model file, no database, and no internet/API key, by degrading gracefully to deterministic
fallbacks at every layer.

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
| **Python 3.12 / 3.14** | Backend language (dual-runtime — see §10) |
| **Flask** (application-factory pattern) | REST API server |
| **Flask Blueprints** | Modular route groups (`api`, `auth_api`, `farms_api`, `chat_api`) |
| **flask-cors** | Cross-origin requests from the React dev server |
| **requests** | Calls Gemini, Open-Meteo, GBIF and Google News RSS over plain HTTP |
| **python-dotenv** | Loads configuration/secrets from a `.env` file |
| **Google Gemini API** (`gemini-2.5-flash` / `3.x-flash`) | Conversational reply generation |

### 2.3 Database, Authentication & Reporting
| Technology | Role |
|---|---|
| **PostgreSQL 17** (Supabase cloud) | Persistent store for users, farms, detections, conversations |
| **SQLAlchemy 2.0** (ORM, declarative `Mapped[]` style) | Models, sessions, portable SQL |
| **psycopg2-binary** | PostgreSQL driver (prebuilt wheels, Python 3.12) |
| **PyJWT** | Signed **JWT** bearer tokens for stateless login (HS256, 7-day expiry) |
| **Werkzeug security** (`pbkdf2`) | Password hashing + verification (no plaintext ever stored) |
| **fpdf2** | Generates the downloadable farm advisory PDF report |

### 2.4 Frontend
| Technology | Role |
|---|---|
| **React 18** | UI component framework |
| **Vite 5** | Dev server + build tool (proxies `/api` → Flask :5000) |
| **React Router 7** | Routing (Home, News, Bugs, Forecast, Login, Register, Dashboard) |
| **React Context API** | Global state: `AuthContext`, `LocationContext`, `ChatContext` |
| **Bootstrap 5** | Styling and layout |
| **localStorage** | Persists the JWT and the chosen farm location between visits |
| **Geolocation API** | Browser-based "use my location" detection |

### 2.5 External APIs & Data Sources
| Source | Use | Key required |
|---|---|---|
| **Agricultural Pests Image Dataset** (Kaggle) | 12 general insect training classes | — |
| **IP102** insect-pest benchmark (Kaggle) | 7 crop-specific pest classes (name-matched) | — |
| **Sri Lanka DoA + IPM references** | Own knowledge base (`pests.json`) content | — |
| **GBIF Occurrence API** | **Real** month-by-month pest sighting data → seasonal calendar | No |
| **Open-Meteo Forecast API** | Live temperature, humidity, wind, rainfall | No |
| **Open-Meteo Geocoding API** | Place name → coordinates ("Kandy" → 7.29, 80.63) | No |
| **Google News RSS** | Live Sri Lanka agriculture headlines | No |
| **Google Gemini** | Natural-language phrasing | Yes (free tier) |

> Every external service except Gemini is **keyless**, and Gemini itself is optional — the
> system falls back to template replies without it.

---

## 3. System Architecture

```
┌──────────────────────────────┐   multipart / JSON + JWT   ┌─────────────────────────────────┐
│   Frontend (React + Vite)    │ ─────────────────────────► │     Backend (Flask REST API)    │
│  • Floating chat widget      │  POST /api/detect  /chat   │  Blueprints:                    │
│  • Dashboard (farms, risks)  │  GET  /api/forecast        │   • routes.py      (core)       │
│  • Forecast + Outbreak cards │  GET  /api/farms/overview  │   • routes_auth.py (accounts)   │
│  • Login / Register          │  POST /api/auth/login      │   • routes_farms.py(dashboard)  │
│  • LocationPicker (GPS/name) │ ◄───────────────────────── │   • routes_chat.py (history)    │
│  Context: Auth/Location/Chat │        JSON reply          │  Services: model, kb, llm,      │
└──────────────────────────────┘                            │   weather, forecast, news,      │
                                                            │   agri_context                  │
                                                            └────────────┬────────────────────┘
                                                                         │
        ┌──────────────┬───────────────┬──────────────┬──────────────────┼─────────────────┐
        ▼              ▼               ▼              ▼                  ▼                 ▼
 pest_model.keras  pests.json   outbreak_calendar  PostgreSQL      Open-Meteo API     Gemini REST
 (MobileNetV3)     (own KB)     (GBIF-derived)     (Supabase)      weather+geocode   (phrasing only)
                                                   users, farms,
                                                   detections,
                                                   conversations
```

The Flask app is built with an **application-factory** (`create_app`) so services are
initialised **once at startup** and stored on `app.extensions["pest_services"]`
(`kb`, `model`, `llm`, `news`, `weather`, `forecast`). This keeps the expensive model load out
of the request path. Routes are split across **four blueprints** so the growing API stays
readable, and the **database layer is optional** — if `DATABASE_URL` is unset the auth and
dashboard routes return a clear *"accounts not configured"* response while detection,
chat, weather and forecasting continue to work normally.

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

- **Persona & humanised tone.** The assistant speaks as **"Ksetha"**, a warm, down-to-earth
  farming friend. The system prompt explicitly forbids dumping bullet-point lists and asks for
  flowing sentences, a reassuring opener, and short paragraphs — replacing the earlier robotic
  fact-dump with something a busy farmer actually wants to read.
- **Two-tier grounding.** *Pest facts* (symptoms, treatments, pesticides, dosages) must come
  **only** from the supplied knowledge base — nothing invented. *General agronomy* questions
  (watering, planting, soil, timing) may be answered from sound general agricultural knowledge,
  which lets the bot be genuinely useful beyond the 19 catalogued pests. Organic and cultural
  controls are always recommended before chemicals, which carry a safety note.
- **REST, not SDK**: Gemini is called directly over its **REST API with `requests`** instead of
  the `google-generativeai` SDK, to avoid the heavy `grpcio` native dependency that lacks wheels
  on the newest Python.
- **Token budgeting for "thinking" models.** Gemini 2.5/3.x spend a large slice of the output
  budget on hidden reasoning (measured **~630 reasoning tokens** on a short reply). The original
  800-token cap was being consumed before the visible answer finished, truncating replies
  mid-sentence; the cap was raised to **2048** and temperature to **0.6** to fix this.
- **Template fallback**: with **no API key** or on any network error, the service assembles a
  readable reply directly from the KB text — so the chatbot answers **online or offline, free or paid**.
  `/api/health` reports `llm: "gemini"` vs `"template"`.

### 5.1 Live, location-aware context (`agri_context.py`)

A plain LLM cannot know today's weather. `agri_context.py` bridges that gap by **injecting real
data into the prompt only when the question needs it** — a lightweight, deterministic alternative
to LLM function-calling:

1. The question is scanned for **weather keywords** (rain, spray, humid, temperature, today…)
   and **risk keywords** (pest, outbreak, season, expect, next month…).
2. If matched *and* the client supplied coordinates, the service fetches **live weather**
   (`weather_service`) and/or the **outbreak forecast** (`forecast_service`).
3. The results are appended to the grounding block as a `LIVE FIELD CONDITIONS` /
   `PEST OUTBREAK FORECAST` section, with an instruction to use the real numbers and never
   invent them.

This keyword gate means ordinary questions cost **no extra API calls**. Verified behaviour —
asked *"Is today a good day to spray my crops?"*, the assistant replied using the true readings:

> *"…overcast, around 29.6 °C and 67 % humidity… your wind speed is currently quite high at
> 28.9 km/h. Because of that strong breeze, today…"*

### 5.2 Saved conversations

When a signed-in farmer chats, each turn is written to the `conversations` / `messages` tables.
The first user message becomes the conversation **title**, and `/api/chat` returns a
`conversation_id` that the client threads through subsequent messages. Farmers can therefore
close the chat widget and **reopen the full transcript later** from their dashboard.

### 5.3 Knowledge base (`kb_service.py` + `pests.json`)
Each pest entry contains: `common_name`, `scientific_name`, `beneficial` flag, `severity`,
`crops_affected`, `damage_symptoms`, `organic_treatments`, `chemical_treatments`, and `prevention`.
Beneficial organisms (**bees, earthworms, wasps**) are flagged so the bot advises *not* to kill them.
`summary_text()` renders an entry into the plain-text grounding block passed to the LLM.

The knowledge base holds **19 entries** while the deployed CNN recognises **17 classes** — `thrips`
and `mealybug` were dropped from training for poor accuracy (§4.1) but are deliberately **kept in
the KB**, because the chatbot can still answer questions about them by name and the outbreak
forecaster can still warn about them seasonally, even though the camera cannot identify them.

---

## 6. The Outbreak Prediction System

This is the "**Prediction**" half of the project title: instead of only reacting to a pest that
has already arrived, the system warns the farmer **before** the likely surge.

### 6.1 How a risk score is produced (`forecast_service.py`)

The engine is deliberately **rule-based and transparent** — every warning can be explained to a
farmer, which a black-box model could not do. For each pest:

| Step | Input | Effect on score |
|---|---|---|
| 1. In-season baseline | Pest's `peak_months` falls inside the forecast window | **+2.0** |
| 2. Urgency | How soon the peak is (this month → 3 months away) | **+1.0 … +0.1** |
| 3. Live climate match | Current temp within range **and** humidity above minimum | **+2.0** |
| | Only one of the two matches | +0.7 |
| | Neither matches | **−1.5** |
| 4. Damage potential | KB `severity` = high / medium | +1.0 / +0.4 |

The total maps to **severe (≥5.5) / high (≥4.5) / moderate (≥3.3) / low**. Beneficial insects
(bees, earthworms, wasps) are excluded from warnings entirely. Each warning returns the peak
month, a plain-language *reason*, a *climate note*, the crops at stake, and up to three
**prevention tips pulled straight from the knowledge base** — so the advice stays grounded.

> The scoring weights were **calibrated against real output**: the first version pushed almost
> every pest into "severe", which is useless as a warning. Re-weighting climate mismatch and
> urgency produced a realistic spread (1 severe / 7 high / 4 moderate in the August test).

### 6.2 From mock data to REAL data (`scripts/build_outbreak_calendar.py`)

The seasonal calendar began as **hand-written demonstration data**. It was then upgraded to
**real biodiversity observations** using the **GBIF Occurrence API**:

1. Each pest's `scientific_name` from `pests.json` is cleaned and resolved to a **GBIF taxon key**
   (e.g. *Nilaparvata lugens* → 2056628).
2. GBIF returns **month-by-month occurrence counts**. Sri Lanka alone is usually too sparse
   (brown planthopper: **1 record**), so the script falls back to a **tropical-Asia region**
   (LK, IN, BD, MM, TH, VN, PH, KH, LA) whose monsoon seasonality is comparable — and finally
   to the original mock values if even that is too thin.
3. `peak_months` = every month with **≥50 % of the busiest month's count**.

**Result: 14 of 16 pests are now backed by real sighting data.** Every entry records its own
provenance (`peak_source`, `gbif_records`, `gbif_taxon`, `gbif_rank`), and the UI displays it on
each card — e.g. *"📊 Real GBIF sightings — tropical Asia (941 records, species)"*.

**Honest data-quality note.** Match precision varies with taxonomic rank, and the report does not
hide this: species-level matches (brown planthopper, fall armyworm, rice stem borer, fruit fly)
are reliable; order/class-level matches (*Gastropoda* for snail/slug, *Lepidoptera* for
caterpillar/moth) are **coarse proxies** covering the whole group; mealybug and weevil had too
few records and remain estimates. GBIF counts also reflect **when people record sightings**, which
correlates with — but is not identical to — true outbreak timing. The climate thresholds remain
expert-set rather than GBIF-derived.

---

## 7. Accounts, Database & the Farmer Dashboard

### 7.1 Data model (`models.py`)

Four tables, with `ON DELETE CASCADE` so removing a farmer cleanly removes all their data:

| Table | Key columns | Purpose |
|---|---|---|
| `users` | `email` (unique, indexed), `password_hash`, `full_name`, `district` | Farmer accounts |
| `farms` | `user_id` FK, `name`, `latitude`, `longitude`, `place_label` | Saved farm locations |
| `detections` | `user_id` FK, `farm_id` FK (nullable), `pest_label`, `confidence`, `reply` | Scan history |
| `conversations` / `messages` | `user_id` FK / `conversation_id` FK, `role`, `text` | Saved chat threads |

### 7.2 Authentication (`auth.py`)

- Passwords are hashed with **Werkzeug pbkdf2** — plaintext is never stored or logged.
- Login returns a **JWT** (HS256, signed with `JWT_SECRET`, 7-day expiry) sent thereafter as an
  `Authorization: Bearer <token>` header.
- A `@login_required` decorator decodes the token, loads the user, injects `g.user` / `g.db`, and
  guarantees the session is closed afterwards. Unauthenticated calls get a clean **401**.
- `optional_user()` supports **dual-mode endpoints**: `/api/detect` and `/api/chat` work for
  anonymous visitors, but *silently log to history* when a valid token is present. Logging is
  best-effort and wrapped in try/except, so a database hiccup can never break a detection.

### 7.3 Dashboard features

| Feature | Endpoint | Notes |
|---|---|---|
| Save a farm | `POST /api/farms` | Location chosen via GPS **or** place-name search |
| **All farms at once** | `GET /api/farms/overview` | One call returns weather **+ top pest risk** per farm |
| Per-farm forecast | `GET /api/forecast` | Opens in a **modal using the farm's stored coordinates** |
| Scan history | `GET /api/detections` | Auto-populated by every signed-in detection |
| Saved conversations | `GET /api/conversations` | Reopen any past chat transcript |
| PDF report | `GET /api/report.pdf` | Farms + weather + risks + recent scans, via fpdf2 |

The `/farms/overview` endpoint is the key UX decision: rather than the client making *N* weather
calls and *N* forecast calls, the **server aggregates everything into a single response**.

A specific usability fix worth noting: the farm card's *"Full forecast"* action originally
**redirected** to the Forecast page, where the farmer had to **re-enter the location they had
already saved**. It now opens a **modal in place**, fetching straight from the farm's stored
coordinates — no navigation, no retyping.

### 7.4 Resilience

The dashboard loads its three panels with **`Promise.allSettled`**, not `Promise.all`, so one
failing API (e.g. an endpoint unavailable on an older server build) degrades that single panel
instead of blanking the entire page.

---

## 8. Key Functions & Endpoints (reference)

### REST API endpoints (20 routes across 4 blueprints)

**Core — `routes.py`** (public)
| Endpoint | Method | Purpose |
|---|---|---|
| `/` | GET | API name + endpoint list |
| `/api/health` | GET | Reports model (`mock`/`trained`), llm, **database** (`on`/`off`), class list |
| `/api/detect` | POST | **Image → pest identification + treatment reply** (multipart: `image`, optional `message`, `farm_id`) |
| `/api/chat` | POST | Question + optional `pest`, **`lat`/`lon`**, **`conversation_id`** |
| `/api/news` | GET | Live Sri Lanka agriculture headlines (Google News RSS proxy) |
| `/api/weather` | GET | Live weather for `lat`/`lon` (Open-Meteo proxy) |
| `/api/geocode` | GET | Place name `q` → coordinates (Sri Lankan matches ranked first) |
| `/api/forecast` | GET | **Outbreak forecast** for `lat`/`lon`, `months` (1–6) |

**Accounts — `routes_auth.py`**
| Endpoint | Method | Purpose |
|---|---|---|
| `/api/auth/register` | POST | Create account → returns JWT + user |
| `/api/auth/login` | POST | Verify credentials → returns JWT + user |
| `/api/auth/me` | GET | Current user (validates the token) 🔒 |

**Dashboard — `routes_farms.py`** (all 🔒)
| Endpoint | Method | Purpose |
|---|---|---|
| `/api/farms` | GET / POST | List or create saved farms |
| `/api/farms/<id>` | DELETE | Remove a farm |
| `/api/farms/overview` | GET | **Weather + top pest risk for every farm in one call** |
| `/api/detections` | GET | Scan history (latest 50) |
| `/api/report.pdf` | GET | Downloadable PDF advisory report |

**Conversations — `routes_chat.py`** (all 🔒)
| Endpoint | Method | Purpose |
|---|---|---|
| `/api/conversations` | GET | List saved chats (newest first) |
| `/api/conversations/<id>` | GET / DELETE | Full transcript / delete thread |

🔒 = requires `Authorization: Bearer <JWT>`

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
| `WeatherService.get_weather()` | `weather_service.py` | Live Open-Meteo conditions + emoji/description |
| `WeatherService.geocode()` | `weather_service.py` | Place name → coordinates, Sri Lanka ranked first |
| `ForecastService.forecast()` | `forecast_service.py` | Season + climate + severity → ranked outbreak warnings |
| `ForecastService._score()` | `forecast_service.py` | The weighted risk-scoring rule |
| `build_live_context()` | `agri_context.py` | Injects live weather/forecast into the chat prompt when relevant |
| `init_engine()` / `create_all()` | `db.py` | Optional SQLAlchemy engine; auto-creates tables |
| `login_required()` / `make_token()` | `auth.py` | JWT protection + issuing |
| `optional_user()` | `auth.py` | Dual-mode auth for anonymous-or-logged-in endpoints |
| `farms_overview()` | `routes_farms.py` | Aggregates weather + risk for all farms in one response |
| `report_pdf()` | `routes_farms.py` | Builds the PDF advisory with fpdf2 |
| `_log_detection()` | `routes.py` | Best-effort scan-history write (never breaks detection) |

### Frontend structure (`frontend/src/`)
- `App.jsx` — shell: three Context providers + NavBar + 7 routes + Footer + floating `ChatWidget`.
- **Context** — `AuthContext` (user + JWT), `LocationContext` (chosen farm location, persisted),
  `ChatContext` (widget open/close).
- **Pages** — `Home`, `News` (headlines + weather), `Bugs` (pest guide), `Forecast` (outbreak
  warnings), `Login`, `Register`, `Dashboard` (protected).
- **Components** — `ChatBot` (photo upload, typing indicator, location-aware messages),
  `PestCard`, `OutbreakCard` (colour-coded risk), `LocationPicker` (GPS **or** name search, shared
  by Weather/Forecast/Dashboard), `WeatherCard`, `Modal` + `FarmForecastModal` +
  `ConversationModal`, `ProtectedRoute`.
- `api.js` — thin client with automatic **JWT header injection**: `detectPest()`, `chat()`,
  `health()`, `getNews()`, `getWeather()`, `geocode()`, `getForecast()`, `login()`, `register()`,
  `listFarms()`, `farmsOverview()`, `listDetections()`, `listConversations()`, `downloadReport()`.

---

## 9. Notable Engineering Decisions

- **Graceful degradation everywhere.** The app runs with **no trained model** (MockModel), **no API
  key** (template replies), **no database** (auth/dashboard disabled, everything else works), and
  **no internet** (curated tips). Nothing hard-fails.
- **Dual Python runtime.** The dev machine runs **Python 3.14**, for which TensorFlow, `grpcio` and
  `psycopg2` have no wheels. The default `requirements.txt` installs *without* TensorFlow (mock
  model works out of the box), while the **Python 3.12 venv** (`.venv312`) runs the full stack —
  real CNN inference **and** the PostgreSQL driver. Gemini is called over REST to avoid `grpcio`.
- **Loose dependency lower bounds** (`>=` not exact pins) so pip can pick wheels that exist for the
  installed Python version.
- **Confidence + margin gating** avoids confidently stating a wrong pest on ambiguous photos.
- **Two-tier LLM grounding** — pest facts strictly from the own KB (safe, verifiable), general
  agronomy from general knowledge (useful), live numbers only from the real APIs (never invented).
- **Keyword-gated context injection** instead of LLM function-calling — deterministic, debuggable,
  and it avoids an external API call on every ordinary message.
- **Server-side aggregation** (`/farms/overview`) keeps the client simple and avoids an N+1 storm
  of weather/forecast requests.
- **Database connectivity.** Supabase's **direct** connection host is IPv6-only and timed out on
  ~2 of 3 attempts from the dev network; switching to the **Session pooler** (IPv4) gave 5/5
  reliable connections. The database password contains `/`, `+` and `*`, which must be
  **percent-encoded** in the connection URI or SQLAlchemy misparses it. `pool_pre_ping=True` and
  `pool_recycle=300` transparently recover dropped cloud connections.
- **Secrets hygiene.** All keys and the `DATABASE_URL` live in a git-ignored `.env`; `.env.example`
  documents the shape without secrets.

---

## 10. Testing & Verification

- **Automated:** `backend/tests/test_api.py` covers the core API surface (health, detect with a
  sample image, chat, validation errors), passing against the deterministic MockModel so results
  are reproducible in CI without a GPU or the large model file.
- **Integration (live):** the full account flow was exercised end-to-end against the real
  PostgreSQL instance — register → login → add farm → bulk overview → PDF → delete — including
  negative cases (wrong password → **401**, missing token → **401**, bad coordinates → **400**).
- **UI (browser-driven):** registration through the real form, location search
  ("Anuradhapura" → 8.31, 80.41), farm creation, persistence across a full page reload, and the
  in-place forecast modal (Kandy farm → 15 warning cards without navigating away).
- **Data pipeline:** the GBIF calendar builder supports `--dry-run` to preview derived peak months
  before overwriting, and backs up the original hand-written calendar to
  `outbreak_calendar.mock.json`.

---

## 11. Possible Future Work

- **Close the data loop** — as farmers log detections, replace the GBIF-derived calendar with the
  system's *own* observed outbreak records, making predictions genuinely local over time.
- **Sharpen coarse taxa** — target *Pomacea* (golden apple snail) instead of class *Gastropoda*, etc.
- **Push notifications / SMS alerts** when a severe risk appears for a saved farm.
- **Sinhala/Tamil localisation** (KB currently English-only; `sinhala_name` field reserved).
- **On-device/edge inference** via the exported TFLite model for offline field use.
- **Historical climate** (NASA POWER / Open-Meteo archive) to learn the conditions that preceded
  past outbreaks, rather than only comparing against current weather.
- **Cloud deployment** with Alembic migrations, rate limiting and refresh tokens.

---

*Report generated from the current codebase of `crop-bug-identify` (Smart Pest Detection &
Prediction System).*

# Kinesis — Real-Time Human Activity Recognition

[![CI](https://github.com/AP0827/Kinesis/actions/workflows/ci.yml/badge.svg)](https://github.com/AP0827/Kinesis/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/)
[![Node 18+](https://img.shields.io/badge/node-18+-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/docker-compose-2496ed.svg)](https://docs.docker.com/compose/)

A full-stack human activity recognition (HAR) system that benchmarks classical machine learning (SVM) against deep learning (LSTM) on tri-axial accelerometer data, with a live inference pipeline driven by an ESP32 wearable.

The project covers the complete ML lifecycle: dataset preparation, model training and comparison in Jupyter, a Flask inference API, a real-time WebSocket ingestion server, a React/TypeScript dashboard, and embedded firmware for an ESP32-based wearable. The whole stack is dockerized — `./start.sh` brings everything up.

> **Status:** Research / academic project. Trained models, datasets, and a working end-to-end demo are included.

---

## Table of Contents

- [Highlights](#highlights)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Repository Layout](#repository-layout)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Clone and configure](#1-clone-and-configure)
  - [2. Run the stack with Docker](#2-run-the-stack-with-docker)
  - [3. Run without Docker (manual)](#3-run-without-docker-manual)
  - [4. ESP32 firmware](#4-esp32-firmware)
  - [5. Notebooks (training & data prep)](#5-notebooks-training--data-prep)
- [REST API Reference](#rest-api-reference)
- [Dataset](#dataset)
- [Models](#models)
- [Configuration & Secrets](#configuration--secrets)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

---

## Highlights

- **Dual-model inference** — switch between SVM and LSTM at runtime via a single REST endpoint.
- **Real-time pipeline** — ESP32 streams 50 Hz accelerometer data over WebSocket; predictions are written to Firestore and pushed to the dashboard live.
- **One-command deploy** — `./start.sh` boots api + websocket + dashboard via Docker Compose. `./stop.sh` tears it down.
- **Reproducible training** — Jupyter notebooks cover dataset windowing, feature engineering, hyperparameter search (GridSearchCV), LSTM/CNN architectures, and evaluation.
- **Six recognized activities** — Walking, Jogging, Standing, Sitting, Upstairs, Downstairs.
- **Polished frontend** — React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui dashboard with charts (Recharts) and live state from Firestore.
- **Pluggable data source** — the inference server accepts both simulated WISDM samples and live ESP32 data.

## System Architecture

```
┌──────────────┐        ┌──────────────────┐        ┌──────────────────┐
│  ESP32 board │ ─────▶ │  WebSocket       │ ─────▶ │  Flask inference │
│  (3-axis     │  WS    │  server (ws)     │  HTTP  │  API (api)       │
│  accel @50Hz)│        │  port 5002       │        │  port 5001       │
└──────────────┘        └──────────────────┘        └────────┬─────────┘
                                                             │
                                                             ▼
                                                    ┌──────────────────┐
                                                    │   Firestore      │
                                                    │   (predictions)  │
                                                    └────────┬─────────┘
                                                             │
                                                             ▼
                                                    ┌──────────────────┐
                                                    │  React dashboard │
                                                    │  (frontend:8080) │
                                                    └──────────────────┘
```

Each box maps to a service in [`docker-compose.yml`](docker-compose.yml). A simulator service (`--with-simulator`) can replace the ESP32 entirely, replaying the WISDM dataset over WebSocket.

## Tech Stack

| Layer        | Technology                                                        |
|--------------|-------------------------------------------------------------------|
| ML / Models  | scikit-learn (SVM, GridSearchCV), TensorFlow / Keras (LSTM, CNN)  |
| Backend      | Python 3.11, Flask 3, Flask-CORS, websockets, aiohttp, gunicorn   |
| Persistence  | Google Firestore (via `firebase-admin`)                           |
| Frontend     | React 18, TypeScript, Vite 5, TailwindCSS, shadcn/ui, Recharts    |
| Serving      | nginx (alpine) for the production frontend bundle                 |
| Orchestration| Docker + Docker Compose                                           |
| Firmware     | Arduino C++ for ESP32 (`WebSocketsClient`, `WiFi`)                |
| Notebooks    | Jupyter, NumPy, pandas, matplotlib, seaborn, SciPy                |

## Repository Layout

```
Kinesis/
├── docker-compose.yml           # api + ws + frontend (+ simulator profile)
├── start.sh                     # Bring the stack up
├── stop.sh                      # Tear it down
├── .env.example                 # Compose-level env (Firebase web config, API base URL)
├── SVMvsDL.ipynb                # Model training & comparison notebook
├── SaveDatasetCSV.ipynb         # WISDM raw → tidy CSV conversion
├── requirements.txt             # Notebook / training dependencies
├── datasets/
│   └── WISDM/                   # Raw WISDM v1.1 data
└── app/
    ├── backend/                 # Flask API + WebSocket ingestion
    │   ├── Dockerfile           # Shared image for api / ws / simulator
    │   ├── app.py               # Flask entrypoint (port 5001)
    │   ├── websocket_server.py  # Realtime ingestion (port 5002)
    │   ├── routes/predict.py    # /api/predict, /api/model
    │   ├── model/               # Trained .h5 / .pkl artifacts + loader
    │   ├── simulator/           # Replays WISDM data over WebSocket
    │   ├── switch_model.py      # Thread-safe active-model selector
    │   ├── firebase_client.py   # Firestore admin client
    │   ├── credentials/         # Service-account JSON (gitignored)
    │   └── requirements.txt     # Backend Python dependencies
    ├── frontend/                # React + Vite dashboard
    │   ├── Dockerfile           # Multi-stage: vite build → nginx
    │   └── nginx.conf
    └── sketch_may16a/
        └── sketch_may16a.ino    # ESP32 firmware
```

## Getting Started

### Prerequisites

- **Docker** ≥ 24 with the **Compose v2** plugin (Docker Desktop bundles both)
- **Arduino IDE** or **PlatformIO** with the ESP32 board package and the `WebSockets` library by Markus Sattler — only required if you want to use real hardware
- A **Firebase project** with Firestore enabled, plus:
  - A service-account JSON key (for the backend)
  - A web app config (for the frontend)

For non-Docker workflows you'll also want **Python 3.10+** (3.10–3.12 supported by TensorFlow 2.19) and **Node.js 18+**.

### 1. Clone and configure

```bash
git clone https://github.com/aakri0/Kinesis.git
cd Kinesis

# Three .env files — backend, frontend, and the compose-level one for build args.
cp app/backend/.env.example  app/backend/.env
cp app/frontend/.env.example app/frontend/.env
cp .env.example              .env

# Drop your Firebase service-account JSON into app/backend/credentials/.
# Anything matching app/backend/credentials/*.json is auto-discovered.
mkdir -p app/backend/credentials
mv ~/Downloads/your-firebase-key.json app/backend/credentials/
```

Fill in the Firebase web config in both `app/frontend/.env` and the root `.env` (the compose file passes the latter into the frontend image as build args). See [Configuration & Secrets](#configuration--secrets) for what each value does.

### 2. Run the stack with Docker

```bash
./start.sh                  # api + ws + frontend
./start.sh --with-simulator # also replay WISDM data (no hardware needed)
./start.sh --rebuild        # force rebuild of images
./start.sh --logs           # tail compose logs after start

./stop.sh                   # stop and remove containers
./stop.sh --volumes         # also drop named volumes
./stop.sh --rmi             # also remove built images
```

After `./start.sh`, browse to:

| URL                               | What                  |
|-----------------------------------|-----------------------|
| http://localhost:8080             | Dashboard             |
| http://localhost:5001/health      | API health check      |
| ws://localhost:5002               | WebSocket ingest      |

Compose service names (`api`, `ws`, `frontend`, `simulator`) can be addressed individually:

```bash
docker compose logs -f api
docker compose restart frontend
docker compose --profile simulator up -d simulator
```

### 3. Run without Docker (manual)

If you'd rather run each process directly on your host, the commands are:

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r app/backend/requirements.txt

python -m app.backend.app                # http://localhost:5001
python -m app.backend.websocket_server   # ws://localhost:5002
python -m app.backend.simulator          # optional WISDM replay

cd app/frontend && npm install && npm run dev   # http://localhost:8080
```

For production (still without Docker):

```bash
gunicorn -w 2 -b 0.0.0.0:5001 app.backend.app:app
```

> Run all backend commands from the **repo root** so the `app.backend...` package paths resolve.

### 4. ESP32 firmware

1. Open `app/sketch_may16a/sketch_may16a.ino` in the Arduino IDE.
2. Install the ESP32 board package (Boards Manager → "esp32") and the **WebSockets** library by Markus Sattler.
3. Update the `ssid`, `password`, and `host` placeholders at the top of the sketch:
   - `host` is the IP of the machine running the `ws` service.
   - `port` is `5002` to match `websocket_server.py`. Keep these aligned if you change either.
4. Wire a 3-axis analog accelerometer (e.g. ADXL335) to GPIOs 34 (X), 35 (Y), 32 (Z).
5. Flash the board. Watch the serial monitor at 115200 baud for connection status.

No hardware? Use `./start.sh --with-simulator` instead — it produces the same WebSocket message format from the WISDM CSV.

### 5. Notebooks (training & data prep)

```bash
pip install -r requirements.txt
jupyter notebook
```

- `SaveDatasetCSV.ipynb` — converts `datasets/WISDM/WISDM_raw.txt` into a tidy CSV.
- `SVMvsDL.ipynb` — windows the data, extracts statistical features, trains and evaluates SVM (with `GridSearchCV`) and an LSTM (and a CNN baseline), and produces confusion matrices and classification reports for each.

Re-running the final cells will regenerate `LSTM_model_50.h5`, `SVM_model_50.pkl`, and `scaler_50.pkl` under `app/backend/model/`.

## REST API Reference

All endpoints are served by Flask on `http://localhost:5001`.

### `POST /api/predict`

Run inference on a 50-sample window of accelerometer readings.

Request:

```json
{
  "window": [[0.12, -0.98, 0.05], "...50 rows of [x, y, z]..."],
  "user_id": "user_1",
  "source": "simulated",
  "actual_activity": "Walking"
}
```

Response:

```json
{ "activity": "Walking", "accuracy": 0.9712 }
```

A document is also written to the `predictions` Firestore collection, including the active model, source, timestamp, and last sensor sample.

### `GET /api/model`

Returns the currently active model: `{"active_model": "lstm"}` or `"svm"`.

### `POST /api/model`

Switch the active model at runtime.

```json
{ "model_type": "svm" }
```

### `GET /test-firestore`

Smoke-test the Firestore connection by writing a sentinel document. Disabled unless `ENABLE_FIRESTORE_TEST=1`.

## Dataset

Models are trained on the [WISDM Activity Recognition v1.1](https://www.cis.fordham.edu/wisdm/dataset.php) dataset:

- 36 subjects, smartphone accelerometers at 20 Hz
- Labels: **Walking**, **Jogging**, **Standing**, **Sitting**, **Upstairs**, **Downstairs**
- Raw data lives at `datasets/WISDM/WISDM_raw.txt`

The training pipeline windows the signal (window size 50, stride 50), extracts per-axis statistical features (mean, std, min, max, median, energy = 18 features total), and z-scores them before fitting the SVM. The LSTM consumes the raw windowed signal directly.

## Models

| Model | Input shape | Notes                                                   |
|-------|-------------|---------------------------------------------------------|
| SVM   | `(18,)`     | RBF kernel; `C` and `gamma` tuned with `GridSearchCV`. Scaler saved as `scaler_50.pkl`. |
| LSTM  | `(50, 3)`   | 64–128 hidden units, dropout 0.3–0.5, early stopping.   |
| CNN   | `(50, 3)`   | Conv1D + MaxPooling baseline (notebook only, not deployed). |

Trained artifacts are committed under `app/backend/model/` so the API works out of the box.

## Configuration & Secrets

This repo never contains real credentials. You will need to provide your own. See [SECURITY.md](SECURITY.md) for the full disclosure policy and history-rotation guidance.

There are **three** `.env` files:

| File                       | Used by                              | What goes in it                              |
|----------------------------|--------------------------------------|----------------------------------------------|
| `app/backend/.env`         | Flask app + websocket_server         | `FIREBASE_CREDENTIALS`, `CORS_ORIGINS`, `API_BASE_URL`, `ENABLE_FIRESTORE_TEST`, etc. |
| `app/frontend/.env`        | Vite dev server (`npm run dev`)      | `VITE_FIREBASE_*`, `VITE_API_BASE_URL`        |
| `.env` (repo root)         | docker-compose build args            | Same `VITE_*` keys, baked into the frontend image at build time |

All three are gitignored. Each has an adjacent `.env.example`.

**Backend — Firestore admin & runtime config:**

1. In the Firebase console, generate a service-account JSON key.
2. Either:
   - Save it to `app/backend/credentials/<anything>.json` — `firebase_client.py` auto-discovers any `*.json` in that folder (it is gitignored), or
   - Set `FIREBASE_CREDENTIALS=/absolute/path/to/key.json` in your environment.
3. In `app/backend/.env`, set:
   - `CORS_ORIGINS` — comma-separated allowlist of dashboard origins (e.g. `https://your-dashboard.example.com`). Defaults to `localhost:8080` for development.
   - `FLASK_DEBUG=0` (default). **Never** set this to `1` in production — Flask debug mode allows arbitrary code execution via the Werkzeug debugger.
   - `API_BASE_URL` — where the websocket server sends prediction requests. Compose overrides this to `http://api:5001` for inter-container traffic.
   - `ENABLE_FIRESTORE_TEST` — leave unset; the `/test-firestore` endpoint is disabled by default.
4. Do **not** commit absolute paths, service-account keys, or `.env` files.

**Frontend — Firestore web SDK & API base URL:**

1. Fill in `VITE_FIREBASE_*` from your Firebase web app config (Project settings → General → Your apps → Web app).
2. `VITE_API_BASE_URL` defaults to `http://localhost:5001`. Override it if you proxy the API behind a different hostname.
3. For Docker, the same keys also need to be in the **root** `.env` so `docker compose build` can inject them into the image. They become public JS once built — Firebase web SDK keys are designed for this.

**ESP32 — WiFi credentials:**

Edit the `ssid`, `password`, and `host` constants in `sketch_may16a.ino` locally; do not commit personal network credentials.

## Troubleshooting

- **`docker compose: unknown command`** — install the Compose v2 plugin (Docker Desktop ≥ 4 has it; on Linux: `sudo apt install docker-compose-plugin`).
- **Frontend renders but can't reach the API** — check `VITE_API_BASE_URL` in the root `.env`; remember that the browser, not the container, opens the connection, so `api` (the compose service name) won't resolve from the browser.
- **`ModuleNotFoundError: app.backend...`** (manual mode) — run backend commands from the repo root, not from inside `app/backend/`.
- **WebSocket port mismatch** — the firmware ships pointing at port 5000 while `websocket_server.py` listens on 5002. Pick one and align both ends.
- **Firestore writes fail silently** — confirm the service-account JSON exists at `app/backend/credentials/*.json` (or the path in `FIREBASE_CREDENTIALS`) and that the project ID matches the frontend config.
- **TensorFlow install errors on Apple Silicon (manual mode)** — install `tensorflow-macos` and `tensorflow-metal` instead of `tensorflow`. The Docker image uses linux/amd64 wheels and is unaffected.

## Contributing

Issues and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, branching, commit conventions, and the review checklist.

## License

Released under the [MIT License](LICENSE).

## Acknowledgments

- [WISDM Lab](https://www.cis.fordham.edu/wisdm/) at Fordham University for the activity recognition dataset.
- The TensorFlow, scikit-learn, and shadcn/ui open-source communities.
- Originally co-developed as an academic project; this fork is maintained by [@aakri0](https://github.com/aakri0).

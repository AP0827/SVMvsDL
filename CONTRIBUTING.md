# Contributing to Kinesis

Thanks for taking the time to contribute. This document is the short version of "how we work on this repo." If anything here is unclear or out of date, open an issue or PR.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Ways to contribute](#ways-to-contribute)
- [Development setup](#development-setup)
- [Project layout & ownership](#project-layout--ownership)
- [Branching & commits](#branching--commits)
- [Pull requests](#pull-requests)
- [Coding standards](#coding-standards)
- [Testing](#testing)
- [Reporting bugs](#reporting-bugs)
- [Security issues](#security-issues)

## Code of Conduct

Be kind, be specific, be technical. Disagree with the idea, not the person. Harassment, personal attacks, and discriminatory language are not welcome here.

## Ways to contribute

- **Bugs** — open an issue with reproduction steps and expected vs. actual behavior.
- **Features** — open an issue first to align on scope before writing code.
- **Docs** — typo fixes and clarifications can be sent directly as PRs.
- **Models** — improvements to the training pipeline are welcome; please include before/after metrics on the WISDM test split.
- **Hardware support** — additional sensor boards or wiring guides are great additions.

## Development setup

1. Fork the repo and clone your fork.
2. Follow the [Getting Started](README.md#getting-started) section of the README to set up `.env` files and credentials.
3. Bring the stack up with Docker:

   ```bash
   ./start.sh                  # api + ws + frontend
   ./start.sh --with-simulator # also replay WISDM data
   docker compose logs -f api  # tail one service's logs
   ./stop.sh                   # tear it down
   ```

   Or run each process manually — see [Run without Docker](README.md#3-run-without-docker-manual).

4. Provide your own Firebase credentials — see [Configuration & Secrets](README.md#configuration--secrets). **Never commit credentials.**

## Project layout & ownership

| Area              | Path                          | Notes                                              |
|-------------------|-------------------------------|----------------------------------------------------|
| Inference API     | `app/backend/`                | Flask app, Firestore client, model loader          |
| Realtime ingest   | `app/backend/websocket_server.py` | Sliding-window predictor                       |
| Simulator         | `app/backend/simulator/`      | WISDM replay over WebSocket                        |
| Trained models    | `app/backend/model/`          | Keep `.h5`, `.pkl`, and `scaler*.pkl` in sync      |
| Frontend          | `app/frontend/`               | React 18 + Vite + TailwindCSS + shadcn/ui          |
| Firmware          | `app/sketch_may16a/`          | Arduino C++ for ESP32                              |
| Container build   | `app/backend/Dockerfile`, `app/frontend/Dockerfile`, `docker-compose.yml` | Keep image build args & service env in sync |
| Training          | `SVMvsDL.ipynb`               | Source of truth for model artifacts                |
| Data prep         | `SaveDatasetCSV.ipynb`        | Raw → tidy CSV pipeline                            |

If a change touches more than one area (e.g. model output shape changes), update the consumers in the same PR.

## Branching & commits

- Branch from `main`. Use a short, descriptive name: `fix/firestore-path`, `feat/realtime-chart`, `docs/api-reference`.
- Keep commits focused — one logical change per commit. Squash noisy fixups before opening a PR.
- Commit messages: short imperative subject (≤ 72 chars), optional body explaining *why* and any tradeoffs. Conventional Commit prefixes (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`) are encouraged but not required.
- Don't bundle dependency bumps with feature work in the same commit.

## Pull requests

Before opening a PR, please:

1. Make sure your branch is up to date with `main`.
2. Run the relevant checks (see [Testing](#testing) and [Coding standards](#coding-standards)).
3. Update the README, this file, or inline docs if behavior changed.
4. Update or add `.env.example` keys if you introduced a new environment variable. If the new var is consumed by the frontend at build time, add it to **both** `app/frontend/.env.example` and the root `.env.example`, and wire it through `docker-compose.yml` and `app/frontend/Dockerfile`.
5. Don't commit anything from `app/backend/credentials/` or your local `.env` files.

Your PR description should include:

- **What** changed and **why** (link the issue if there is one).
- Screenshots or short clips for UI changes.
- For ML changes: the metrics before/after on the same evaluation split.
- A short test plan: what you ran locally and what you'd like reviewers to verify.

PRs get reviewed faster when they are small, focused, and have a clear test plan.

## Coding standards

**Python (backend, scripts, notebooks):**

- Target Python 3.10+.
- Follow PEP 8; keep lines under ~100 chars.
- Prefer dependency injection over module-level state. The exception in this repo is the singleton Firestore client in `app/backend/firebase_client.py`.
- Don't reintroduce hardcoded absolute paths. Use `os.path.dirname(__file__)` or environment variables.
- Don't print to stdout in library code; the only places where logging emojis are okay are `app/backend/websocket_server.py` and `simulator/__main__.py`, which are entrypoints.

**TypeScript / React (frontend):**

- Run `npm run lint` before pushing.
- Use the existing shadcn/ui primitives under `src/components/ui/` rather than introducing new component libraries.
- Read configuration from `import.meta.env.VITE_*`. Do not commit real keys.
- Keep components small and typed. Prefer `function` components and React hooks.

**Arduino / ESP32:**

- Keep WiFi credentials and host IPs as `const char*` at the top of the sketch — never check in a real SSID/password.
- Match the ports and message schema documented in the root README.

**Notebooks:**

- Clear all outputs before committing if the notebook is being changed for code reasons (`jupyter nbconvert --clear-output`).
- If you re-train, commit the new `.h5` / `.pkl` artifacts in the same PR and update any reported metrics.

## Testing

There is no formal test harness yet. Until there is, please verify the following manually for the relevant areas:

- **Stack smoke test:**
  - `./start.sh --rebuild` builds and brings up api + ws + frontend.
  - `curl -fsS http://localhost:5001/health` returns `{"status":"ok"}`.
  - `http://localhost:8080` renders the dashboard.
  - `./stop.sh` cleanly tears it down.
- **Backend:**
  - `python -m app.backend.app` starts on port 5001 (manual mode).
  - `curl -X POST localhost:5001/api/predict -H 'Content-Type: application/json' -d '{"window": [...50 rows...]}'` returns an `activity` and `accuracy`.
  - `GET /api/model` and `POST /api/model` toggle between `lstm` and `svm`.
- **WebSocket:**
  - `python -m app.backend.websocket_server` listens on `ws://0.0.0.0:5002`.
  - Either the simulator or the ESP32 firmware can connect and stream samples.
- **Frontend:**
  - `npm run lint` is clean.
  - `npm run build` succeeds.
  - The dashboard renders predictions in real time when the backend is running.
- **Notebooks:**
  - `SVMvsDL.ipynb` runs top-to-bottom and reproduces the saved artifacts.

If you add automated tests (pytest, vitest, etc.), please also expose them as a script or `make` target so contributors can run them in one command.

## Reporting bugs

Please include:

1. What you did (commands, request payloads, UI steps).
2. What you expected.
3. What actually happened (full error message + traceback or screenshot).
4. Environment: OS, Python version, Node version, browser, hardware.
5. Whether the issue reproduces with the simulator or only with the ESP32.

## Security issues

If you find a security vulnerability — credential leaks, SSRF, deserialization issues, anything that could compromise a deployment — please **do not open a public issue**. Email the maintainer or open a private security advisory on GitHub instead.

---

Thanks again. Small, well-scoped contributions are the best kind.

# Kinesis Dashboard (Frontend)

React + TypeScript + Vite dashboard for the [Kinesis](../../README.md) human activity recognition project. It subscribes to predictions from Firestore in real time and visualizes the live activity, accuracy, and historical breakdown.

## Stack

- **React 18** + **TypeScript**
- **Vite 5** (`@vitejs/plugin-react-swc`)
- **TailwindCSS** + **shadcn/ui** (Radix primitives)
- **Recharts** for visualizations
- **Firebase Web SDK** (`firestore`) for live prediction data
- **TanStack Query**, **react-hook-form**, **zod**

## Quick start

The easiest path is the dockerized stack from the repo root:

```bash
./start.sh        # builds + serves the dashboard at http://localhost:8080
```

For local Vite-based development with HMR:

```bash
npm install
cp .env.example .env       # then fill in your Firebase web config
npm run dev                # http://localhost:8080
```

## Scripts

| Command            | Description                            |
|--------------------|----------------------------------------|
| `npm run dev`      | Start Vite dev server with HMR         |
| `npm run build`    | Production build to `dist/`            |
| `npm run build:dev`| Development-mode build                 |
| `npm run preview`  | Preview the production build locally   |
| `npm run lint`     | Run ESLint over the project            |

## Configuration

Two env vars groups, both prefixed `VITE_*`:

- `VITE_FIREBASE_*` — Firebase web app config (Project settings → Your apps → Web app).
- `VITE_API_BASE_URL` — backend base URL the browser hits. Defaults to `http://localhost:5001`.

See `.env.example`. Never commit a real `.env` file.

When built inside Docker, these are passed as `--build-arg` from the root `.env` (see `docker-compose.yml`).

## Project layout

```
src/
├── App.tsx              # Root component / dashboard shell
├── firebase.ts          # Firebase client initialization
├── components/          # Reusable UI + dashboard panels
├── pages/               # Route-level pages (e.g. NotFound)
├── hooks/               # Custom React hooks
└── lib/                 # Utilities
```

For backend setup, the inference API, and the ESP32 firmware, see the [root README](../../README.md).

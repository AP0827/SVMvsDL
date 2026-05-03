# Security Policy

## Reporting a vulnerability

If you discover a security issue — credential leak, SSRF, deserialization, auth bypass, or anything that could compromise a deployment — **please do not open a public GitHub issue.**

Open a private GitHub Security Advisory on this repository, or contact the maintainer ([@aakri0](https://github.com/aakri0)) directly.

We will:

1. Acknowledge receipt within a few days.
2. Investigate and confirm the issue.
3. Coordinate a fix and disclosure timeline with the reporter.
4. Credit the reporter unless they prefer to remain anonymous.

## Supported versions

This is a research / academic project. Only the `main` branch receives security fixes. There are no LTS releases.

## Known historical exposures

These are documented for transparency. The working tree is clean today, but earlier commits in `git log` contain the artifacts below:

### Firebase web SDK config (project `har-wearable`)

The Firebase web config — including the API key `AIzaSyD7m...UHE` — was committed in plaintext to `app/frontend/src/firebase.ts` from `b6230af` until commit `da3347f`, where it was moved to `VITE_FIREBASE_*` environment variables.

**Why this is not catastrophic:** Firebase web SDK API keys are intentionally public — they identify a project, not a user. Security depends entirely on Firestore Security Rules.

**Recommended action for anyone deploying their own copy of this project:**

1. Rotate the leaked key by **disabling the leaked Firebase web app** in the Firebase console (Project settings → Your apps → ⋮ → Remove app) and creating a new web app with a fresh config.
2. Audit your **Firestore Security Rules** to require authentication and limit writes to the `predictions` collection to your service account or authenticated users only. The default open rules used during development are unsafe for production.
3. Set up budget alerts and quotas in Google Cloud Console so a leaked or abused key cannot cause runaway billing.

### ESP32 WiFi credentials

A real WiFi SSID (`F54`) and password were committed to `app/sketch_may16a/sketch_may16a.ino` until `da3347f`. The values have since been replaced with placeholders. If that network is still in use, the password should be changed.

### Local network IPs

A `netsh` portproxy script (`app/undopowershellfwd.txt`) and several scripts contained hardcoded developer IPs (`192.168.x.x`, `172.x.x.x`). These were private LAN addresses and not directly exploitable, but they have been removed.

## Scrubbing git history

If you want to remove these artifacts from git history entirely, that requires rewriting history (e.g. with [`git filter-repo`](https://github.com/newren/git-filter-repo)) and force-pushing. This is a destructive operation that invalidates all existing clones and forks. It is intentionally **not** done as part of regular maintenance — the secrets above should be rotated upstream rather than silently rewritten.

## Production hardening checklist

Anyone deploying this project should at minimum:

- [ ] Run the API behind a real WSGI server — the `api` service in `docker-compose.yml` already uses `gunicorn`. Never `app.run(debug=True)` in production.
- [ ] Set `CORS_ORIGINS` (in `app/backend/.env`) to an explicit allowlist of dashboard origins.
- [ ] Add authentication in front of `/api/*` (e.g. via API gateway, OAuth proxy, or Firebase Auth).
- [ ] Add rate limiting (Flask-Limiter, nginx, or API gateway).
- [ ] Lock Firestore Security Rules to require authentication.
- [ ] Use a managed secret store (Google Secret Manager, AWS Secrets Manager, Doppler) rather than service-account JSON files baked into the image. The provided `docker-compose.yml` mounts `app/backend/credentials/` read-only — swap that mount for a secret-store integration when you go to prod.
- [ ] Pin and scan the base images in `app/backend/Dockerfile` and `app/frontend/Dockerfile` (Trivy, Grype, or your registry's scanner).
- [ ] Build the frontend image with the **production** Firebase web config — those values are baked into the JS bundle and are public the moment you ship.
- [ ] Configure structured logging and ship logs to a central destination.
- [ ] Set up uptime / error monitoring (Sentry, Cloud Monitoring, etc.).

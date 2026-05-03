#!/usr/bin/env bash
#
# start.sh — bring the Kinesis stack up via docker compose.
#
# Services:
#   api        Flask inference API     http://localhost:5001
#   ws         WebSocket ingestion     ws://localhost:5002
#   frontend   Static dashboard        http://localhost:8080
#   simulator  WISDM replay (optional, --with-simulator)
#
# Usage:
#   ./start.sh                  # api + ws + frontend
#   ./start.sh --with-simulator # also replay WISDM data over ws
#   ./start.sh --rebuild        # force rebuild of images
#   ./start.sh --logs           # tail docker-compose logs after start

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_ROOT"

WITH_SIMULATOR=0
REBUILD=0
TAIL_LOGS=0

for arg in "$@"; do
  case "$arg" in
    --with-simulator) WITH_SIMULATOR=1 ;;
    --rebuild)        REBUILD=1 ;;
    --logs)           TAIL_LOGS=1 ;;
    -h|--help)
      sed -n '2,16p' "$0" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    *)
      echo "unknown flag: $arg" >&2
      exit 2 ;;
  esac
done

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required but not in PATH" >&2
  exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
  echo "docker compose plugin is required (Docker Desktop ≥ 4 or the compose v2 plugin)" >&2
  exit 1
fi

for f in app/backend/.env app/frontend/.env .env; do
  if [[ ! -f "$f" ]]; then
    echo "missing $f — copy from ${f%/*}/.env.example and fill in" >&2
    exit 1
  fi
done

profiles=()
(( WITH_SIMULATOR )) && profiles+=(--profile simulator)

build_flag=()
(( REBUILD )) && build_flag+=(--build)

echo "[start] bringing up Kinesis stack…"
docker compose "${profiles[@]}" up -d "${build_flag[@]}"

echo
docker compose ps
cat <<EOF

Stack is up. Endpoints:
  • Dashboard       http://localhost:8080
  • Inference API   http://localhost:5001/health
  • WebSocket       ws://localhost:5002

Logs:    docker compose logs -f [service]
Stop:    ./stop.sh
EOF

if (( TAIL_LOGS )); then
  exec docker compose logs -f
fi

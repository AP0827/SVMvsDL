#!/usr/bin/env bash
#
# stop.sh — tear the Kinesis stack down via docker compose.
#
# Usage:
#   ./stop.sh             # stop and remove containers
#   ./stop.sh --volumes   # also remove named volumes (loses ephemeral state)
#   ./stop.sh --rmi       # also remove built images

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_ROOT"

REMOVE_VOLUMES=0
REMOVE_IMAGES=0

for arg in "$@"; do
  case "$arg" in
    --volumes) REMOVE_VOLUMES=1 ;;
    --rmi)     REMOVE_IMAGES=1 ;;
    -h|--help)
      sed -n '2,9p' "$0" | sed 's/^# \{0,1\}//'
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

flags=(--remove-orphans)
(( REMOVE_VOLUMES )) && flags+=(-v)
(( REMOVE_IMAGES )) && flags+=(--rmi local)

echo "[stop] tearing down Kinesis stack…"
docker compose --profile simulator down "${flags[@]}"
echo "[stop] done."

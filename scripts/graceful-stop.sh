#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="${META_TERMINAL_ROOT:-$(cd -- "${SCRIPT_DIR}/.." && pwd)}"
COMPOSE_FILE="${COMPOSE_FILE:-${ROOT_DIR}/docker-compose.yaml}"
APP_TIMEOUT_SEC="${META_TERMINAL_APP_STOP_TIMEOUT_SEC:-45}"
CLICKHOUSE_TIMEOUT_SEC="${META_TERMINAL_CLICKHOUSE_STOP_TIMEOUT_SEC:-300}"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is not available" >&2
  exit 1
fi

if [ ! -f "${COMPOSE_FILE}" ]; then
  echo "compose file not found: ${COMPOSE_FILE}" >&2
  exit 1
fi

docker compose -f "${COMPOSE_FILE}" stop -t "${APP_TIMEOUT_SEC}" app
docker compose -f "${COMPOSE_FILE}" stop -t "${CLICKHOUSE_TIMEOUT_SEC}" clickhouse

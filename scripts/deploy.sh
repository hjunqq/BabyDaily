#!/usr/bin/env bash
# BabyDaily offline Docker deployment script for macOS/Linux
# Mirrors scripts/deploy.ps1 workflow:
# 1) Build images locally
# 2) Save images to tar
# 3) Upload compose/env/image tar to remote host
# 4) Remote docker load + docker compose up -d

set -euo pipefail

DEPLOY_HOST="192.168.8.106"
DEPLOY_USER="root"
DEPLOY_PATH="/opt/BabyDaily"
IMAGE_FILE=""
KEEP_IMAGE_TAR="false"
SSH_OPTS="-o StrictHostKeyChecking=no"

usage() {
  cat <<USAGE
Usage: $(basename "$0") [options]

Options:
  --host <ip-or-hostname>   Deploy host (default: ${DEPLOY_HOST})
  --user <ssh-user>         SSH user (default: ${DEPLOY_USER})
  --path <remote-path>      Remote deploy path (default: ${DEPLOY_PATH})
  --image-file <path>       Local image tar output path
  --keep-image-tar          Keep local image tar after deployment
  --strict-host-checking    Enable strict host key checking
  -h, --help                Show this help

Example:
  ./scripts/deploy.sh --host 192.168.8.106 --user root --path /opt/BabyDaily
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --host)
      DEPLOY_HOST="$2"
      shift 2
      ;;
    --user)
      DEPLOY_USER="$2"
      shift 2
      ;;
    --path)
      DEPLOY_PATH="$2"
      shift 2
      ;;
    --image-file)
      IMAGE_FILE="$2"
      shift 2
      ;;
    --keep-image-tar)
      KEEP_IMAGE_TAR="true"
      shift
      ;;
    --strict-host-checking)
      SSH_OPTS=""
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
if [[ -z "${IMAGE_FILE}" ]]; then
  IMAGE_FILE="${SCRIPT_DIR}/babydaily-images.tar"
fi

SSH_TARGET="${DEPLOY_USER}@${DEPLOY_HOST}"
COMPOSE_FILE="${PROJECT_DIR}/docker-compose.prod.yml"
ENV_FILE="${PROJECT_DIR}/backend/.env"

for cmd in docker ssh scp; do
  if ! command -v "${cmd}" >/dev/null 2>&1; then
    echo "Required command not found: ${cmd}" >&2
    exit 1
  fi
done

if [[ ! -f "${COMPOSE_FILE}" ]]; then
  echo "Missing file: ${COMPOSE_FILE}" >&2
  exit 1
fi

echo
echo "========================================"
echo "  BabyDaily Deployment Script (macOS)"
echo "========================================"
echo

echo "[1/4] Building Docker images..."
(
  cd "${PROJECT_DIR}"
  docker compose build --no-cache
)
echo "[OK] Images built"

echo
echo "[2/4] Exporting images..."
rm -f "${IMAGE_FILE}"
docker save babydaily-backend babydaily-frontend postgres:16-alpine -o "${IMAGE_FILE}"
IMAGE_SIZE_MB="$(du -m "${IMAGE_FILE}" | awk '{print $1}')"
echo "[OK] Exported: ${IMAGE_FILE} (${IMAGE_SIZE_MB} MB)"

echo
echo "[3/4] Uploading files to ${SSH_TARGET}..."
ssh ${SSH_OPTS} "${SSH_TARGET}" "mkdir -p '${DEPLOY_PATH}/uploads' '${DEPLOY_PATH}/database/postgres'"
scp ${SSH_OPTS} "${COMPOSE_FILE}" "${SSH_TARGET}:${DEPLOY_PATH}/"
scp ${SSH_OPTS} "${IMAGE_FILE}" "${SSH_TARGET}:${DEPLOY_PATH}/"
if [[ -f "${ENV_FILE}" ]]; then
  scp ${SSH_OPTS} "${ENV_FILE}" "${SSH_TARGET}:${DEPLOY_PATH}/"
fi
echo "[OK] Upload complete"

echo
echo "[4/4] Running remote deployment..."
ssh ${SSH_OPTS} "${SSH_TARGET}" bash -s -- "${DEPLOY_PATH}" <<'REMOTE_SCRIPT'
set -euo pipefail
DEPLOY_PATH="$1"

cd "${DEPLOY_PATH}"

echo ">>> Preparing compose file..."
if [[ -f docker-compose.prod.yml ]]; then
  mv docker-compose.prod.yml docker-compose.yml
fi

echo ">>> Loading images..."
docker load -i babydaily-images.tar

echo ">>> Stopping old containers..."
docker compose down --remove-orphans 2>/dev/null || true

echo ">>> Starting containers..."
docker compose up -d

echo ">>> Cleaning temporary files..."
rm -f babydaily-images.tar

echo ">>> Service status:"
docker compose ps

echo ">>> Deployment finished"
REMOTE_SCRIPT

echo
echo "========================================"
echo "  Deployment Success"
echo "========================================"
echo "Frontend: http://${DEPLOY_HOST}:8080"
echo "Backend:  http://${DEPLOY_HOST}:3000"
echo

if [[ "${KEEP_IMAGE_TAR}" != "true" ]]; then
  rm -f "${IMAGE_FILE}"
  echo "[Cleanup] Removed local image tar"
fi

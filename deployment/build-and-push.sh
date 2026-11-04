#!/usr/bin/env bash
# Runs on a developer machine: builds both images for the server, tags them, and pushes them to Docker Hub.
# With --deploy it then runs deploy.sh on the server over SSH and shows its status report.
#
# Usage: deployment/build-and-push.sh [version] [--deploy] [--no-backup]
#   version     Defaults to latest.
#   --deploy    After pushing, deploy this version on the server.
#   --no-backup Passed to deploy.sh.
# Server settings (override with environment variables):
#   DEPLOY_SSH=root@161.97.110.121  DEPLOY_KEY=~/.ssh/id_aiscripto  DEPLOY_DIR=/deployments/affliate
set -euo pipefail

cd "$(dirname "$0")/.."

DEPLOY_SSH="${DEPLOY_SSH:-root@161.97.110.121}"
DEPLOY_KEY="${DEPLOY_KEY:-$HOME/.ssh/id_aiscripto}"
DEPLOY_DIR="${DEPLOY_DIR:-/deployments/affliate}"
BACKEND_IMAGE="tariqsulehri/affliate-be"
FRONTEND_IMAGE="tariqsulehri/affliate-fe"

VERSION=""
DEPLOY=0
DEPLOY_ARGS=""
for arg in "$@"; do
  case "$arg" in
    --deploy) DEPLOY=1 ;;
    --no-backup) DEPLOY_ARGS="$DEPLOY_ARGS --no-backup" ;;
    -h|--help) sed -n '2,11p' "$0"; exit 0 ;;
    -*) echo "Unknown option: $arg"; exit 2 ;;
    *) VERSION="$arg" ;;
  esac
done

if [ -z "$VERSION" ]; then
  VERSION="latest"
fi

COMMIT="$(git rev-parse HEAD 2>/dev/null || echo 'unknown')"
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  echo "! The working tree has uncommitted changes; the image will not match commit ${COMMIT:0:7} exactly."
fi

echo "==> Building ${VERSION} (commit ${COMMIT:0:7}) for linux/amd64"
build() { # build <image> <folder>
  docker build --platform linux/amd64 \
    --build-arg "APP_VERSION=${VERSION}" --build-arg "GIT_COMMIT=${COMMIT}" \
    -t "$1:${VERSION}" -t "$1:latest" "$2"
}
build "$BACKEND_IMAGE" backend > /tmp/affliate-build-backend.log 2>&1 &
backend_pid=$!
build "$FRONTEND_IMAGE" frontend > /tmp/affliate-build-frontend.log 2>&1 &
frontend_pid=$!
wait "$backend_pid" || { echo "Backend build failed: /tmp/affliate-build-backend.log"; tail -20 /tmp/affliate-build-backend.log; exit 1; }
wait "$frontend_pid" || { echo "Frontend build failed: /tmp/affliate-build-frontend.log"; tail -20 /tmp/affliate-build-frontend.log; exit 1; }

echo "==> Pushing to Docker Hub"
for image in "$BACKEND_IMAGE" "$FRONTEND_IMAGE"; do
  docker push "$image:latest"
  if [ "$VERSION" != "latest" ]; then
    docker push "$image:${VERSION}"
  fi
done

if [ "$DEPLOY" = 1 ]; then
  echo "==> Deploying ${VERSION} on ${DEPLOY_SSH}"
  # shellcheck disable=SC2086
  ssh -i "$DEPLOY_KEY" -o IdentitiesOnly=yes -o StrictHostKeyChecking=no "$DEPLOY_SSH" "cd '${DEPLOY_DIR}' && ./deploy.sh '${VERSION}' ${DEPLOY_ARGS}"
else
  echo "Done. Deploy on the server with: cd ${DEPLOY_DIR} && ./deploy.sh ${VERSION}"
fi

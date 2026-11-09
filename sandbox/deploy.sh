#!/usr/bin/env bash
# Builds the sandbox image, pushes it, and starts it on the TEST server.
# Usage: sandbox/deploy.sh [tag]
# The server keeps its own .env in $DEPLOY_DIR (created on first deploy with a random password).
set -euo pipefail
cd "$(dirname "$0")"

TAG="${1:-$(date +%Y.%m.%d.%H%M)}"
IMAGE="tariqsulehri/affliate-sandbox"
DEPLOY_SSH="${DEPLOY_SSH:-root@161.97.110.121}"
DEPLOY_KEY="${DEPLOY_KEY:-$HOME/.ssh/id_aiscripto}"
DEPLOY_DIR="${DEPLOY_DIR:-/deployments/affliate-sandbox}"
PUBLIC_HOST="${PUBLIC_HOST:-161.97.110.121}"
SSH=(ssh -i "$DEPLOY_KEY" -o IdentitiesOnly=yes "$DEPLOY_SSH")

echo "==> Building $IMAGE:$TAG (linux/amd64)"
docker build --platform linux/amd64 -t "$IMAGE:$TAG" -t "$IMAGE:latest" . >/tmp/affliate-sandbox-build.log 2>&1 \
  || { tail -20 /tmp/affliate-sandbox-build.log; exit 1; }

echo "==> Pushing"
docker push -q "$IMAGE:$TAG" && docker push -q "$IMAGE:latest"

echo "==> Starting on $DEPLOY_SSH:$DEPLOY_DIR"
"${SSH[@]}" "mkdir -p '$DEPLOY_DIR'"
scp -i "$DEPLOY_KEY" -o IdentitiesOnly=yes -q docker-compose.yml "$DEPLOY_SSH:$DEPLOY_DIR/docker-compose.yml"
"${SSH[@]}" bash -s -- "$DEPLOY_DIR" "$TAG" "$PUBLIC_HOST" <<'REMOTE'
set -euo pipefail
DIR="$1"; TAG="$2"; HOST="$3"
cd "$DIR"
if [ ! -f .env ]; then
  umask 077
  cat > .env <<ENV
PORT=9999
TRACKER_URL=http://$HOST:3085
SANDBOX_PUBLIC_URL=http://$HOST:9999
SANDBOX_PASSWORD=$(head -c 18 /dev/urandom | base64 | tr -d '/+=' | head -c 20)
TRACKER_ADMIN_EMAIL=
TRACKER_ADMIN_PASSWORD=
SANDBOX_OFFER_TOKEN=sbx_$(head -c 9 /dev/urandom | base64 | tr -d '/+=' | head -c 12)
ENV
  echo "Created $DIR/.env (fill in TRACKER_ADMIN_EMAIL / TRACKER_ADMIN_PASSWORD)"
fi
# Remember the deployed version, so any later "docker compose up" restarts this version and not an old "latest"
if grep -q '^SANDBOX_TAG=' .env; then sed -i "s|^SANDBOX_TAG=.*|SANDBOX_TAG=$TAG|" .env; else echo "SANDBOX_TAG=$TAG" >> .env; fi
docker compose pull -q
docker compose up -d
for i in $(seq 1 30); do
  if curl -fsS http://localhost:9999/health >/dev/null 2>&1; then echo "Sandbox $TAG is up on port 9999"; exit 0; fi
  sleep 1
done
echo "Sandbox did not become healthy"; docker compose logs --tail=50; exit 1
REMOTE

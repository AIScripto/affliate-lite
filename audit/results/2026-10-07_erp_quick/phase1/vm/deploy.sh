#!/usr/bin/env bash
set -euo pipefail

# Always run from the directory where the script and docker-compose file live
cd "$(dirname "$0")"

usage() {
  cat <<'EOF'
Easy deploys. Run with sudo.

  sudo ./deploy.sh frontend e6b8221      new frontend only   (no backup)
  sudo ./deploy.sh backend  abc1234      new backend only    (takes a database backup first)
  sudo ./deploy.sh both abc1234 e6b8221  backend then frontend (takes a backup first)
  sudo ./deploy.sh status                show what is running; changes nothing
  sudo ./deploy.sh rollback              go back to the release before the last deploy

A version is the 7 letters from the pipeline (e6b8221) or a release such as v1.2.3.
The side you do not name keeps its current version (from .env).
Options:  --backup  force a backup     --no-backup  skip the backup
A rollback does not undo a database migration made by the release you leave.
EOF
}

fail() { echo "ERROR: $*" >&2; exit 1; }

# ---- options ----
BACKUP_MODE=auto
ARGS=()
for ARG in "$@"; do
  case "$ARG" in
    --backup) BACKUP_MODE=yes ;;
    --no-backup) BACKUP_MODE=no ;;
    -h|--help|help) usage; exit 0 ;;
    -*) fail "Unknown option: $ARG (use --backup or --no-backup)" ;;
    *) ARGS+=("$ARG") ;;
  esac
done
set -- ${ARGS[@]+"${ARGS[@]}"}
[ $# -ge 1 ] || { usage; exit 1; }

# ---- helpers ----
env_tag() { [ -f .env ] && grep -E "^$1=" .env | tail -n 1 | cut -d= -f2- || true; }
# 7 to 40 hex letters = a commit from the pipeline -> production-<first 7>
tag_of() {
  if [[ "$1" =~ ^[0-9a-f]{7,40}$ ]]; then echo "production-${1:0:7}"; else echo "$1"; fi
}
log_field() { echo "$1" | sed -n "s/.*$2=\([^ ]*\).*/\1/p"; }

CUR_BACKEND="$(env_tag BACKEND_TAG)"
CUR_FRONTEND="$(env_tag FRONTEND_TAG)"

show_status() {
  echo "Current versions (.env): backend=${CUR_BACKEND:-unknown} frontend=${CUR_FRONTEND:-unknown}"
  echo "Running now:"
  docker ps --format '  {{.Names}}  {{.Image}}  {{.Status}}'
  if [ -f deploy.log ]; then echo "Last deploys:"; tail -n 3 deploy.log | sed 's/^/  /'; fi
}

# ---- which command ----
CMD="$1"
DEFAULT_BACKUP=yes
case "$CMD" in
  status)
    show_status; exit 0 ;;
  frontend)
    [ $# -eq 2 ] || fail "Usage: ./deploy.sh frontend <version>"
    [ -n "$CUR_BACKEND" ] || fail "No current backend version in .env. Use: ./deploy.sh both <backend> <frontend>"
    BACKEND_TAG="$CUR_BACKEND"; FRONTEND_TAG="$(tag_of "$2")"; SERVICES="frontend"; DEFAULT_BACKUP=no ;;
  backend)
    [ $# -eq 2 ] || fail "Usage: ./deploy.sh backend <version>"
    [ -n "$CUR_FRONTEND" ] || fail "No current frontend version in .env. Use: ./deploy.sh both <backend> <frontend>"
    BACKEND_TAG="$(tag_of "$2")"; FRONTEND_TAG="$CUR_FRONTEND"; SERVICES="api" ;;
  both)
    [ $# -eq 3 ] || fail "Usage: ./deploy.sh both <backend> <frontend>"
    BACKEND_TAG="$(tag_of "$2")"; FRONTEND_TAG="$(tag_of "$3")"; SERVICES="api frontend" ;;
  rollback)
    [ -f deploy.log ] && [ "$(wc -l < deploy.log)" -ge 2 ] || fail "No earlier deploy is recorded in deploy.log."
    PREV="$(tail -n 2 deploy.log | head -n 1)"
    BACKEND_TAG="$(log_field "$PREV" backend)"; FRONTEND_TAG="$(log_field "$PREV" frontend)"
    [ -n "$BACKEND_TAG" ] && [ -n "$FRONTEND_TAG" ] || fail "Could not read the earlier deploy: $PREV"
    SERVICES="api frontend"; DEFAULT_BACKUP=no
    echo "Rolling back to backend=${BACKEND_TAG} frontend=${FRONTEND_TAG}."
    echo "Note: this does not undo a database migration made by the release you are leaving." ;;
  *)
    # Old style still works: ./deploy.sh <backend> <frontend>
    [ $# -le 2 ] || { usage; exit 1; }
    BACKEND_TAG="$(tag_of "$1")"; FRONTEND_TAG="$(tag_of "${2:-$1}")"; SERVICES="api frontend" ;;
esac

for TAG in "$BACKEND_TAG" "$FRONTEND_TAG"; do
  [ -n "$TAG" ] || fail "A version is missing."
  if [ "$TAG" = "latest" ] && [ "${ALLOW_LATEST:-0}" != "1" ]; then
    fail "Refusing the moving tag 'latest'. Give a version such as e6b8221 or v1.2.3."
  fi
done
export BACKEND_TAG FRONTEND_TAG

case "$BACKUP_MODE" in auto) DO_BACKUP="$DEFAULT_BACKUP" ;; *) DO_BACKUP="$BACKUP_MODE" ;; esac

echo "========================================="
echo " backend : ${CUR_BACKEND:-unknown} -> ${BACKEND_TAG}"
echo " frontend: ${CUR_FRONTEND:-unknown} -> ${FRONTEND_TAG}"
echo " deploying: ${SERVICES}     backup: ${DO_BACKUP}"
echo "========================================="

echo "==> [1/6] Pulling images..."
docker compose pull ${SERVICES}

echo "==> [2/6] Database backup..."
BACKUP_SCRIPT="${BACKUP_SCRIPT:-$(pwd)/tkxel-rct-backup-prod.sh}"
if [ "$DO_BACKUP" = "yes" ]; then
  [ -x "$BACKUP_SCRIPT" ] || fail "Backup script not found or not executable: ${BACKUP_SCRIPT} (or use --no-backup)"
  "$BACKUP_SCRIPT" || fail "Backup FAILED. Nothing was migrated and nothing was restarted."
else
  echo "No backup (frontend only, or --no-backup)."
fi

echo "==> [3/6] Database migrations..."
case " ${SERVICES} " in
  *" api "*) docker compose run --rm api npx prisma migrate deploy ;;
  *) echo "Not needed (backend is not changing)." ;;
esac

echo "==> [4/6] Restarting ${SERVICES}..."
docker compose up -d --force-recreate ${SERVICES}

echo "==> [5/6] Waiting for the app to answer..."
wait_for() {
  for _ in $(seq 1 30); do
    if curl -fsS -m 5 "$1" >/dev/null 2>&1; then return 0; fi
    sleep 2
  done
  return 1
}
CHECKS=""
case " ${SERVICES} " in *" api "*) CHECKS="${CHECKS} ${HEALTH_URL:-http://127.0.0.1:4000/ready}" ;; esac
case " ${SERVICES} " in *" frontend "*) CHECKS="${CHECKS} ${FRONTEND_URL:-http://127.0.0.1:3001/health}" ;; esac
for URL in ${CHECKS}; do
  if wait_for "$URL"; then
    echo "OK: ${URL}"
  else
    echo "HEALTH CHECK FAILED: ${URL} did not answer within 60 seconds." >&2
    docker compose ps >&2 || true
    docker compose logs --tail=50 ${SERVICES} >&2 || true
    echo "If a migration ran, the old code may not match the database. Send these lines to the developer." >&2
    exit 1
  fi
done

echo "==> [6/6] Cleaning up unused images..."
docker image prune -f

echo "========================================="
docker compose ps
echo "========================================="
echo " Done: backend=${BACKEND_TAG} frontend=${FRONTEND_TAG} at $(date -u +'%Y-%m-%d %H:%M:%S UTC')"
echo "========================================="

# Record what is running: one line per deploy (rollback reads it), and the tags in .env for plain docker compose commands.
echo "$(date -u +'%Y-%m-%dT%H:%M:%SZ') backend=${BACKEND_TAG} frontend=${FRONTEND_TAG} by=$(whoami)" >> deploy.log
{
  { [ -f .env ] && grep -vE '^(BACKEND_TAG|FRONTEND_TAG)=' .env || true; } > .env.tmp \
    && printf 'BACKEND_TAG=%s\nFRONTEND_TAG=%s\n' "$BACKEND_TAG" "$FRONTEND_TAG" >> .env.tmp \
    && mv .env.tmp .env
} || echo "WARNING: could not update .env (check permissions on this folder)." >&2

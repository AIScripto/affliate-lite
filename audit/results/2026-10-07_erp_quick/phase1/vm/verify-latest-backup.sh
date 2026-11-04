#!/usr/bin/env bash
# Checks the newest production backup in S3, without touching any database:
# downloads it, compares its checksum, and lists what is inside. A backup nobody has ever read back is not proven.
# Run with sudo, like the backup script. Usage:  sudo ./verify-latest-backup.sh
set -euo pipefail
umask 077

S3_BUCKET="tkxel-backup-rct"
S3_PREFIX="postgres/prod"
AWS_PROFILE="postgres-backup-rct"
export AWS_SHARED_CREDENTIALS_FILE="/home/tk-vm-056/.aws/credentials"
export AWS_CONFIG_FILE="/home/tk-vm-056/.aws/config"
# The database has 52 tables with data today. Set EXPECTED_TABLES=<n> if that number changes on purpose.
EXPECTED_TABLES="${EXPECTED_TABLES:-52}"

fail() { echo "BACKUP CHECK FAILED: $*" >&2; exit 1; }
command -v aws >/dev/null 2>&1 || fail "aws is not installed"
command -v pg_restore >/dev/null 2>&1 || fail "pg_restore is not installed"

WORK="$(mktemp -d /tmp/verify-backup.XXXXXX)"
trap 'rm -rf "$WORK"' EXIT

LATEST="$(aws s3 ls "s3://${S3_BUCKET}/${S3_PREFIX}/" --profile "$AWS_PROFILE" | awk '{print $4}' | grep -E '\.dump$' | sort | tail -n 1 || true)"
[ -n "$LATEST" ] || fail "no .dump file found in s3://${S3_BUCKET}/${S3_PREFIX}/"
echo "Newest backup: ${LATEST}"

aws s3 cp "s3://${S3_BUCKET}/${S3_PREFIX}/${LATEST}" "$WORK/$LATEST" --profile "$AWS_PROFILE" --only-show-errors || fail "could not download the backup"
aws s3 cp "s3://${S3_BUCKET}/${S3_PREFIX}/${LATEST}.sha256" "$WORK/$LATEST.sha256" --profile "$AWS_PROFILE" --only-show-errors || fail "could not download the checksum file"

SIZE="$(wc -c < "$WORK/$LATEST" | tr -d ' ')"
[ "$SIZE" -gt 0 ] || fail "the backup file is empty"

# The checksum file also holds the folder the backup was made in, so only the hash itself is compared.
EXPECTED_HASH="$(awk '{print $1}' "$WORK/$LATEST.sha256")"
if command -v sha256sum >/dev/null 2>&1; then ACTUAL_HASH="$(sha256sum "$WORK/$LATEST" | awk '{print $1}')"; else ACTUAL_HASH="$(shasum -a 256 "$WORK/$LATEST" | awk '{print $1}')"; fi
[ "$EXPECTED_HASH" = "$ACTUAL_HASH" ] || fail "checksum does not match (the file is damaged or was changed)"

TABLES="$(pg_restore --list "$WORK/$LATEST" | grep -c 'TABLE DATA' || true)"
[ "$TABLES" -eq "$EXPECTED_TABLES" ] || fail "the backup lists ${TABLES} tables with data, expected ${EXPECTED_TABLES}"

echo "Size: ${SIZE} bytes | checksum matches | ${TABLES} tables with data"
echo "BACKUP OK: ${LATEST} can be read back."

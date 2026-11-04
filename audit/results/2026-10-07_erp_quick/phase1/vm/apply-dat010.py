#!/usr/bin/env python3
"""Reads the backup script, prints the safer version to stdout. Never changes the original file.
Usage: python3 apply-dat010.py tkxel-rct-backup-prod.sh > /tmp/tkxel-rct-backup-prod.sh.new
Stops with an error (and prints nothing) if any expected line is not found exactly once."""
import sys

src = open(sys.argv[1]).read()

def swap(text, old, new, count=1):
    found = text.count(old)
    if found != count:
        sys.exit(f"STOP: expected {count} x {old!r} but found {found}. The file differs from what I expected.")
    return text.replace(old, new)

src = swap(src, 'set -euo pipefail\n',
           'set -euo pipefail\n\n# Backups hold personal data: files are readable by the owner only.\numask 077\n')
src = swap(src, 'BACKUP_DIR="/tmp/postgres-backup-rct"',
           '# A private, one-off folder (mode 700) that is always removed on exit, even when a step fails.\n'
           'BACKUP_DIR="$(mktemp -d /tmp/postgres-backup-rct.XXXXXX)"\n'
           'trap \'rm -rf "$BACKUP_DIR"\' EXIT')
src = swap(src, 'LOG_FILE="${BACKUP_DIR}/backup.log"',
           'LOG_FILE="${HOME}/postgres-backup-rct.log"   # not in the temporary folder, which is removed on exit')
src = swap(src, '  --profile "$AWS_PROFILE" \\\n', '  --profile "$AWS_PROFILE" \\\n  --sse AES256 \\\n', count=2)
sys.stdout.write(src)

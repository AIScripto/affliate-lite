# Phase 1 runbook: VM and script hardening (owner runs every step)

Nothing here was run on the VM. I prepared and tested the patches on a scratch copy with fake `docker`, `curl`, `pg_dump` and `aws`.
These files sit at the workspace root, outside git, so each patch has an undo.

| Order | Audit item | Patch | Restart needed? |
|---|---|---|---|
| 1 | DAT-010 backup scripts | `phase1-4-dat010-backup-scripts.patch` | No |
| 2 | SEC-012 nginx rate limit | `../sec-012-nginx.patch` (already prepared) | No, `nginx -s reload` |
| 3 | OPS-002 release tag required | `../ops-002-workspace.patch` (already prepared) | Next deploy |
| 4 | REL-004 backup + health check in deploy | `phase1-3-rel004-backup-and-health.patch` (needs step 3 first) | No, runs on next deploy |
| 5 | SEC-019 port 4000 on localhost | `phase1-1-sec019-port-4000.patch` | Next deploy recreates the API |

Only steps 3 and 5 change anything the running containers see, and only when you next deploy. Do step 5 *in* that deploy.

## Before you start (5 minutes)
1. Pick a quiet time. Do one step at a time; check, then go on.
2. Copy what you will change: `cp -r docker-compose.yml deployments scripts nginx /somewhere/backup-before-phase1/`
3. Note the baseline: `/ready` answers 200, sign-in works, one report opens.
4. **Port 4000:** nothing should use it from outside. The frontend container reaches the API over Docker's own network (`api:4000`); the VM nginx only uses 3001 and 4999. Check before step 5: `ss -ltnp | grep 4000` and ask whether any monitor or script calls `<vm-ip>:4000`.
5. **Rate limit:** is a cloud load balancer or CDN in front of this nginx? If yes, read the note in `../sec-012-nginx-README.md` first (real-IP module). People in one office share one address, and the limit is 500 requests per minute per address.

## Apply (from the folder that holds `docker-compose.yml`, `deployments/`, `scripts/`, `nginx/`)
Always check first with `--dry-run`. If the VM layout differs, the changes are small enough to make by hand.

```
# 1. DAT-010
patch -p1 --dry-run < phase1-4-dat010-backup-scripts.patch && patch -p1 < phase1-4-dat010-backup-scripts.patch
# 2. SEC-012 (see its README for the exact commands), then on the server:  nginx -t && nginx -s reload
# 3. OPS-002
patch -p1 --dry-run < ops-002-workspace.patch && patch -p1 < ops-002-workspace.patch
# 4. REL-004 (only after 3)
patch -p1 --dry-run < phase1-3-rel004-backup-and-health.patch && patch -p1 < phase1-3-rel004-backup-and-health.patch
# 5. SEC-019 (the change takes effect when the API container is recreated, so do this just before a deploy)
patch -p1 --dry-run < phase1-1-sec019-port-4000.patch && patch -p1 < phase1-1-sec019-port-4000.patch
```
Patch may leave `*.orig` files next to the changed ones. They are harmless; delete them when done.

## What each step does and how to check it
**1. DAT-010.** Backups are written to a private folder (mode 700, files 600) that is always removed, even when the upload fails. Uploads use `--sse AES256`. The log moves to `~/postgres-backup-rct.log`.
- Check: run `./rct-backup-prod.sh` once by hand. It should end with "Backup uploaded successfully", leave nothing in `/tmp/postgres-backup-rct*`, and the object in S3 should show server-side encryption.
- **Restore-test that backup** into a scratch database with `restore-script-prod.sh` or `pg_restore --list`. A backup that was never restored is not proven.
- Not done (your decision, D3): the **retention period**. Set an S3 lifecycle rule on the bucket (for example expire `postgres/prod/` after 30 days). Not done: the **dev restore** (`restore-script-dev.sh`) still loads production data into dev by design. Decide whether to mask the data.

**2. SEC-012.** The API rate limit now counts per real connecting address, not a header the client can fake or omit.
- Check: `nginx -t` says OK, reload, sign in, open a report. Hammer test only if you want: more than 500 requests a minute from one address should get 429.

**3. OPS-002.** `./deploy-prod.sh` and compose need a release tag; `latest` is refused. It writes one line to `deploy.log` per deploy.
- Check: `./deploy-prod.sh` with no tag stops with a message. Anything that ran compose with no tag (cron, a habit) will now stop too: that is intended.

**4. REL-004.** The deploy now runs: pull, **backup (only with `--backup`)**, migrate, recreate, **wait for `/ready` (up to 60 s)**, clean up.
- The backup is **off by default**. Add `--backup` (or `RUN_BACKUP=1`) when a release carries a database migration: `./deploy.sh v1.2.0 v1.1.6 --backup`.
- If the backup fails: stops before touching the database or restarting anything. If `/ready` does not answer: stops with `docker compose ps` and the last 50 API log lines. The database was already migrated by then; fix forward or restore the backup.
- `BACKUP_SCRIPT=/path` sets the backup script (default: `tkxel-rct-backup-prod.sh` next to `deploy.sh`). `HEALTH_URL=...` changes the check address (default `http://127.0.0.1:4000/ready`, which needs `curl` on the VM). The VM backup script needs root, so run the deploy with `sudo`.
- The ready-to-copy files for the VM are in `vm/` (`deploy.sh`, `docker-compose.yml`), named as on the VM.

**5. SEC-019.** The API port is published as `127.0.0.1:4000` only. Users still reach the app through nginx. The REL-004 health check still works because it runs on the VM itself.
- Check, after the deploy: from your laptop `curl http://<vm-ip>:4000/health` must fail (refused or timeout); the app, sign-in and one report still work.
- Not changed: the frontend port (3001) is also published on all interfaces. It sits behind the VM nginx; bind it to `127.0.0.1:3001` too if nobody opens `<vm-ip>:3001` directly.

## If something goes wrong
- Undo any patch with `patch -R -p1 < that.patch` (tested: reverse order restores the original files exactly), or copy back the folder from "Before you start".
- App unreachable after step 5: the only change is the port binding; `patch -R` it and redeploy.
- Deploy stops at the health check: read the printed API log lines first.

## DAT-010: safer backups (owner runs every step; written 2026-10-13)
Decisions: backups are kept **30 days** (change the number in `vm/s3-lifecycle-postgres-prod.json` if you want another); the dev restore script (`restore-script-dev.sh`) is left as it is (option A, owner's choice).

**1. Install the safer backup script** (private temporary folder that is always removed, encrypted upload, log in the home folder). On the VM, in `~/deployments/rct-deployments`:
```
python3 /tmp/apply-dat010.py tkxel-rct-backup-prod.sh > /tmp/tkxel-rct-backup-prod.sh.new
diff tkxel-rct-backup-prod.sh /tmp/tkxel-rct-backup-prod.sh.new          # about 11 changed lines
bash -n /tmp/tkxel-rct-backup-prod.sh.new
sudo cp tkxel-rct-backup-prod.sh tkxel-rct-backup-prod.sh.before-dat010
sudo cp /tmp/tkxel-rct-backup-prod.sh.new tkxel-rct-backup-prod.sh && sudo chmod +x tkxel-rct-backup-prod.sh
```
(`scp vm/apply-dat010.py tk-vm-056@172.26.100.248:/tmp/` first. If it prints `STOP: ...`, your file differs from what it expects: send me that line.)

**2. Run one backup and check it:** `sudo ./tkxel-rct-backup-prod.sh` must end with "Backup uploaded successfully" and leave nothing in `/tmp/postgres-backup-rct*`. Check that S3 encrypted it:
```
aws s3api head-object --bucket tkxel-backup-rct --key postgres/prod/<the new file name> --profile postgres-backup-rct --query ServerSideEncryption
```
It must print `"AES256"`.

**3. Verify that a backup can be read back** (no database is touched): copy `vm/verify-latest-backup.sh` to the VM, then `sudo ./verify-latest-backup.sh`. It downloads the newest backup, compares the checksum, and lists the contents. It must end with `BACKUP OK`. Run it after every backup you care about, and about once a month.

**4. Retention rule (30 days).** First look at what the bucket has: `aws s3api get-bucket-lifecycle-configuration --bucket tkxel-backup-rct --profile postgres-backup-rct`. If it says "NoSuchLifecycleConfiguration", apply the rule:
```
aws s3api put-bucket-lifecycle-configuration --bucket tkxel-backup-rct --profile postgres-backup-rct --lifecycle-configuration file://s3-lifecycle-postgres-prod.json
```
If the bucket already has rules, add this rule to them instead (the command replaces the whole configuration). **This deletes backups older than 30 days automatically**, so keep a copy of any backup you need longer (for example the one taken before a big migration).

**5. Optional tidy-up:** delete the two 0-byte leftovers in `/tmp/postgres-backup-rct` (they hold no data).

## Still open after Phase 1
OPS-005 (registry, D2), the DAT-010 retention and dev-restore decisions (D3), OPS-004 (frontend image runs nginx as root; the unprivileged image listens on 8080, which changes compose and nginx).

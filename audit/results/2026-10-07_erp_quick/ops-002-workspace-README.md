# OPS-002, workspace part: require a release tag when deploying

These files sit at the workspace root, outside both git repositories, so they have no history and
no undo. I did **not** change them. This patch is yours to apply when you are ready.

## What it does
- `docker-compose.yml` and `deployments/docker-compose.prod.yml`: `${BACKEND_TAG:-latest}` becomes a required value
  (`${BACKEND_TAG:?...}`), and the same for the frontend. `docker compose up` with no tag now stops with a clear message.
- `scripts/deploy-prod.sh`: a release tag is required. `latest` is refused unless you set `ALLOW_LATEST=1`.
  After a successful deploy it appends one line to `scripts/deploy.log` (time, backend tag, frontend tag, user).

## Tested (in a scratch copy, with a fake docker)
- No tag: refuses, exit 1. `latest`: refuses, exit 1. `v1.1.0`: deploys, exit 0, log line written.
- `ALLOW_LATEST=1 ... latest`: allowed. `BACKEND_TAG=production-abc1234`: allowed.
- The patch applies cleanly on a fresh copy of today's files.

## Before you apply
1. **Check how you deploy today.** If anything (a cron job, a note, a habit) runs the compose file or the script with
   no tag, it will stop working until a tag is passed. That is the point, but know it first.
2. **Pipelines:** the master build still pushes `:latest`, so the old way keeps working until you apply this.
   Tag builds no longer move `:latest` (changed in the repositories).
3. Make a copy: `cp -r docker-compose.yml deployments scripts /somewhere/backup-before-ops-002/`

## Apply
```
cd /Users/tk-lpt-1088/development/react/erp/ERP
patch -p1 --dry-run < audit/results/2026-10-07_erp_quick/ops-002-workspace.patch   # check first
patch -p1            < audit/results/2026-10-07_erp_quick/ops-002-workspace.patch   # apply
```
To undo: `patch -R -p1 < audit/results/2026-10-07_erp_quick/ops-002-workspace.patch`

## Not covered
`deployments/deploy.sh` (defaults to the `dev` tag, a development helper) and `deployments/docker-compose.dev.yml` are unchanged.

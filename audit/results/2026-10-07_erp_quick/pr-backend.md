**Title:** fix(security): W0 - password hashes, audit log, CEFR scope (SEC-001, SEC-002, SEC-003)

**Branch:** `fix/w0-security-exposure` into `master` · **Audit run:** 2026-10-07_erp_quick, wave W0

## What changed
- **SEC-001:** user rows were read with a full Prisma `include`, so `password_hash` and reset tokens reached API responses. All 22 user relations and 6 user queries in the config service now use a safe `select` (`user-select.ts`).
- **SEC-002:** the audit-log writer strips secret-looking keys before writing (`strip-secrets.ts`). New script `src/scripts/scrub-audit-log-secrets.ts` cleans existing rows: dry run by default, `--apply` to write, non-local hosts need `CONFIRM_SCRUB_HOST`.
- **SEC-003:** `PATCH /comm/assessments/:id/status` now refuses an employee outside the caller's assessment scope (403 `Access denied`). The self-approval check still runs first.

## Proof
- [x] New tests fail before the fix and pass after: a source guard found 22 unsafe user relations on the old code; 3 of 4 CEFR scope tests failed on the old code.
- [x] A test fails if a column is added to `User` without deciding whether it may be sent.
- [x] Type-check, lint (0 problems), full suite: **578 tests** (was 548).
- [x] Coverage not below baseline: lines **66.72%** (was 66.08%). New files at 100%.
- [x] No secrets or personal data in code, tests or commits (gitleaks hook passed on every commit).
- [x] One existing test updated, not weakened: the `listUsers` assertion expected the unsafe `include`.

## Contract changes
- User objects in `/config/users`, department and line-manager assignment lists, and the audit-log list no longer include `password_hash`, `password_reset_token`, `reset_token_expires`, `login_attempts` or `locked_until`. The frontend never read them (searched).
- The CEFR status route can now return 403 for an out-of-scope employee.

## Owner actions (not done by the agent)
- [ ] Run the scrub script on production (dry run, then `--apply` with `CONFIRM_SCRUB_HOST=<host>`).
- [ ] Rotate every user's password: the hashes were readable through the API.
- [ ] `npm version` when merging to `master`.

## Rollback
Revert the merge. No schema or data change; the scrub script is the only thing that writes, and only when you run it.

## Review focus
`config.service.ts` (the 28 replaced reads), `user-select.test.ts` (the guard), and the order of checks in `communication.controller.ts`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

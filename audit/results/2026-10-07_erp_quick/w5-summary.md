# Wave 5 summary: platform hardening (first part, no decisions needed)

Run 2026-10-07_erp_quick · Branches: backend and frontend `fix/w5-hardening` (from `master`, which has W0 to W3).
Status: **done on local branches, waiting for your approval. Nothing pushed, no pull requests, version still 1.1.0.**
Database migrations are **not** part of this wave (W4 is on hold, as you asked).

## Findings

| ID | Result | What changed |
|---|---|---|
| SEC-017 | **Fixed** | Server errors send a generic message plus a request id. Database errors (table, column, constraint names) never reach the client; unique, foreign-key and not-found database errors become 409, 409, 404. The log call had its arguments in the wrong order, so errors and stacks were never written. Now they are, with the request id. |
| SEC-022 | **Fixed** | When the same name comes from two places, route params beat the body, the body beats the query string. A `?employee_id=` can no longer replace the body value an earlier check approved. |
| REL-003 | **Fixed** | One shutdown path: stop accepting, wait up to 20 s for running requests, then disconnect, then exit. The duplicate handler in `database.ts` is gone. New `GET /ready` checks the database (503 if it does not answer); `/health` is unchanged. |
| SEC-018 | **Partly fixed** | OpenAI calls now have a 15 s timeout, `store: false`, an output cap, at most 2 models (was 4), and a limit of 30 AI requests per user per minute. **Not done:** names and employee codes are still sent to OpenAI (see below). |
| OPS-004 | **Partly fixed** | Backend image: official `node:24-bookworm-slim`, no curl-to-bash, runs as user `node`, no curl in the runtime image. **Not done:** frontend image still runs nginx as root (the unprivileged image listens on 8080, which changes the compose files, and those are outside git). |
| SEC-020 | **Partly fixed** | The frontend image now sends CSP (`frame-ancestors`, `object-src`, `base-uri`, `form-action`), Permissions-Policy, nosniff and Referrer-Policy on every location. The full CSP is **report-only** for now. **Not done:** the VM nginx config (workspace file). |
| PRF-002 | **Partly fixed** | The year-on-year report no longer scans every row once per period. **Not done:** caching and pagination of the other reports. |

## Numbers

| | Before (master) | After |
|---|---|---|
| Backend tests | 838 | **873** |
| Frontend tests | 2,363 | **2,372** |
| Type-check, lint, tests (both) | pass | pass |
| Local Sonar pre-check, backend (new lines) | n/a | 0 hits |
| `nginx -t` on the new config, and headers checked live on `/`, `/index.html`, `/assets/`, a static file and `/health` | n/a | pass |

## Proof
- Every fix has tests that failed before it (error handler 7 of 9, validate 2 of 4, shutdown and `/ready`, AI request, AI limit, Dockerfile policy, nginx headers).
- **Not proven:** the new Dockerfile was **not built here** (the Docker daemon is not running on this machine). The staging pipeline's "Build & Push" step is the first real build. Watch it.

## What users will notice
- Nothing, apart from: an unexpected server error now says "Internal server error" and a request id instead of the technical text.
- AI answers fall back to the built-in analysis after 15 seconds instead of hanging. A manager using AI more than 30 times a minute gets "Too many AI requests".

## Things to decide
1. **SEC-018: names to OpenAI.** The AI payload still contains employee names and codes. Replacing them with aliases is possible, but the AI text then names people by alias unless mapped back. Do you want aliases (safer, slightly harder to read), or keep names? Your call; it is also a privacy question for your company.
2. **SEC-021 (reports routes without a permission guard): not changed.** Engineers' own screens call these endpoints, so a blanket `reports.view` guard (which engineers do not hold) would break them. It needs a rule per endpoint. Say if you want it.
3. **D2 (registry) and D3 (backups)** block OPS-005, DAT-010 and REL-004.
4. **Workspace-level files (no git history), still to do as patches:** compose files bind port 4000 on all interfaces (SEC-019), deploy scripts have no backup or health gate (REL-004), backup scripts (DAT-010), VM nginx (SEC-020).
5. **DEP-003** (dev-tool vulnerabilities in jest, vitest, vite) is its own pull request: not started.

## Deploy note
Backend and frontend can ship in either order. After the first backend image build, check that the container starts as user `node` and that `prisma migrate deploy` still runs inside it.

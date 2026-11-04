# ERP fix plan

Source: `report.html` / `findings.json` of run 2026-10-07_erp_quick (backend `227b698`, frontend `45ae7f7`, both on `master`).
This is a **plan only**. No code has been changed. Each wave ends in a checkpoint where you approve before the next one starts.

## How to run it

Use **prompt 10** (Wave 0) and **prompt 11** (later waves) from `audit/PROMPTS.md`. Each wave works on **one branch per repo**, never on `master`, and never pushes without your approval. You bump the version (`npm version`) when you push to `master`.

## The order, in one view

| Wave | Goal | Findings | Rough size | Needs from you first |
|---|---|---|---|---|
| W0 | Stop the exposure | SEC-001, 002, 003, 004 | 2 days | Nothing to start. Owner actions at the end. |
| W1 | Trust the pipeline and the tests | TST-001, OPS-001, 002, 003, DEP-001, 002 | 6 days | Owner: delete or retire the stale `main` branch |
| W2 | Access control and sessions | SEC-005 to 016 | 13 days | **D1** (senior self-approval) |
| W3 | Make scores trustworthy | REL-001, 002, PRF-001, DAT-001 to 004 | 11 days | **D4** (one readiness rule) |
| W4 | Appraisal history | DAT-005 to 009 | 13 days | **D6**, plus approval of a migration plan before any code |
| W5 | Platform hardening | OPS-004, 005, SEC-017 to 022, REL-003, 004, DAT-010, PRF-002, DEP-003 | 18 days | **D2** (registry), **D3** (backups) |
| W6 | UI quality and maintainability | A11-001, 002, UXD-001, 002, CDH-001, 002, PRF-003, TST-002, 003 | 25 days | **D5** (deep links) |

Sizes are rough (S = half a day, M = 2 days, L = 5 days). They add up to about 88 days for one person. W0 to W3 (the part that removes the High findings except history) is about 32 days.

**Why this order:** W0 contains active exposure and one-line fixes. W1 builds the tests and pipeline that every later fix is proven with. W2 changes who can do what, so it needs W1's tests. W3 makes the score update atomic, which W4 (the history migration, the riskiest change) needs first. W5 and W6 have the least exposure and can run in parallel with a second person once W1 is in.

**Do first inside each wave:** the one-hour items first (pipeline edits, one-line scope checks), then the longer work. Start TST-001 early in W1, because it is the longest prerequisite.

## Rules for every wave (from the remediation kit)

- Re-check each finding on today's code before fixing it. If it is already fixed, mark it `not-reproduced`.
- For each fix: write the failing test first, then the fix. Coverage on new code at least 80%. Backend coverage must not fall below 66.08% lines and frontend must not fall below 83.42%.
- In each repo, `npm run type-check`, `npm run lint` and `npm test` must pass. Frontend `npm run build` must pass. Add an entry to `REFACTOR_LOG.md` with a "what was NOT changed" line.
- Backend before frontend when a contract changes, backward compatible for one release.
- Migrations only on a local disposable Postgres (`docker run postgres:16`), run twice, with before/after counts. If `backend/.env` points at production: read only.
- UI changes: check in a real browser (light, dark, midnight; 375 px and 1280 px; keyboard only) and keep a screenshot.
- Never edit existing files in `/documentation`. New files are fine.
- Rotating secrets, scrubbing production data and changing Bitbucket settings are **yours**. Each wave summary lists them.

---

## W0: Stop the exposure (about 2 days)

Branches: backend `fix/w0-security-exposure`, frontend `fix/w0-demo-accounts`.

### SEC-001: password hashes in API responses (backend, S)
What I found in the code: `config.service.ts` reads the `User` model with a full `include` in about 13 places (nested `user:` or `manager_user:` at lines 493, 513, 535, 558, 578, 606, 775, 832, and the four user operations at 1024, 1042, 1078, 1086). Prisma returns every column, including `password_hash`. Prisma is 5.22.0, whose `omit` option is still a preview feature, so I do not recommend relying on it.
Steps:
1. Add `src/modules/config/user-select.ts` with one `SAFE_USER_SELECT` (the non-secret columns, listed from `schema.prisma` lines 384 to 401) and a helper for the nested form `{ select: SAFE_USER_SELECT, ... employee, role_ref }`.
2. Replace every `include: { employee: true, role_ref: true }` on a `User` (and the nested `user:`, `manager_user:`, `actor_user:`, `target_user:`) with the safe select. Authentication (`auth.service.ts`) keeps reading `password_hash`; it is the only place that should.
3. Add a lint-style test that fails if a new `include` of a user relation appears in the config module without the helper.
Tests (fail before, pass after): for `GET /config/users`, create/update user, line-manager and department assignment endpoints, and the audit-log list: the serialised response contains no `password_hash`, no `password_reset_token`, no `reset_token_expires` and no `$2` bcrypt prefix.
Contract change: the user objects lose their secret fields. The frontend does not use them, but I will search the frontend for `password_hash` first.

### SEC-002: hashes saved in `access_audit_logs` (backend, S)
Cause: the audit writer (`createAccessAuditLog`, line 454) stores whatever object it is given, and 8 callers pass full rows that include the user relation (lines 378, 441, 518, 540, 563, 611, 728, 789, 837).
Steps:
1. Add `stripSecrets()` (deep removal of `password_hash`, `password_reset_token`, `reset_token_expires`, `login_attempts` and any key matching `*_hash`/`*token*`) and call it inside `createAccessAuditLog` for both `old_value` and `new_value`. This is the safety net, so a future caller cannot leak.
2. Fix the callers to pass the safe select from SEC-001.
3. Write `src/scripts/scrub-audit-log-secrets.ts` that removes those keys from existing rows. **Test it on local data only.**
Tests: unit test for `stripSecrets` (nested, arrays); test that a user create writes an audit row with no secret keys.
**Owner actions (you):** run the scrub script against production, rotate every user's password, because the hashes were exposed. I will not run either.

### SEC-003: CEFR status route has no scope check (backend, S)
What I found: every other CEFR handler calls the local `canAccessEmployee(req, id)` helper (lines 60, 108, 145, 169, 199). `updateAssessmentStatus` (line 216) loads the target for the self-approval check and then goes straight to the service. The router (line 76) only requires a manager role.
Steps: after `getAssessmentById`, add `if (!(await canAccessEmployee(req, target.employee_id))) return 403`, before the self-approval test. Keep the existing 400 behaviour for other errors.
Tests: a manager outside the employee's scope gets 403; a manager inside scope gets 200; ADMIN gets 200; the self-approval path still returns `SELF_APPROVAL_PROHIBITED`.

### SEC-004: demo logins in the production bundle (frontend, S)
What I found: `LoginPage.tsx` shows the demo list only when `!isProduction || VITE_SHOW_DEMO_ACCOUNTS === 'true'`, but `DemoAccounts` is imported statically, so the strings stay in the bundle (the built `dist` contains both the list and the shared test password).
Steps: load `DemoAccounts` with `React.lazy(() => import(...))` only under `import.meta.env.DEV`. Vite replaces that with `false` in production builds, so the chunk is not emitted. Drop the `VITE_SHOW_DEMO_ACCOUNTS` override.
Tests: a Vitest test for the login page in production mode, plus a build check (`npm run build`, then `grep` the output for `DEMO ACCOUNTS` and the test password string; zero hits). Add that check as an npm script so CI can run it in W1.
**Owner action (you):** check whether those five logins exist in production, and change their passwords if so (decision D0).

### W0 exit criteria
- No API response or new audit-log row contains a password hash (tests prove it).
- A manager cannot change a CEFR result outside their scope (test).
- The production build has no demo list (build check).
- You have scrubbed old audit rows, rotated passwords, and checked the demo logins.

---

## W1: Trust the pipeline and the tests (about 6 days)

Branches: backend `fix/w1-pipeline-tests`, frontend `fix/w1-pipeline-tests`.

| Finding | What to do | Proof |
|---|---|---|
| OPS-001 (S) | Remove the `main` branch pipelines from both `bitbucket-pipelines.yml` (they sit next to `master`, `staging` and `dev`). **Owner:** retire or protect the stale `main` branch and set the default branch in Bitbucket. | Push to `main` on a test branch name does not trigger an image build (read the YAML; no live push needed). |
| OPS-002 (S) | Compose files stop defaulting to `latest`: require an explicit tag. Pipelines tag images with the commit hash. Remove the second trigger path the finding names. | `docker compose config` fails without a tag. |
| OPS-003 (M) | Pin the gitleaks and sonar-scanner images to versions. Add a step that runs `npm audit --omit=dev --audit-level=high` and a `trivy fs` scan, failing on high or critical, with a small allow-list file for accepted items. | The step fails on a deliberately bad test lockfile in a throwaway branch. |
| DEP-001 (S, medium risk) | Backend: update the express chain, `proxy-addr` 2.0.8, `fast-uri` 3.1.7, `js-yaml` 4.3.2, `brace-expansion` within allowed ranges. Run the full suite. | `npm audit --omit=dev`: no high or critical. |
| DEP-002 (S, medium risk) | Frontend: `axios` 1.20.0 or later, patched `react-router-dom`. Run the suite and the e2e smoke. Plan the Tailwind upgrade separately. | `npm audit --omit=dev`: no high on axios or router. |
| TST-001 (M) | Add `supertest` tests that start the real app wiring (`createApp`). (a) A route-guard test that walks every router and fails if a route lacks `authenticate`, or lacks a role or permission guard, with a short allow-list (login, refresh, the public behavioral config, and the reports routes until SEC-021 is done). (b) A role by route matrix for the sensitive endpoints: ENGINEER, LINE_MANAGER, MANAGER, TOP_MANAGEMENT, ADMIN. Start with the data layer mocked, so it is fast. | The suite fails if a guard is removed (prove by deleting one in a scratch run). |

Decision to make during W1 (not blocking): add a real PostgreSQL service to the backend pipeline so the matrix can later run against a real database. I recommend yes before W4.

### W1 exit criteria
- Only `master` publishes production images; images are pinned by version or hash.
- The route-guard test and the role matrix run in CI.
- The pipeline runs a dependency scan; backend `npm audit --omit=dev` shows no high or critical.

---

## W2 to W6: generated from the report

Each row lists the finding, what to change (first part of the report's fix text), the proof test, the first code location, size and what it waits for. W2 to W6 are planned at this level now. I will write the detailed steps (like W0 and W1 above) when each wave starts, because they depend on how W0 and W1 land.


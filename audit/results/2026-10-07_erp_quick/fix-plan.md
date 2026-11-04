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

### W2: Access control and sessions (about 13.5 dev-days)

Close the remaining approval, session and audit-trail gaps.

**Why here:** These changes alter who can do what, so they follow the role tests from W1.

**Decisions needed before this wave:** D1 (Who approves the self-assessments of ADMIN and TOP_MANAGEMENT users?)

| Order | ID | Change | Proof | First location | Size / risk | Waits for |
|---|---|---|---|---|---|---|
| 11 | SEC-005 An engineer can alter an already approved skill through the create rou **(High)** | In the upsert update branch, when isEngineer force status to draft whenever any of type/projects/level changes (or refuse the create when a row exists and is approved/pending). Do not overwrite assessed_by on approved rows. | Service test: existing approved row, engineer POST with different projects -> resulting status is draft (or 409) and score not counted until approved. | `backend/src/modules/assessment/assessment.service.ts:222` | S / medium | TST-001 |
| 12 | SEC-008 Logging out in the app does not revoke the refresh token | Call POST /auth/logout (await, ignore failure) before clearing state; let the backend logout revoke by the presented refresh cookie without requiring a valid access token (look the token up by hash), and clear the cookie with the same options used to set it. | Frontend test: click Logout -> apiClient.post('/auth/logout') is called. Backend test: logout with expired access token and valid cookie revokes the r… | `frontend/src/pages/DashboardPage.tsx:153` | S / low | nothing |
| 13 | SEC-009 Changing or resetting a password does not end existing sessions; refre | Revoke all the user's refresh tokens in the same transaction as any password change (self and admin); rotate the refresh token on every refresh (new cookie, revoke old) and treat reuse of a revoked token as theft (revoke all). | After changePassword, a previously issued refresh cookie gets 401 on /auth/refresh. After one refresh, the old cookie gets 401. | `backend/src/modules/auth/auth.service.ts:246` | M / medium | nothing |
| 14 | SEC-010 Bearer tokens and the refresh cookie are written to request logs | Add `redact: ['req.headers.authorization','req.headers.cookie','res.headers["set-cookie"]']` to the pino config (and to pinoHttp), or a custom req serializer that keeps only method, url and id. | Unit test: log a request with Authorization and Cookie headers through the configured logger to a stream and assert the output contains neither value. | `backend/src/app.ts:26` | S / low | nothing |
| 15 | SEC-011 No `trust proxy` setting, so the login rate limit sees only the proxy  | app.set('trust proxy', 1) (one nginx hop) and upgrade express / proxy-addr; keep nginx limit_req as the first layer; add a limiter to /auth/refresh and /auth/change-password. | Supertest with X-Forwarded-For: two different client IPs get separate buckets; 11th request from the same IP gets 429, other IP still 200. | `backend/src/app.ts:20` | S / low | DEP-001 |
| 16 | SEC-012 nginx API rate limit is keyed on a client-supplied header | Use `$binary_remote_addr` (or the real-IP module result) as the key for api_limit. | Send 600 requests/min with no XFF and with random XFF from one source; expect 503/429 after the burst in both cases. | `nginx/nginx.conf:42` | S / low | nothing |
| 17 | SEC-013 Account lockout can be triggered by anyone, and it re-locks after one  | Reset login_attempts when a lock has expired; count failures per (username, IP) or use progressive delay instead of a hard lock; keep the generic message. | Five failures -> locked; advance time 16 min; one wrong try -> 401 INVALID_CREDENTIALS, not locked; fifth consecutive wrong try -> locked. | `backend/src/modules/auth/auth.service.ts:96` | S / low | nothing |
| 18 | SEC-016 User, role-change and password operations are not written to the audit | Audit CREATE_USER, UPDATE_USER (field names changed, never values of secrets), DEACTIVATE_USER with actor id; refuse removing the last active ADMIN. | Updating a user's role inserts an access_audit_logs row with actor, target, old and new role and no password fields. | `backend/src/modules/config/config.service.ts:1020` | S / low | nothing |
| 19 | SEC-006 ADMIN and TOP_MANAGEMENT can approve their own skills and CEFR results | Create one `isOwnRecord(req, employeeId)` helper with no role filter and use it in all three controllers for create, update and approve. Decide what ADMIN/TOP_MANAGEMENT self-assessment should do (draft, approved by another admin, or blocked). | For each of ADMIN, TOP_MANAGEMENT, MANAGER, LINE_MANAGER: approve own skill, own CEFR status, create own behavioral -> 403 or draft/pending; plus a ma… | `backend/src/modules/assessment/assessment.controller.ts:18` | M / medium | TST-001 **D1** |
| 20 | SEC-007 Peer managers can approve each other's skills; the 'own Line Manager a | On approve, when the subject's own role is MANAGER or LINE_MANAGER, require an active employee_line_manager_assignment (can_assess) from the approver to that subject; add a test that mutual approval is rejected. | MANAGER A approves a pending skill of MANAGER B in the same department with no line-manager assignment -> 403; with A as B's assigned Line Manager -> … | `backend/src/modules/access/access-scope.service.ts:163` | M / medium | TST-001 |
| 21 | SEC-014 Behavioral assessments are written with no period window, no approval  | Reject unknown subjects with 404 before the scope check; add assertActiveSubmissionWindow and a period id; resolve subjects by emp_code only (accept internal ids nowhere on public input). | POST with unknown subjectId -> 404; POST while no OPEN period -> 403; numeric emp_code that equals another employee's internal id resolves to the emp_… | `backend/src/modules/behavioral/behavioral.service.ts:109` | M / medium | TST-001 |
| 22 | SEC-015 Skill assessments can be deleted with no status, period or audit check | Block delete of approved/pending rows for ENGINEER and own-record managers; call assertActiveSubmissionWindow; write an audit row (actor, assessment snapshot); consider soft delete. | Engineer DELETE of an approved row -> 403; manager DELETE inside window writes an audit entry. | `backend/src/modules/assessment/assessment.router.ts:52` | M / medium | TST-001 |

**Exit criteria:**
- An approved skill cannot change without re-approval (test).
- Logout and password change end refresh tokens (test).
- User, role and password changes appear in the audit log.
- Self-approval policy for senior roles is decided (D1) and enforced.

### W3: Make scores trustworthy (about 11 dev-days)

Make the assessment write atomic and remove invented or duplicated numbers.

**Why here:** Atomicity must exist before the history change (W4). The data-truth fixes are small and visible.

**Decisions needed before this wave:** D4 (Which rule defines "ready" on screen?)

| Order | ID | Change | Proof | First location | Size / risk | Waits for |
|---|---|---|---|---|---|---|
| 23 | REL-001 Assessment write and score recompute are not one transaction, and reco **(High)** | Run the assessment write and the affected-competency recompute inside one db.$transaction (pass the tx client to createScoreRecalculationService); stop swallowing errors on the request path (fail the request, or record a 'scores_stale' flag and retry). | Unit test with a recompute that throws: assert the assessment row is rolled back (or request returns 5xx), never 200 with stale score. | `backend/src/modules/assessment/assessment.service.ts:20-24` | M / medium | nothing |
| 24 | DAT-001 AI Insights KPI bars draw invented widths: 'Ready People' fills 3% for | Give each KPI an explicit `fillPct: number \| null` (readinessPct, avg achieved/required, null for counts) and render no bar when null; remove the `\|\| 18`. | Unit test: ready 3/12 draws 25%; zero critical gaps draws no filled bar; missing value draws no bar. | `frontend/src/components/dashboard/tabs/AIInsightsTab.tsx:984` | S / low | nothing |
| 25 | DAT-002 Executive summary shows 0 where there is no data, and a third copy of  | Return null (and an assessed count) when the denominator is 0; make YoY read the same per-competency scoring function with scoredStatuses; add one roundHalfUp(value, decimals) helper in scoring and use it for every report figure. | Test: dept with no behavioural data returns null, not 0; YoY current-period score equals promotion-readiness overall for same employee; roundHalfUp(1.… | `backend/src/modules/reports/reports.service.ts:773-795` | M / low | nothing |
| 26 | DAT-003 Readiness is decided in the frontend in several places, with different | Have the backend send one `ready_all_checks` and `near_ready` field per person and make every screen read them; delete meetsAllChecks/isNearReady/cefrState fallback logic from the client; route all rounding through roundHalfUp (add a lint rule against Math.rou… | Contract test: for one fixture of people, every screen's ready count equals the backend field count; lint rule fails on Math.round. | `frontend/src/lib/reportGroups.ts:104` | M / medium | DAT-002 **D4** |
| 27 | PRF-001 Each assessment save recomputes every competency for the person, one b | Recompute only the competency touched by the write (recomputeOneCompetency already exists); fetch technologies and assessments for all competencies in two queries and compute in memory; skip upsert when unchanged. | Test with a prisma spy: saving one assessment for a person with 20 competencies issues a constant number of queries (< 6), independent of competency c… | `backend/src/scoring/score-recalculation.service.ts:161-205` | M / low | REL-001 |
| 28 | REL-002 Two simultaneous saves for one person can overwrite each other's score | Do write + recompute in one transaction with SELECT ... FOR UPDATE on the employee row (or pg_advisory_xact_lock(employee_id)). | Concurrency test: fire two approve calls via Promise.all against a test DB; assert the final competency score equals the sum of both. | `backend/src/scoring/score-recalculation.service.ts:96-142` | M / medium | REL-001 |
| 29 | DAT-004 A database number is shown on screen in the manager picker in Setup >  | Use user.employee?.emp_code in the label and type the helper as ConfigUser. | Unit test: manager option label starts with the emp_code, not the numeric id. | `frontend/src/components/config/organization/EmployeesSection.tsx:308` | S / low | nothing |

**Exit criteria:**
- Assessment write and score recompute succeed or fail together (test).
- No screen shows an invented width or a recomputed readiness rule.
- Absent data shows as absent, never as zero.

### W4: Appraisal history (about 13 dev-days)

Keep results per period and make locked periods and scoring config truly immutable.

**Why here:** Highest fix risk and a data migration: it goes after tests and the atomic write, and starts with a plan you approve.

**Decisions needed before this wave:** D6 (For appraisal history: should a new period start with a copy of the last period's assessments, and how many periods are kept?)

**Starts with a checkpoint:** before any code, I show you the migration plan: new uniqueness keys, how existing rows get a period, what happens to rows with no period, copy-forward rules, the lock trigger, rollback, and how I prove nothing was lost (row counts and per-employee score checksums before and after). It is built and tested on a local database seeded with fake data spanning at least two periods.

| Order | ID | Change | Proof | First location | Size / risk | Waits for |
|---|---|---|---|---|---|---|
| 30 | DAT-005 Appraisal history is not real: assessments are one row per person per  **(High)** | Make period part of the key: unique (employee_id, technology_id, appraisal_period_id) and add appraisal_period_id to competency_scores/domain_scores (or snapshot scores at period lock). | Integration test: assess skill in period A, open period B, re-assess; assert two rows exist and the YoY report shows both values. | `backend/prisma/schema.prisma:554-593` | L / high | REL-001, TST-001 **D6** |
| 31 | DAT-008 Deleting config rows cascades or nulls history with no guard | Replace with is_active=false (fields already exist) and block hard delete when child rows exist; change assessment FK to Restrict. | Test: DELETE a technology with assessments returns 409 and rows remain. | `backend/src/modules/config/config.service.ts:1520-1522` | S / low | nothing |
| 32 | DAT-006 A LOCKED period is only locked in application code; it can be reopened | Refuse delete when assessments exist; add a state-machine guard (LOCKED/ARCHIVED cannot go back); add a Postgres trigger rejecting INSERT/UPDATE on skill_assessments (and comm/behav assessments) whose period is LOCKED/ARCHIVED; partial unique index on appraisa… | Test: PATCH a LOCKED period to OPEN is 409; DELETE a period that has assessments is 409; raw UPDATE of an assessment in a LOCKED period is rejected by… | `backend/src/modules/config/period-validation.service.ts:23-75` | M / medium | DAT-005 |
| 33 | DAT-007 Changing scoring weights, targets or levels silently changes old resul | Snapshot the scoring config (weights, thresholds, CEFR policy) into the period at open/lock (a scoring_config_snapshot JSON or versioned tables) and have reports read the period's snapshot; after a config edit, either block it while a period is OPEN or trigger… | Test: lock a period, change a type weight, fetch the period report; values equal pre-change values. | `backend/prisma/schema.prisma:62-75` | L / medium | DAT-005 |
| 34 | DAT-009 Destructive and non-repeatable migration statements without safeguards | Prefer expand/contract (add column, copy, drop in a later release) and take a backup/snapshot gate before destructive migrations; avoid reusing old table names. | Staging rehearsal: apply migrations to a restored copy and compare row counts before/after. | `backend/prisma/migrations/20260909000000_industry_description_instead_of_external_ref/migration.sql:5` | S / low | nothing |

**Exit criteria:**
- Re-assessing in period 2 leaves period 1 untouched (test).
- A locked period cannot be changed even by direct database writes.
- Editing weights does not change a locked period's results (test).
- Migration proven on a local disposable database with before/after counts.

### W5: Platform hardening (about 18.5 dev-days)

Harden containers, headers, backups, errors and the AI integration.

**Why here:** Real but not urgent; can be done in parallel by a second person once W1 is in.

**Decisions needed before this wave:** D2 (Which registry replaces the personal Docker Hub namespace for production images?); D3 (How should database backups be stored, encrypted and retained?)

| Order | ID | Change | Proof | First location | Size / risk | Waits for |
|---|---|---|---|---|---|---|
| 35 | REL-004 Deploy scripts run database migrations on production with no backup st | Call the backup script and confirm the upload before migrate deploy; after up -d poll /health and fail loudly; document expand/contract migration rules. | Dry run on staging: script aborts when backup fails; script prints health OK after deploy. | `scripts/deploy-prod.sh:28` | S / low | nothing |
| 36 | SEC-017 Server errors return raw messages (including database errors) to clien | For statusCode>=500 or non-ApiError, return a generic message plus request id; map known Prisma codes (P2002 to 409, P2025 to 404, P2003 to 409); log with logger.error({ err: error, reqId: req.id, path }, 'Server error'). | Test: throw a PrismaClientKnownRequestError in a route; response body has no table/column text and the logger spy receives an err object. | `backend/src/middleware/errorHandler.ts:15-37` | S / low | nothing |
| 37 | SEC-019 Production API port 4000 is published on the host, bypassing nginx TLS | Bind to loopback (`127.0.0.1:4000:4000`, `127.0.0.1:3001:80`) since the VM nginx proxies to 127.0.0.1 (deployments/vm-nginx.conf:7,20). | From another host, `curl http://<server>:4000/health` is refused; the site still works through nginx. | `deployments/docker-compose.prod.yml:13` | S / low | nothing |
| 38 | DAT-010 Backup scripts leave database dumps in world-readable /tmp, have no re | Use `umask 077` and mktemp -d with a `trap` cleanup, add --sse AES256 (or KMS), add an S3 lifecycle rule plus a documented retention, run a monthly automated restore test, and mask or anonymise data before restoring to dev. | Kill the script mid-upload: no dump remains in /tmp; ls -l shows 600 permissions; restore test job passes monthly. | `scripts/backup.sh:34` | M / low | nothing **D3** |
| 39 | OPS-004 Both production images run as root and install Node with a curl-to-bas | Use node:24-bookworm-slim (or node:24-alpine) pinned by digest, drop the NodeSource step, add `USER node` in the runner stage, use nginxinc/nginx-unprivileged for the frontend, and add read_only/cap_drop/no-new-privileges and memory limits in compose. | docker run --rm image id -u returns non-zero; trivy config reports no DS-0002; CI image build still passes healthcheck. | `backend/Dockerfile:4` | M / medium | nothing |
| 40 | OPS-005 Images are published under a personal Docker Hub account (tariqsulehri | Create an organisation registry namespace (Docker Hub org, ECR or Bitbucket) and make the namespace a single variable used by compose and pipelines; use an org-owned service token. | grep for the personal namespace returns 0; a fresh deploy pulls from the org registry. | `docker-compose.yml:5` | M / medium | nothing **D2** |
| 41 | PRF-002 Report endpoints compute everything on every read with no pagination o | Cache reference data (competencies, weights) with short TTL; add server-side pagination or limit/offset for per-person lists; push groupings to SQL; replace the some() scan with a Set of period ids. | Load test with 2,000 employees: p95 of /reports/promotion-readiness under target and response size bounded. | `backend/src/modules/reports/reports.service.ts:905-1012` | M / low | nothing |
| 42 | SEC-018 AI calls send named employee data to OpenAI with no timeout, no cost c | Replace names/emp_codes with per-request aliases (map back server-side) or drop them; set store:false, max_output_tokens, AbortSignal.timeout(15000); cache dashboard per user+focus for several minutes; add express-rate-limit on /ai/*; cap model fallback to 1 r… | Test: payload passed to fetch contains no full_name/emp_code; fetch mock that never resolves leads to fallback within the timeout. | `backend/src/modules/ai/ai.service.ts:317-342` | M / low | nothing |
| 43 | SEC-020 No Content-Security-Policy anywhere; the VM nginx config has no TLS, n | Add security headers (CSP `default-src 'self'` with the needed img/style rules, Permissions-Policy, frame-ancestors) to frontend/nginx.conf so they ship with the image regardless of the front proxy; keep a single documented proxy config and add TLS/redirect an… | curl -I https://careeros.tkxel-team.com shows CSP, HSTS and nosniff; CSP report-only run shows no violations in the e2e flow. | `nginx/nginx.conf:89` | M / medium | nothing |
| 44 | REL-003 Shutdown exits before in-flight requests finish, and signals are handl | Single shutdown handler: stop accepting, await server.close with a 10-30s timeout, then disconnect; remove handlers from database.ts. Add /ready doing SELECT 1. | Test: start server, begin a slow request, send SIGTERM; request completes before exit. /ready returns 503 when DB is down. | `backend/src/server.ts:21-36` | S / low | nothing |
| 45 | SEC-021 All nine reports routes and one improvement-plan route have no role or | Replace requireReportsAccess with requirePermission('reports.view') (and role/self for gap-analysis); add requireRole to improvement-plan GET; require authenticate on /behav/config or document it as public. | Authorization matrix test: a role without reports.view gets 403 on every /reports route. | `backend/src/modules/reports/reports.router.ts:8` | S / medium | nothing |
| 46 | DEP-003 Development tools have known vulnerabilities (jest chain, vitest, tail | Update jest, vitest and vite to the versions npm audit suggests, in a separate pull request, and run both suites. | npm audit (all dependencies) shows no critical; both suites pass. | `backend/package.json:11` | M / medium | nothing |
| 47 | SEC-022 validate() merges query string over route params and body, enabling pa | Validate body, params and query as separate schemas (z.object({body, params, query})); never merge; move the ENGINEER ownership check after validation or into the controller. Also: Validate with Zod: page >=1, limit 1..100 with defaults; reject NaN with 400. | PATCH with body {level:'Beginner'} and ?level=Expert: validated level is the body value (or request is rejected). | `backend/src/middleware/validate.ts:13` | M / medium | nothing |

**Exit criteria:**
- Both images run as non-root on pinned bases.
- CSP and security headers are in place; port 4000 is not public.
- Backups are protected and have retention.
- Errors returned to clients carry no internal detail.

### W6: UI quality and maintainability (about 25.5 dev-days)

Fix dialog accessibility, help coverage, routing and the largest files.

**Why here:** Lowest exposure. The routing decision (D5) may change the scope, so it comes last.

**Decisions needed before this wave:** D5 (Should the app get real URLs per screen (deep links, Back button)?)

| Order | ID | Change | Proof | First location | Size / risk | Waits for |
|---|---|---|---|---|---|---|
| 48 | A11-001 Confirm dialog executes on any Enter key press and has no dialog role  | Remove the global Enter handler; render role="alertdialog" aria-modal aria-labelledby, autofocus the safe button (Cancel for danger), and trap Tab inside. | RTL test: focus Cancel, press Enter, onConfirm not called; role alertdialog queried by name. | `frontend/src/components/ui/ConfirmDialog.tsx:43` | S / low | nothing |
| 49 | A11-002 Modals and side panels do not move, trap or restore keyboard focus, an | Rebuild Modal/SidePanel on a focus-trap (e.g. focus-trap-react or Radix Dialog), move all hand-built overlays onto it, restore focus to the trigger on close, and add htmlFor/id pairs or wrap inputs in labels (lint rule jsx-a11y/label-has-associated-control). | RTL: open dialog, Tab cycles inside, close returns focus to the trigger; axe check in e2e finds no unlabeled form control. | `frontend/src/components/ui/Modal.tsx:41` | M / medium | nothing |
| 50 | CDH-001 Five files hold about 6,800 lines of tangled logic | Split into per-feature modules (users, access, taxonomy, periods, industries) and validate :id params with a shared zod int schema. | Existing config tests pass unchanged after split; DELETE /config/users/abc returns 400. | `backend/src/modules/config/config.service.ts:1` | L / medium | nothing |
| 51 | UXD-002 The whole app is one URL: only 3 routes, tab and screen state live in  | Introduce nested routes (/dashboard/:tab, /setup/:section, /reports/:id, /people/:empCode) driven by react-router, keep guards on each, and return to the requested URL after login. | e2e: open /dashboard/reports/gap-analysis directly after login lands there; Back returns to the previous tab. | `frontend/src/routes.tsx:6` | L / medium | nothing **D5** |
| 52 | CDH-002 Hard-coded colours are widespread: 197 hex literals, 76 rgb literals a | Move colours in types/*.ts and designSystem.ts to semantic token classes, route chart literals through one theme file, and add an eslint/CI check that lists new raw colours (allowlist the theme files and pdfGenerator). | CI audit count of raw colours outside the allowlist trends to 0. | `frontend/src/hooks/useChartTheme.ts:1` | M / low | nothing |
| 53 | PRF-003 No code splitting: one 931 KB main script plus a 437 KB chart chunk ar | Wrap Reports, Setup, AI Insights and Bulk Assessment in React.lazy with Suspense, put recharts in its own lazy chunk, remove tailwindcss from manualChunks and the unused d3 dependency. | vite build output shows main chunk under 400 KB; Lighthouse JS transfer for /login drops accordingly. | `frontend/vite.config.ts:54` | M / low | nothing |
| 54 | TST-002 Several important backend files are poorly covered (overall 66% lines, | Add tests for communication.service, reports.controller and report-data.service first (they feed promotion readiness), then ai.service fallback path. | Per-file coverage >= 80% for those five files in the next lcov. | `backend/src/modules/communication/communication.service.ts:1` | M / low | nothing |
| 55 | UXD-001 Help modals are missing on all 6 dashboard tabs, all 42 Setup screens  | Add a *Help.ts per dashboard tab and Setup section and render HelpButton in the shared tile/section header; add a CI check that every tab file imports HelpButton. | Unit test or script listing tab components without HelpButton returns empty. | `frontend/src/components/dashboard/tabs/OverviewTab.tsx:1` | M / low | nothing |
| 56 | TST-003 Frontend end-to-end tests only prove screens render against a mocked A | Add 3 contract-style flows against a seeded test backend in CI: engineer saves a skill, line manager approves, report shows the result; plus one 403 check per restricted tab. | The new flows in CI on every master push. | `frontend/e2e/harness.ts:52` | L / low | nothing |

**Exit criteria:**
- Confirm dialog ignores stray Enter; focus is trapped and restored.
- Every screen has its Help button.
- Initial JavaScript is split.

## Decisions you need to make

| ID | Question | Recommended | Needed by |
|---|---|---|---|
| D0 | Do the five demo logins (one per role, including an Admin; see DemoAccounts.tsx lines 7 to 11) exist in production with the shared test password? Only you can check. | Check production now; remove the list from production builds either way. | W0 |
| D1 | Who approves the self-assessments of ADMIN and TOP_MANAGEMENT users? | Four-eyes: another admin or top manager approves. | W2 |
| D2 | Which registry replaces the personal Docker Hub namespace for production images? | A company-owned registry that your CI already authenticates to. | W5 |
| D3 | How should database backups be stored, encrypted and retained? | Encrypted, off-host, with a tested restore and a stated retention period. | W5 |
| D4 | Which rule defines "ready" on screen? | The backend field, as your metric rules already say. | W3 |
| D5 | Should the app get real URLs per screen (deep links, Back button)? | Yes, in a later wave; it also simplifies access checks. | W6 |
| D6 | For appraisal history: should a new period start with a copy of the last period's assessments, and how many periods are kept? | Copy forward and keep all periods; show the migration plan first. | W4 |

## Things only you can do

- **W0:** run the audit-log scrub script on production; rotate all passwords; check and change the demo logins in production.
- **W1:** retire or protect the stale `main` branch; set the default branch in Bitbucket; decide on a Postgres service in the pipeline.
- **W2:** decide D1.
- **W4:** approve the migration plan; run the migrations on production yourself.
- **W5:** choose the registry (D2) and backup policy (D3); create the registry and set pipeline variables.
- **Always:** pushing, pull requests, merging to `master` and the version bump.

## How I would check we are done

After W3, run **prompt 9 (re-audit)** with this run as the previous run. Success looks like: no High findings left except history (W4); the role matrix test in CI; no hashes anywhere. After W4, run it again: the goal is no High and no data-integrity Medium.

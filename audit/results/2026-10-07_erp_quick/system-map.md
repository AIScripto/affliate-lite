# System Map: ERP (erp)

Run: 2026-10-07_erp_quick · Mode AUDIT-ONLY · Depth quick · Kit 0.1.0 · Status: **awaiting Checkpoint A**

## 1. Repos and commits

| Repo | Branch checked out | Commit | Tree | Commits / authors | Tracked files |
|---|---|---|---|---|---|
| backend (erp-be) | `master` (switched and pulled 2026-10-07; was `fix/session-reload`) | `227b698` "Release v1.1.0" (2026-10-06) | clean, in sync with `origin/master` | 177 / 1 | 170 (102 ts, 41 sql) |
| frontend (erp-fe) | `master` (switched and pulled 2026-10-07; was `refactor_sidebar`) | `45ae7f7` "Release v1.1.0" (2026-10-06) | clean, in sync with `origin/master` | 494 / 1 | 530 (275 tsx, 120 ts) |

**Branch decision (answered):** audit `master`. You asked me to switch and pull; both repos are now on `master` at the same commits as before (`227b698`, `45ae7f7`), so the earlier branches were already at the release tip. Old audit baseline commits were FE `00c32c4` and BE `3f0da5a`; both repos have moved since (18 and 62 commits were pulled).
Workspace root is not a git repo. Both repos have a `master`, `main`, `staging` and `stagging` (typo) branch, and many feature and backup branches.

## 2. Stack and versions

- **Backend:** Node >=20 (Dockerfile installs Node 24 via NodeSource), Express, Prisma, TypeScript, Zod, pino, helmet, cors, express-rate-limit, bcryptjs, jsonwebtoken, swagger-jsdoc/ui. Tests: Jest, ts-jest, supertest (in devDependencies).
- **Frontend:** Vite, React, TypeScript, Tailwind, Zustand, TanStack Query and Table, react-router-dom, react-hook-form, Zod, Radix select, recharts, d3, axios. Tests: Vitest, Testing Library, Playwright.
- **Database:** PostgreSQL via Prisma. 51 models, 1 enum, 41 migrations. Optional read URL.
- **Package manager:** npm (lockfiles present in both).
- **Project type:** `web-app` (SPA) + `api-service`, deployed as two Docker images with nginx.

## 3. Architecture (as read from code)

- Browser → nginx (frontend image, static SPA) → `/api/` proxied to `http://api:4000` → Express → Prisma → PostgreSQL.
- Backend entry: `src/server.ts`, `src/app.ts`. Middleware order seen in `app.ts`: pino-http, helmet, cors, JSON and urlencoded body parsers (1 MB limit), routers, 404 handler, error handler.
- **Routers mounted** under `/api/v1/`: `auth`, `assessments`, `config`, `reports`, `ai`, `comm`, `behav`, `improvement-plans`. Route count per router: config 86, communication 11, assessment 9, reports 9, behavioral 6, auth 5, ai 2, improvement-plan 2. Total about 130.
- Backend modules in `src/modules/`: access, ai, assessment, auth, behavioral, communication, config, improvement-plan, reports. Scoring engines in `src/scoring/`. Files: 8 routers, 8 controllers, 15 services, 37 test files.
- **Largest backend files:** `config.service.ts` 1739 lines, `reports.service.ts` 1012, `config.controller.ts` 939, `ai.service.ts` 832, `assessment.service.ts` 703.
- **Largest frontend files:** `useConfig.ts` 1622, `BulkAssessmentTable.tsx` 1616, `AIInsightsTab.tsx` 1613, `BehavioralAssessmentView.tsx` 1300.
- Frontend: 23 hooks, about 275 components, 141 test files. Tokens appear in `store/authStore.ts` and `components/ProtectedRoute.tsx` (storage use found there).
- **Auth:** JWT (access and refresh), bcrypt. Permissions are database-driven. Variable names in `backend/.env`: `DATABASE_URL`, `DATABASE_READ_URL`, `OPENAI_KEY`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRY`, `NODE_ENV`, `API_PORT`, `FRONTEND_URL`, `LOG_LEVEL`, `CACHE_TTL`, `JIRA_API_TOKEN` (names only; no values read). Neither repo tracks a `.env` file in git.
- **External services:** OpenAI (via `ai` module), Jira (a token variable exists; usage not yet traced).
- **Database host:** `backend/.env` points at **localhost** (`devops_platform_dev`), not production.

## 4. Deployment

- Images `tariqsulehri/rct-backend` and `rct-frontend` via `docker-compose.yml` (tag defaults to `latest`), plus `deployments/` (deploy.sh, prod and dev compose, nginx for the VM) and `scripts/` (backup, deploy-prod, Let's Encrypt init, several Python import scripts).
- Backend image: three stages on `ubuntu:24.04`, installs Node by piping a NodeSource script to bash; **no `USER` instruction found**; healthcheck present; port 4000.
- Frontend image: `nginx:alpine`, copies a pre-built `dist`, healthcheck present. `frontend/nginx.conf` has **no security headers**; the root `nginx/nginx.conf` has HSTS, nosniff, frame-deny and referrer policy (no CSP seen).
- CI: `bitbucket-pipelines.yml` in each repo. Steps: gitleaks, quality checks, Sonar, image builds. Branch pipelines for `dev`, `staging`, `master` and `main`. `image:` references use `latest` tags for gitleaks and sonar-scanner.

## 5. Top five critical flows (to trace in Stage 3)

1. Login, refresh and logout (token lifetime, revocation, storage in the browser).
2. Technical skill assessment create, update and approve, including the self-approval rules and scope for managers.
3. Score recomputation (`score-recalculation.service.ts`): atomicity with the write, cost per request.
4. CEFR and behavioral assessment write and approval paths.
5. Config management (`config` module: 86 routes, `config.manage` permission) and the reports and AI insight endpoints (data exposed, data sent to OpenAI).

## 6. Trust boundaries

Browser to API (cookie and bearer token); API to database (read replica optional); API to OpenAI (employee data may leave the system); API to Jira (to be traced); CI to Docker Hub (personal namespace); nginx to API.

## 7. Dimensions

**In scope (quick depth):** security, architecture, data, testing, cicd-supply-chain, dependencies, reliability, observability, code-health, ux-design, accessibility (code level only).
**Light touch:** performance (bundle size and the N+1 recompute), documentation.
**Not applicable:** cost (only the OpenAI usage; folded into security and reliability), compliance (none declared; employee data treated as personal).

## 8. Modules matched

| Detected | Module | Status |
|---|---|---|
| Express API | `stacks/node-express.md` | found |
| React + Vite | `stacks/react.md` | found |
| Prisma + PostgreSQL | `stacks/prisma-postgres.md` | found |
| Docker, nginx, Bitbucket Pipelines | `stacks/docker-cicd.md` | found |
| Project rules | `audit/project-standards.md` | found |

No missing stack modules. Python scripts in `scripts/` are one-off import helpers (Python module not loaded; they will get a light read only).

## 9. Tools

| Tool | Installed | Plan |
|---|---|---|
| gitleaks 8.30.1 | yes | run on both repos, history included |
| trivy 0.69.3 | yes | `trivy fs` (dependencies and misconfig) on both repos; image scan only if images already exist locally |
| docker | yes | not used (no builds) |
| npm audit | via npm | read-only, lockfile untouched |
| tsc, eslint (local bins) | yes | only if you approve running project commands |
| jest, vitest | yes | only if you approve |
| semgrep, osv-scanner, hadolint, jscpd, madge, cloc, syft, checkov, trufflehog | **no** | recorded as "not run: not installed"; those checks are done by hand where possible |

## 10. Open questions (need your answer)

1. ~~Which branch to audit?~~ **Answered:** `master` in both repos, pulled 2026-10-07.
2. **May I run the project's own checks** (type-check, lint, tests with coverage) in each repo? The database host is localhost, and a search found no test that opens a real database connection (0 uses of `new PrismaClient` in tests, 0 supertest users in backend tests: not yet verified that the 37 test files mock the data layer). Running them would give real baselines.
3. **Previous audit:** none for this run. Prompt 13 (verify the old audit) has not been run.

## 11. Leads noted during discovery (not findings yet; to verify in later stages)

- Backend Dockerfile has no `USER` (probably runs as root).
- `frontend/nginx.conf` has no security headers; the root `nginx/nginx.conf` does but no CSP.
- CI uses `latest` tags for gitleaks and sonar-scanner images; compose defaults to `latest` for app images.
- No supertest HTTP tests found in the backend test files (routes and RBAC may be untested over HTTP).
- Very large files: `config.service.ts`, `useConfig.ts`, and three frontend components over 1,300 lines.
- `JIRA_API_TOKEN` exists in the environment but no Jira client has been seen yet.

# Audit Config: Affiliate Tracking & Campaign Platform

Pre-filled for the Audit Kit at `/Users/tk-lpt-1088/projects/react/affliate/audit/kit`.
Fields follow `config.template.md` in the kit and align with the current project architecture.

| Field | Value |
|---|---|
| `PRODUCT` | Affiliate Tracking & Campaign Management Platform (Oval Media) |
| `REPOS` | `/Users/tk-lpt-1088/projects/react/affliate` (Monorepo with `backend/` and `frontend/`) |
| `Workspace root` | `/Users/tk-lpt-1088/projects/react/affliate` (**Git Monorepo** containing both tiers, deployment configurations, and specifications) |
| `BRANCH` | `master` / `main` |
| `MODE` | `AUDIT-ONLY` unless a prompt says otherwise |
| `DEPTH` | `standard` unless a prompt says otherwise |
| `INCLUDE` | `backend/src`, `backend/prisma`, `frontend/src`, `deployment/`, `docker-compose.yml`, `DOD.md`, `README.md` |
| `EXCLUDE` | `node_modules`, `dist`, `coverage`, `logs`, `.agents`, `.codex`, `.claude`, `*.tmp` |
| `DIMENSIONS` | security, architecture, data, performance, reliability, observability, testing, dependencies, accessibility, ux-design, code-health, documentation |
| `COMPLIANCE` | Zero-leak redirection, idempotent postback accrual, tenant isolation, secure webhook signatures |
| `OUTPUT_DIR` | `/Users/tk-lpt-1088/projects/react/affliate/audit/results` |
| `PREVIOUS_RUN` | None |
| `GENERATE_STACK_DRAFT` | `false` |
| `TEAM_SIZE` | 1 (you) |
| `RELEASE_CADENCE` | Continuous delivery per feature branch |
| `CONFIDENTIALITY` | Confidential affiliate performance, tracking tokens, and conversion data. |
| `Project module` | `/Users/tk-lpt-1088/projects/react/affliate/audit/project-standards.md`. Load it together with stack modules at Stage 3. |

## Hard Safety Rules For This Project

1. **Production Database Safety:** `backend/.env` points to PostgreSQL `affiliate_tracker`. Before running any database command, verify which host `DATABASE_URL` points at. If it points to remote/production: **strictly read-only. No drop, migrations, seeds, or writes of any kind.** In an audit, read `backend/prisma/schema.prisma` and migration SQL files directly.
2. **Zero-Leak Redirection & Fallback:** Missing or invalid partner tracking parameters must safely fallback to the master account so traffic/revenue is never lost.
3. **Idempotent Webhooks & Postbacks:** Webhook postbacks must be idempotent (no duplicate orders, accruals, or conversions).
4. **Secrets Protection:** Never print raw values from `.env*` or deployment files. Mask sensitive database passwords and secrets.
5. **Commands:** Commands are executed from the monorepo root or with `--prefix backend` / `--prefix frontend`.

## Known And Accepted (Do Not Flag)

| Item | Reason |
|---|---|
| Macro Tokens (`{click_id}`, `{offer_id}`, `{pub_id}`, `{payout}`) | Tracking macro substitution engine used in tracking URLs and postback configurations. |
| Master Fallback Redirects | Intentional revenue protection fallback when publisher attribution is missing. |
| Multi-Domain Routing | Custom tracking domains configured per partner network or campaign. |
| Local Port Exposures: 3085 & 3086 | Fixed production/dev exposed ports (3085 for Frontend, 3086 for Backend). |

## Decisions Already Made (Do Not Reopen)

- **Visual Design Standard:** 3D Depth & Gradient Aesthetic per `DOD.md`. Dual-theme support (Dark & Light) with high contrast, tactile button shadows, and modern bevel highlights.
- **Table-First Visual Layout:** Scannable parameter tables and settings grids instead of wrapping pill/badge clouds.
- **Frontend Architecture:** Vite + React 18, Tailwind CSS, Lucide React, TypeScript.
- **Backend Architecture:** Express thin routes + domain services + Prisma ORM + PostgreSQL.
- **Two Themes Only:** Dark (default) and Light.

## Context The Agent Should Know

- **Frontend Stack:** React 18, Vite, Tailwind CSS, Lucide React, TypeScript, Axios.
- **Backend Stack:** Node.js 22+, Express, Prisma ORM, PostgreSQL, TypeScript, CORS.
- **Exposed Ports:** Frontend exposed on `3085`, Backend exposed on `3086`.
- **Core Domain Modules:** Offers (OfferBuilder, Caps, Payouts, Targeting), Publishers / Affiliates, Postbacks / Webhooks, Traffic Routing, Conversion Tracking, Domains, Networks, Reports & Analytics.

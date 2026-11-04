# System Map: ERP Platform

**Generated:** 2026-10-29 | **Run folder:** `audit/results/2026-10-29_erp-platform_all`  
**Config:** `audit/config.md` | **Kit version:** 0.1.0 | **Mode:** `AUDIT-ONLY` (Depth: `standard`)

---

## 1. Repositories, Branches & Commits

- **Repository:** Monorepo at `/Users/tk-lpt-1088/development/react/erp/ERP`
- **Branch:** `main`
- **Commit:** `c6971b4` (`c6971b4c07216e383607945f26ad2ef954c518df`)
- **Working Tree:** Dirty (active changes in frontend UI standardization, components, tests, and documentation)
- **Contributors:** 1
- **File Counts by Extension:**
  - TypeScript: 259 `.ts`, 210 `.tsx` (Total: 469 TypeScript files)
  - Database: 29 `.sql` (schema & migrations)
  - Styling: 8 `.css` (Design tokens, Calm Ledger CSS modules, themes)
  - Markdown: 95 `.md` (architecture documentation, specifications, guidelines)
  - Configuration: 16 `.json`, 10 `.sh`, 5 `.mjs`
  - Total tracked files: ~1,120 files

---

## 2. Tech Stack & Versions

- **Backend Tier (`backend/`):**
  - **Runtime & Language:** Node.js `>=22.0.0`, TypeScript 5.8
  - **HTTP Framework:** Express 4.21.2
  - **Database & ORM:** PostgreSQL 16/17, Prisma 6.19.0
  - **Security & Middleware:** Helmet 8.0, CORS 2.8, JWT (`jsonwebtoken` 9.0.3), LRU cache 11.5
  - **Validation & Math:** Zod 3.25, Decimal.js 10.4.3 (arbitrary-precision financial arithmetic)
  - **Testing:** Vitest 5.0.5, V8 coverage
- **Frontend Tier (`frontend/`):**
  - **Framework:** Next.js 15.5.28 (App Router, Turbopack)
  - **UI Library:** React 19.0.0, Tabler Icons 3.44, Mantine Core 9
  - **Data Fetching & State:** TanStack React Query 5.95, date-fns 3.6, Decimal.js 10.4.3
  - **Authentication:** NextAuth.js 4.24.15
  - **Design System:** "Calm Ledger" token architecture (`design-tokens.css`, `globals.css`, light/dark themes)
  - **Testing:** Jest 29.7, React Testing Library 14.2, Playwright 1.48
- **Deployment & Orchestration (`deployment/`, `docker-compose.yml`):**
  - Docker Compose running PostgreSQL (`erp_postgres`: 5432), Express API (`erp_backend`: 4000), and Next.js UI (`erp_frontend`: 3000)
  - Nginx reverse proxy configuration (`deployment/nginx.conf`)
  - Linux Systemd service definitions (`deployment/erp-backend.service`, `deployment/erp-frontend.service`)
  - CI: GitHub Actions (`.github/workflows/ci.yml`)

---

## 3. Project Classification & Scope

- **Project Types:** `monorepo`, `web-app`, `api-service`
- **Dimensions In Scope:**
  1. `security`: Threat modeling, JWT verification, tenant boundary isolation, RBAC, secrets scanning, input sanitization.
  2. `architecture`: Monorepo tier separation, thin route handlers, domain service layering, double-entry ledger immutability.
  3. `data`: PostgreSQL schema design, Prisma models, foreign key cascades, migration safety, stock movement audit trail.
  4. `performance`: Query optimization, indexing, pagination, bundle sizes, Next.js server components, cache efficiency.
  5. `reliability`: Transaction rollbacks, error boundaries, graceful shutdown, health check probes.
  6. `observability`: Audit log trails, structured logging, error tracking, status endpoints.
  7. `testing`: Vitest unit tests, Jest component tests, coverage thresholds, secrets test harness.
  8. `dependencies`: Vulnerability scanning, lockfile health, deprecated package analysis.
  9. `accessibility`: Keyboard navigation, ARIA live regions, focus trapping, semantic drawer overlays.
  10. `ux-design`: Calm Ledger design token conformance, screen-fit guidelines, slide-over drawer standard, empty states.
  11. `code-health`: TypeScript strict mode compliance, dead code, modularity, lint clean status.
  12. `documentation`: Alignment of documentation (`CODEBASE_GUIDE.md`, `PROJECT_RULES.md`, schema docs) with actual code.
- **Dimensions Skipped:**
  - `cost`: Skipped (self-hosted Docker/VPS architecture; no consumption-billed cloud APIs or hyperscaler services).
  - `mobile-app`: Skipped (no native mobile targets; web-only platform).

---

## 4. Architecture & Topology

- **Topology:**
  - Browser Client $\rightarrow$ Next.js Web Frontend (Port 3000) $\rightarrow$ Express REST API (Port 4000) $\rightarrow$ PostgreSQL 16/17 (Port 5432).
- **Entry Points:**
  - 28 REST route modules under `/api/v1/*` (auth, accounts, vouchers, purchases, sales, stock transfers, stock adjustments, inventory products, reports, fiscal years, etc.).
  - Next.js App Router layout and pages under `frontend/src/app/(dashboard)/*`.
  - Next.js API proxy routes forwarding authenticated requests to Express.
- **Authentication & Authorization:**
  - User credentials authenticated via bcrypt hash comparison.
  - Signed JSON Web Tokens (Bearer JWT) with expiration and token refresh.
  - Multi-tenant tenant ID passed via `x-company-id` header and cryptographically authorized against authenticated user's assigned companies.
- **Top 5 Critical Business Flows:**
  1. **Authentication & Tenant Scoping:** Login $\rightarrow$ JWT issuance $\rightarrow$ Company selection $\rightarrow$ Request tenant validation.
  2. **Double-Entry Voucher Posting:** Draft creation $\rightarrow$ Line debit/credit sum balance verification $\rightarrow$ Transactional atomic write to `vouchers` & `voucher_lines` $\rightarrow$ General Ledger posting lock.
  3. **Stock Movements & Valuation:** Transfer / Adjustment / Purchase Receipt $\rightarrow$ Transactional movement record in `inventory_stock_movements` $\rightarrow$ Balance update in `inventory_stock_balances` $\rightarrow$ Synchronized GL voucher posting.
  4. **Sales & Accounts Receivable:** Invoice generation $\rightarrow$ Customer balance impact $\rightarrow$ Revenue recognition $\rightarrow$ Automatic stock reduction.
  5. **Financial Reporting:** Trial Balance, Balance Sheet, Profit & Loss calculation over 10-digit Account Codes (`MM GG SS PPPP`).
- **Trust Boundaries:**
  - Untrusted client input enters at Express route handlers (must be validated with Zod).
  - Multi-company boundary: Every database query must strictly filter by `company_id`.
  - Financial immutability: Posted vouchers and stock movements must be immutable; direct mutations rejected.

---

## 5. Stack Modules Matched

- `stacks/node-express.md` (Node.js & Express API)
- `stacks/prisma-postgres.md` (Prisma ORM & PostgreSQL)
- `stacks/react.md` (React 19 & Next.js 15)
- `stacks/docker-cicd.md` (Docker & GitHub Actions CI)
- Project Standard: `audit/project-standards.md` (Calm Ledger tokens, 10-digit accounts, immutable double-entry)

---

## 6. Project Commands & Tools Planned for Stage 1

- **Secrets Audit:** `node scripts/check-secrets.mjs --all` & `node --test scripts/check-secrets.test.mjs`
- **Color & Token Conformance:** `node frontend/scripts/check-raw-colors.mjs`
- **Type Checking:** `npm run type-check` (`tsc --noEmit` across backend and frontend)
- **Frontend Unit Tests:** `npm --prefix frontend test -- --watchman=false`
- **Backend Unit Tests:** `npm --prefix backend test test/accounting-rules.test.ts test/auth-access.test.ts test/invoice-balances.test.ts test/permissions.test.ts test/plain-error-map.test.ts test/stock-holder-access.test.ts`
- **Dependency Audits:** `npm --prefix backend audit --omit=dev` & `npm --prefix frontend audit --omit=dev`
- **Frontend Linter:** `npm --prefix frontend run lint`

---

## 7. Open Questions / Notes for Checkpoint A

1. Working tree has modified files from recent UI and detail panel alignment. Audit will analyze the current workspace working state.
2. Production / staging database safety: Read-only static analysis on schema/migrations; no live database mutation or migration will be executed.


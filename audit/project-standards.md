# Project Module: Affiliate Platform (Tracking & Campaign Management System)

**Status:** Vetted against current Affiliate project rules and architectural documents.
**Loads with dimensions:** security, architecture, data, testing, code-health, ux-design, accessibility, documentation.
**How it is used:** Load it at Stage 3 together with stack modules (`node-express`, `react`, `prisma-postgres`, `docker-cicd`). It adds this Affiliate system's domain rules. A violation of a rule below is an audit finding.

**Authoritative Sources, in order of precedence:**
1. [`DOD.md`](/Users/tk-lpt-1088/projects/react/affliate/DOD.md) (Definition of Done: 10 foundational rules)
2. [`AGENTS.md`](/Users/tk-lpt-1088/projects/react/affliate/AGENTS.md) (Workspace rules and execution guidelines)
3. [`audit/config.md`](/Users/tk-lpt-1088/projects/react/affliate/audit/config.md) (Monorepo audit configuration)
4. [`backend/prisma/schema.prisma`](/Users/tk-lpt-1088/projects/react/affliate/backend/prisma/schema.prisma) (Database schema, models, relations)

---

## 1. Tracking, Routing & Postback Invariants

- [ ] **Zero-Leak Redirection:** When an incoming tracking request has missing or invalid partner parameters (`aff_id`, `pub_id`, `sub1`), the system must safely fall back to the master affiliate account so traffic, conversions, and revenue are never lost.
- [ ] **Idempotent Webhooks & Postbacks:** Postback webhooks from affiliate networks must be idempotent. Re-delivering or retrying the same transaction ID (`tx_id` / `click_id`) must not create duplicate conversions or inflate publisher balances.
- [ ] **Macro Token Substitution:** Macro tokens in postback and redirect URLs (`{click_id}`, `{offer_id}`, `{pub_id}`, `{payout}`, `{sub1}`) must safely expand to URL-encoded values without breaking query parameter parsing.
- [ ] **Dynamic Caps & Traffic Throttling:** Offer daily and monthly conversion caps must be evaluated atomically before routing traffic. When a cap is reached, traffic must redirect to the fallback offer or master destination.
- [ ] **Multi-Domain Routing Isolation:** Each custom tracking domain must correctly route to its assigned campaign or network without cross-tenant or cross-network leakage.

---

## 2. Security & Data Integrity Standards

- [ ] **Database Connection Security:** `DATABASE_URL` must use environment variables and never be exposed in source control or client bundles.
- [ ] **Prisma Query Scoping:** All database operations must handle errors gracefully and prevent unhandled promise rejections.
- [ ] **No Hardcoded Secrets or Tokens:** API keys, webhook signing secrets, JWT tokens, and database passwords must strictly originate from environment configurations.
- [ ] **Cryptographic Signatures:** Network postback endpoints receiving external data must validate incoming signature headers or token parameters when configured.

---

## 3. UI/UX Standards & Definition of Done (DOD)

- [ ] **Simple Layman English:** All UI copy, labels, modals, and tooltips must use plain, understandable English. Avoid obscure developer jargon.
- [ ] **Table-First Visual Layout:** Never use wrapping badge clouds or messy pills for dense parameters or configuration data. Always present parameters, webhooks, and settings in clean, scannable tables with clear columns.
- [ ] **Separate Config UIs & Tabbed Views:** Keep every configuration UI distinct and separated from other modules. Use clean tabs within single complex configuration views to divide sections (e.g. templates, parameter table, simulator, guide) and prevent long, cluttered pages.
- [ ] **Multi-Theme Support & 3D Gradient Aesthetic:** Full visual parity across both Dark Mode (default) and Light Mode. High contrast, readable typography, modern 3D depth, subtle top bevel highlights, tactile button shadows, and smooth gradients.
- [ ] **1-Click UX & Instant Feedback:** Parameter tokens and query strings must be copyable or appendable to URLs in a single click with instant visual confirmation ("Copied!", "In URL ✓").
- [ ] **Zero Hardcoding Standard:** Never hardcode values (strings, status options, colors, numbers, endpoints, currency symbols, macro tokens, or styling rules). Always extract into centralized constants, configuration objects, enums, tokens, or typed props.
- [ ] **Modular & Reusable Components:** Reusable component-based architecture for controls (inputs, textboxes, radio groups, checkboxes, toggle switches, buttons, modals, tabs, tables, dropdown selects, badges).
- [ ] **React Hook Invariants:** Never call React hooks (`useState`, `useEffect`, `useMemo`, `useCallback`) conditionally or after early return statements. All hooks must be defined at the top level of components.

---

## 4. Architecture & Quality Standards

- [ ] **Clean Separation of Concerns:** Frontend views must delegate data fetching to API service layers and UI components to modular subcomponents.
- [ ] **Pre-Commit & Build Verification:** TypeScript compilation (`tsc --noEmit`) must pass with 0 errors across both `frontend` and `backend`.
- [ ] **Standard Port Conventions:** Frontend is exposed on port `3085`, Backend on port `3086`. No legacy ports (5000, 5173, 3080, 3081).
- [ ] **Container Readiness:** Container images build with clean multi-stage builds and run non-destructively in containerized environments.

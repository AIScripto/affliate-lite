# System Map: Affiliate Tracking & Campaign Platform

**Run:** `2026-11-04_affiliate_full`  
**Kit Version:** `0.1.0`  
**Audit Date:** 2026-11-04  
**Auditor:** Antigravity AI Code Auditor & Principal Software Architect  

---

## 1. Repositories & Inventory

- **Monorepo:** `/Users/tk-lpt-1088/projects/react/affliate`
- **Current Git Branch:** `main` / `master` (Commit `f9d0a44`)
- **Codebase Scale:** ~16,000 lines of core TypeScript, React, and CSS (excluding node_modules and vendor dependencies).
- **Directory Layout:**
  - `backend/`: Node.js Express REST API, Prisma ORM, PostgreSQL schema, business services, controllers, authentication.
  - `frontend/`: React 18, Vite, Tailwind CSS, Lucide React, multi-theme 3D design system, OfferBuilder, reporting tables.
  - `deployment/`: Production Docker Compose, deployment scripts (`deploy.sh`, `rollback.sh`), environment templates.
  - `audit/`: Software audit kit, domain rules, checklists, automated report generator.

---

## 2. Technology Stack & Runtime

| Component | Technology | Version | Purpose |
|---|---|---|---|
| Frontend Runtime | React + Vite | React 18.3.1, Vite 6.1.0 | SPA dashboard, campaign builder, reporting |
| Frontend UI & Style | Tailwind CSS | 3.4.17 + PostCSS | Multi-theme (Dark/Light), 3D depth aesthetic |
| Frontend Icons | Lucide React | 0.475.0 | Accessible UI icons |
| Backend Runtime | Node.js + Express | Node 22+, Express 4.21.2 | RESTful API, click tracking, webhook postbacks |
| Database & ORM | PostgreSQL + Prisma | Prisma 6.4.1, pg 8.13 | Relational tracking, clicks, conversions, offers |
| Validation & Security | Zod + bcrypt + JWT | Zod 3.24.2, bcrypt 5.1.1, jsonwebtoken 9.0.2 | Request payload validation, hashing, auth tokens |
| Telemetry & Parsing | ua-parser-js | 2.0.0 | User agent and device classification |
| Orchestration | Docker & Nginx | Nginx Alpine, Node 24 Alpine | Containerized production deployment |

---

## 3. Project Classification & Scope

- **Classifications:** `web-app`, `api-service`, `monorepo`, `data-pipeline`.
- **Dimensions in Scope:**
  - `security` (Authentication, JWT handling, secrets, injection, postback tampering, token validation)
  - `architecture` (Controller/service separation, state management, modularity, route boundaries)
  - `data` (PostgreSQL schema, Prisma transactions, idempotency, foreign keys, index optimization)
  - `performance` (Database queries, click redirection latency, bundle size, N+1 query patterns)
  - `reliability` (Error handling, circuit breaks, fallback routing on invalid affiliate traffic)
  - `observability` (Logging, error tracking, health check endpoints, diagnostic metrics)
  - `testing` (Unit tests, integration tests, TypeScript type coverage)
  - `cicd-supply-chain` (Docker security, unprivileged execution, lockfiles, pin versions)
  - `dependencies` (Vulnerabilities, audit checks, out-of-date packages)
  - `accessibility` (Color contrast, keyboard focus, ARIA labeling, form field association)
  - `ux-design` (Definition of Done alignment, 3D gradient aesthetic, theme parity, 1-click UX)
  - `code-health` (Dead code, hook ordering, clean component interfaces, zero hardcoding)
  - `documentation` (Integration guides, API documentation, parameter macro tables)

---

## 4. Architecture & Critical Flows

### Architecture
- **Client (Frontend)**: Runs on port `3085`. Communicates with Backend API on port `3086` via Axios client.
- **API Server (Backend)**: Runs on port `3086`. Handles API queries, authentication, click tracking redirects (`/click`, `/track`), and network conversion postbacks (`/postback`).
- **Database (PostgreSQL)**: Port `5432` (`affiliate_tracker`). Stores users, networks, domains, offers, targeting groups, payouts, clicks, and conversions.

### Critical Top 5 Flows
1. **User Authentication & Session Management**: Login (`/api/auth/login`), JWT issuance, role-based authorization (Admin vs Publisher).
2. **Click Tracking & Zero-Leak Redirection**: Inbound tracking URL hit (`/track/:offerId`), partner param resolution (`pub_id`, `sub1`), device/geo classification, fallback to master account if invalid, destination redirect.
3. **Conversion Postback & Attribution**: Inbound network webhook (`/postback`), macro expansion (`{click_id}`, `{payout}`), idempotency check against external transaction ID, balance/payout accrual.
4. **Offer Creation & Campaign Configuration**: `OfferBuilder` configuration (Targeting groups, payouts, postback parameters, custom macros, domain selection).
5. **Analytics & Aggregated Performance Reporting**: Report generation across Offers, Publishers, and Networks with real-time conversion/revenue aggregates.

---

## 5. Trust Boundaries & Attack Surfaces

1. **Public Webhook & Tracking Ingestion**: `/track` and `/postback` are public endpoints subject to volumetric traffic, bot clicks, and fraudulent postback firing.
2. **Internal API Gateway**: `/api/*` administrative routes requiring Bearer JWT authentication and Role checks (`ADMIN` vs `PUBLISHER`).
3. **Database Boundary**: Prisma queries connecting to PostgreSQL. Protection against SQL injection, race conditions on cap limits, and unindexed full-table scans.
4. **Environment & Secrets**: Storage of `JWT_SECRET`, database passwords, and advertiser tokens across `.env` and deployment configuration.


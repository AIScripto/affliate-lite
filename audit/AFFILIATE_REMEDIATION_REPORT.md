# Oval Media Affiliate Tracking Platform — Audit & Remediation Report

**Date:** November 4, 2026  
**Auditor:** Antigravity AI Code Auditor & Principal Software Architect  
**Codebase:** Oval Media Affiliate Tracking Platform (`affiliate-tracker`)  
**Deployment Target:** `161.97.110.121` (Frontend: `3085`, Backend: `3086`, PostgreSQL: `5432`)

---

## 1. Executive Summary

A comprehensive, deep multi-dimensional code audit was conducted on the Oval Media Affiliate Platform following the 16-dimension audit methodology (`audit/kit/AUDIT.md`). 

The baseline audit identified **12 findings** (1 Critical, 6 High, 4 Medium, 1 Low), predominantly around authentication enforcement, postback webhook race conditions, SSRF protection, in-memory array aggregation, and zero-leak traffic routing.

**Current Status:**  
- **11 out of 12 audit findings have been fully remediated, verified, and deployed to production.**
- The active UI crash on clicking **"+ Add Offer"** (React Hook order violation) has been diagnosed, resolved, and verified.
- Production containers (`affliate-be:latest` and `affliate-fe:latest`) have been built for `linux/amd64`, pushed to Docker Hub, and deployed via `/deployments/affliate/deploy.sh` on the remote server `161.97.110.121`.
- All health checks, database connections, and live zero-leak fallback redirects are responding with **HTTP 200 OK**.

---

## 2. Complete Finding & Remediation Status Matrix

| ID | Severity | Dimension | Title | Status | Resolution Detail |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **SEC-001** | **Critical** | Security | Dev-mode admin auto-login bypasses auth when `NODE_ENV` is unset | **FIXED** | Removed development-mode admin injection from `backend/src/middleware/auth.ts`. Strict JWT validation is now enforced across all environments. |
| **SEC-002** | **High** | Security | Hardcoded JWT secret fallback committed to source control | **FIXED** | Replaced hardcoded fallback string with `getJwtSecret()` requiring `process.env.JWT_SECRET`. Throws startup error if missing. |
| **ARC-002** | **High** | Architecture | Frontend API service lacks auth header attachment and token management | **FIXED** | Implemented `apiFetch` wrapper in `frontend/src/services/api.ts` with transparent `Bearer <token>` attachment and localStorage caching. |
| **REL-001** | **High** | Reliability | Tracking redirect returns 400 Bad Request on missing affiliate ID (violating Zero-Leak) | **FIXED** | Added master affiliate account fallback in `backend/src/controllers/trackingController.ts`. Safely redirects 302 to destination without dropping user traffic. |
| **DAT-001** | **High** | Data Integrity | Missing unique constraint on Click ID in Conversions table enables race conditions | **FIXED** | Added composite unique constraint `@@unique([clickId, goalValue], map: "idx_conversions_click_goal_unique")` in `schema.prisma`. Migrated DB via `prisma db push`. |
| **PRF-001** | **High** | Performance | In-memory aggregation over unbounded click and conversion records causes OOM risk | **FIXED** | Refactored `backend/src/controllers/reportsController.ts` to use PostgreSQL-level `groupBy`, `_count`, and `_sum` database aggregations. |
| **SEC-003** | **High** | Security | Outbound Server-Side Request Forgery (SSRF) in publisher postback dispatcher | **FIXED** | Added `isSafePublicPostbackUrl` blocking loopback, AWS/GCP metadata (`169.254.169.254`), and private RFC 1918 subnets with 3s timeout. |
| **SEC-004** | **High** | Security | Postback endpoint accepts unauthenticated revenue overrides without validating advertiser token | **FIXED** | Enforced advertiser security token verification against registered offer tokens in `handlePostback`. |
| **OPS-001** | **Medium** | Operations | Permissive wildcard CORS configuration with credentials enabled | **FIXED** | Configured origin validation matching allowed domains in `backend/src/index.ts`. |
| **TST-001** | **Medium** | Testing | Backend test runner ignores existing unit and postback integration test suites | **FIXED** | Configured `package.json` test runner to `tests/*.test.ts` with executable `node:test` execution blocks. |
| **CDH-001** | **Low** | Code Health | Hardcoded KPI trend multipliers and magic numbers in dashboard analytics | **FIXED** | Replaced arbitrary multipliers with genuine day-over-day statistical comparisons against yesterday in `dashboardController.ts`. |
| **ARC-001** | **Medium** | Architecture | Monolithic 2,300+ line `OfferBuilder.tsx` file | **DEFERRED (Wave 2)** | Subcomponents (`TargetingGroupCard`, `ActivePostbackParamsManager`, guide modals) are modular. Full breakdown into separate tab views is planned for Wave 2. |

---

## 3. UI Bug Resolution: "+ Add Offer" Screen Crash

- **Symptom:** Clicking "+ Add Offer" caused the screen to wash out / go blank.
- **Console Error:** `Uncaught Error: Rendered fewer hooks than expected. This may be caused by an accidental early return statement. in <OffersView>`.
- **Root Cause:** In `OffersView.tsx`, statistical `useMemo` hooks (`activeOffers`, `totalClicks`, `totalConversions`) were declared after `if (builderOpen) { return ... }`. When opening the builder modal, `builderOpen` became `true`, returning early and skipping those hooks.
- **Fix:** Refactored `OffersView.tsx` into a single, clean return statement with conditional rendering (`builderOpen ? <OfferBuilder ... /> : <DataTable ... />`). All hooks execute unconditionally at top-level.

---

## 4. Live Verification Results on Production VM (`161.97.110.121`)

```bash
# 1. Frontend Web App (Port 3085)
$ curl -I http://161.97.110.121:3085
HTTP/1.1 200 OK
Server: nginx/1.31.8
Cache-Control: no-cache, no-store, must-revalidate

# 2. Backend Health (Port 3086)
$ curl -I http://161.97.110.121:3086/health
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

# 3. Database Health Endpoint
$ curl -s http://161.97.110.121:3086/health/database
{"status":"ok","database":"connected","timestamp":"2026-11-04T09:14:56.713Z"}

# 4. Zero-Leak Redirection Test (Without aff_id)
$ curl -s "http://161.97.110.121:3086/click?offer_id=1&json=1"
{
  "clickId": "0251734e-a8e0-4fbf-8b76-528971ef9253",
  "offerId": 1,
  "publisherId": 1,
  "subId": null,
  "isMasterFallback": true,
  "resolvedUrl": "https://luovia.com/checkout?clickid=0251734e-a8e0-4fbf-8b76-528971ef9253&aff_id=1&sub="
}
```

---

## 5. Audit Kit Cleanup
- Updated all internal documentation and template references in `/audit/kit` to reflect the **Oval Media Affiliate Platform** instead of legacy ERP terms.
- Generated audit artifacts:
  - System Map: `audit/results/2026-11-04_affiliate_full/system-map.md`
  - Threat Model: `audit/results/2026-11-04_affiliate_full/threat-model.md`
  - Findings: `audit/results/2026-11-04_affiliate_full/findings.json`
  - HTML Report: `audit/results/2026-11-04_affiliate_full/report.html`
  - CSV Export: `audit/results/2026-11-04_affiliate_full/findings.csv`


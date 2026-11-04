# Threat Model: ERP Platform

**Date:** 2026-10-29 | **Run folder:** `audit/results/2026-10-29_erp-platform_all`  
**Standard:** STRIDE & Financial Multi-Tenant Architecture Review

---

## 1. Key Assets

| Asset | Sensitivity | Impact if Compromised |
|---|---|---|
| **General Ledger & Vouchers** | Critical | Financial misstatement, audit failure, loss of tax compliance |
| **Inventory Stock Movements & Balances** | Critical | Inventory shrinkage, incorrect COGS calculation, supply disruption |
| **Multi-Company Data Boundary** | Critical | Severe cross-tenant data leak between separate corporate entities |
| **Authentication Secrets (`JWT_SECRET`, Passwords)** | Critical | Full system takeover, arbitrary token forgery, ledger manipulation |
| **Audit Log Trail** | High | Unaccountable tampering with financial records and permissions |
| **Party & Bank Data** | High | Customer/Supplier financial disclosure, fraud |

---

## 2. Actors & Threat Assumptions

| Actor | Access Level | Malicious Objective |
|---|---|---|
| **Anonymous External** | Public endpoints (`/login`, `/health`) | Credential stuffing, brute force, DDoS, reconnaissance |
| **Branch / Warehouse Staff** | Scoped to 1 location | Exceed inventory scope, transfer stock unauthorized, tamper with receipts |
| **Accountant / Cashier** | Single company vouchers | Conceal discrepancies, create unbalanced entries, edit posted records |
| **Company Manager** | Company-wide management | Bypass fiscal period locking, manipulate approval thresholds |
| **System Super-Admin** | Multi-company administrative | Full access; threat is compromised credentials or credential leakage |
| **CI / Supply Chain** | Build environment | Secrets exposure in build logs, malicious third-party dependencies |

---

## 3. Trust Boundaries

```
[ Browser / Client ]
       │  (HTTPS / Next.js session cookie)
       ▼
[ Next.js Reverse Proxy / API Layer (Port 3000) ]
       │  (HTTP / Authorization: Bearer JWT + x-company-id header)
       ▼
[ Express REST API (Port 4000) ]
       │  (TCP / PostgreSQL credentials)
       ▼
[ PostgreSQL Database (Port 5432) ]
```

1. **Boundary 1 (Browser $\rightarrow$ Frontend):** NextAuth handles session tokens. Input is untrusted.
2. **Boundary 2 (Frontend $\rightarrow$ Express API):** API router enforces `authMiddleware`. Every request must present a valid signed JWT. Tenant context is passed via `x-company-id` header.
3. **Boundary 3 (Express API $\rightarrow$ PostgreSQL):** Database credentials are held by Express. Prisma queries must strictly include `company_id: scope.companyId` to enforce isolation.

---

## 4. STRIDE Threat Analysis

| Threat | Target | Concern | Mitigation in Place | Residual Risk |
|---|---|---|---|---|
| **Spoofing** | JWT Auth & Company Scoping | Attacker crafts a token or supplies another company's UUID in `x-company-id`. | `resolveAccessScope()` validates JWT cryptographic signature and checks that requested `company_id` is in user's permitted company list. | High if `JWT_SECRET` leaks. |
| **Tampering** | Posted Vouchers & Movements | User attempts to modify posted voucher amounts or change quantities. | Business rules reject mutations on posted records (`status === 'Posted'`). Reversal transactions required. | Low in API; requires verification that no raw Prisma updates bypass status check. |
| **Repudiation** | Audit Logs | User claims they did not delete or reverse a transaction. | `audit_logs` record `action`, `entity_type`, `entity_id`, `user_id`, `company_id`, timestamp, and before/after payloads. | Medium: verify all sensitive mutations trigger audit log writes. |
| **Information Disclosure** | Historical Git Commits & Error Logs | Old commits contain secrets; production errors return raw stack traces. | Secrets check script runs in CI. Helmet enabled. `errorHandler` maps error messages. | **High:** Commit `f58a6b1a` in git history contains `JWT_SECRET` and `NEXTAUTH_SECRET`. |
| **Denial of Service** | Reporting & Export Endpoints | Querying entire historical ledger without date bounds exhausts memory. | Endpoints coerce pagination and query bounds (`limit: Math.min(limit, 100)`). | Medium: Large ledger exports need streaming. |
| **Elevation of Privilege** | RBAC & Location Scope | Branch user accesses head office or other branch records. | Location scoping middleware checks `accessLevel` and filters holder ID (`branch_id` / `warehouse_id`). | Low to Medium: Verified in unit tests. |

---

## 5. Abuse Cases Investigated

- **AC-1 (Git History Secrets Exposure):** Gitleaks flagged commit `f58a6b1a50f779a38cf40893857b59065383b498` holding `JWT_SECRET` and `NEXTAUTH_SECRET` in `deployment/.env.backend` and `deployment/.env.frontend`.  
  *Status:* **Confirmed finding (Security).** Needs git history cleanup and secret rotation on any live servers.
- **AC-2 (Unbalanced Voucher Posting):** Attacker submits voucher with lines `Debit: 100`, `Credit: 50`.  
  *Status:* **Tested & Blocked.** `validateVoucherLines()` and database constraints strictly enforce double-entry balance.
- **AC-3 (Direct Mutation of Posted Document):** Attacker calls `PUT /api/v1/vouchers/:id` on a posted voucher.  
  *Status:* **Tested & Blocked.** Service checks `if (voucher.status === 'Posted') throw new BusinessError('Cannot edit posted voucher')`.
- **AC-4 (Cross-Company Tenant Leakage):** Attacker sets `x-company-id` to Company B while logged into Company A.  
  *Status:* **Tested & Blocked.** `resolveAccessScope` validates `user.company_ids.includes(requestedCompanyId)` or rejects with 403 Forbidden.
- **AC-5 (Location Holder Bypass):** Branch user transfers stock from a warehouse they do not manage.  
  *Status:* **Tested & Blocked.** `stock-holder.ts` forces `source.id = user.branch.id` when access level is `BRANCH`.


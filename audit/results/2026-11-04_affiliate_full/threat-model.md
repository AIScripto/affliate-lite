# Threat Model: Affiliate Tracking & Campaign Platform

**Run:** `2026-11-04_affiliate_full`  
**Kit Version:** `0.1.0`  
**Date:** 2026-11-04  

---

## 1. Key Assets to Protect

1. **Publisher Payouts & Revenue Records:** Conversion records, payout balances, and commission rates against fraudulent inflation.
2. **Affiliate Click Attribution & Click IDs:** Integrity of click minting, cryptographic uniqueness, and prevention of attribution spoofing.
3. **Authentication Secrets & JWT Tokens:** `JWT_SECRET`, user password hashes, and admin credentials.
4. **Offer Destination & Traffic Routing Rules:** Target URLs, trafficback fallbacks, and targeting filters.
5. **System Availability:** High-throughput tracking (`/click`, `/track`) and postback receiver (`/postback`) endpoints.

---

## 2. Threat Actors

| Actor | Trust Level | Malicious Objective |
|---|---|---|
| **Anonymous Web Visitor / Bot** | Zero | Click fraud, automated scraping, denial of service on click redirect routes. |
| **Malicious Publisher / Affiliate** | Low | Fabricating conversions (`click_id` guessing, postback replay), probing internal infrastructure via SSRF in postbacks. |
| **Rogue Advertiser Network** | Low / Medium | Falsifying conversion statuses, overriding revenue amounts without authorization. |
| **Attacker without credentials** | Zero | Exploiting unauthenticated dev-mode auth bypass, forging JWTs with hardcoded fallback secrets. |

---

## 3. Trust Boundaries

1. **Public Web → Tracking Engine (`/click`, `/track`)**: Unauthenticated inbound HTTP traffic. Untrusted query parameters (`offer_id`, `aff_id`, `sub_id`).
2. **Advertiser Network → Postback Receiver (`/postback`)**: Inbound server-to-server webhook. Publicly callable without HMAC signature or API key enforcement.
3. **Tracking Engine → Publisher S2S Postback (`fetch(publisher.postbackUrl)`)**: Outbound server-initiated HTTP call based on user-supplied URL. Severe SSRF risk.
4. **Browser Client → Admin API (`/api/v1/*`)**: Client requests authenticated via Bearer JWT. Unchecked when `NODE_ENV` is unset or development.
5. **API Controller → PostgreSQL**: Prisma ORM database transactions and aggregation queries.

---

## 4. STRIDE Threat Analysis

| Threat Category | Target Flow / Boundary | Code Location | Finding / Risk |
|---|---|---|---|
| **Spoofing (S)** | Authentication (`/api/v1/*`) | `backend/src/middleware/auth.ts:40-50` | Development-mode auto-login impersonates Admin user `zeeshan@gmail.com` if `NODE_ENV` is not strictly `'production'`. |
| **Spoofing (S)** | JWT Verification | `backend/src/middleware/auth.ts:5` | Hardcoded fallback secret `super_secure_affiliate_jwt_token_2026` allows minting valid tokens offline. |
| **Tampering (T)** | Postback Revenue & Payout | `backend/src/controllers/trackingController.ts:101, 142` | `sumOverride` accepts unvalidated `query.sum` directly, letting callers inflate reported revenue arbitrarily. |
| **Tampering (T)** | Duplicate Conversion Accruals | `backend/src/controllers/trackingController.ts:131-135` | Lack of database unique index on `clickId` permits concurrent postback replay race conditions. |
| **Information Disclosure (I)** | Outbound Publisher Postback (SSRF) | `backend/src/controllers/trackingController.ts:174` | `fetch(outUrl)` issues unvalidated GET requests to publisher-provided URLs without internal RFC 1918 / cloud metadata blocking. |
| **Denial of Service (D)** | Reporting Endpoints | `backend/src/controllers/reportsController.ts:22-30, 125-132` | In-memory aggregation loads millions of click/conversion records into Node.js heap memory, leading to OOM crash. |
| **Elevation of Privilege (E)** | Frontend API Invocations | `frontend/src/services/api.ts` | Frontend client omits `Authorization: Bearer` headers, relying on server dev-mode backdoor to execute admin mutations. |

---

## 5. Confirmed Abuse Cases

1. **Abuse Case 1: Arbitrary Admin Access via Environment Misconfiguration**
   - *Status*: **Confirmed** (`backend/src/middleware/auth.ts:40-50`).
   - *Attack*: Attacker requests `/api/v1/offers` without authorization header. If `NODE_ENV` is empty or `development`, backend injects `user = { role: 'ADMIN' }`, granting full administrative control.
2. **Abuse Case 2: Postback Revenue Tampering & Duplicate Conversion Inflation**
   - *Status*: **Confirmed** (`backend/src/controllers/trackingController.ts:101-163`).
   - *Attack*: Attacker spams `/postback?clickid=<valid_id>&sum=9999999`. Since `Offer.advertiserSecurityToken` is never verified and `clickId` is not uniquely constrained in PostgreSQL, revenue is recorded without authentication and duplicate conversions can be inserted.
3. **Abuse Case 3: SSRF via Publisher Postback URL**
   - *Status*: **Confirmed** (`backend/src/controllers/trackingController.ts:174`).
   - *Attack*: Publisher sets `postbackUrl = "http://169.254.169.254/latest/meta-data/"` or `"http://localhost:5432"`. When a conversion is recorded, the backend server makes an unvalidated GET request to internal infrastructure.
4. **Abuse Case 4: Denial of Service via In-Memory Report Loading**
   - *Status*: **Confirmed** (`backend/src/controllers/reportsController.ts:22-30`).
   - *Attack*: A user opens Networks or Offers report on high-volume production. Node.js retrieves all click IDs into an array, exhausting heap space (`JavaScript heap out of memory`).
5. **Abuse Case 5: Traffic Redirection Leak on Missing Partner Parameters**
   - *Status*: **Confirmed** (`backend/src/controllers/trackingController.ts:10-13`).
   - *Attack*: Inbound link hits `/click?offer_id=1` without `aff_id`. Instead of falling back to the master account per DOD Rule 6, the API returns a 400 Bad Request error, dropping live user traffic.

---

## 6. Candidate Attack Chains

- **CHAIN-1: Authentication Bypass to Full Monorepo Takeover**
  - Step 1: `NODE_ENV` is unset or omitted in Docker container (`backend/src/middleware/auth.ts:40-50`).
  - Step 2: Attacker accesses `/api/v1/publishers` or `/api/v1/offers` unauthenticated.
  - Step 3: Attacker creates malicious publisher account and assigns custom SSRF postback URL (`trackingController.ts:174`).
  - Step 4: Attacker triggers `/postback` to query internal cloud metadata or local database services.
  - *Cheapest Breakpoint*: Remove dev-mode admin backdoor from `backend/src/middleware/auth.ts` and require strict JWT authentication for non-public routes.


# 04 - Backend Definition of Done (DoD) Skill (Antigravity IDE)

## Skill Purpose
This executable verification skill enforces strict architectural, runtime, security, and business-rule compliance for the `/backend` Node.js v24 codebase before any backend task is marked complete in Antigravity IDE.

---

## 1. Node.js v24 & TypeScript Runtime Gates
- [ ] **Engine Enforcement:** `package.json` specifies `"engines": { "node": ">=24.0.0" }` and `"type": "module"` (strict ESM; zero `require()` or `module.exports`).
- [ ] **Strict TypeScript:** `tsconfig.json` has `"strict": true`, `"noImplicitAny": true`, and `"noUncheckedIndexedAccess": true`. Running `npm run typecheck` (`tsc --noEmit`) produces `0` errors.
- [ ] **Native Utilities:** Uses Node.js v24 built-in `crypto.randomUUID()` for click IDs and `node:test` + `node:assert/strict` for automated API integration tests.

---

## 2. Deterministic Schema & Validation Gates
- [ ] **100% Zod Request Guarding:** Every `POST`, `PUT`, `PATCH`, and `GET` endpoint validates `req.body`, `req.query`, and `req.params` using a strict Zod schema middleware before invoking controller logic.
- [ ] **Exact Validation Messages:** Missing required fields return `400 Bad Request` with structured field errors matching the video's required field semantics (`"Please fill out this field."`).
- [ ] **Role-Based Serializer Stripping:** Any response returned to a `PUBLISHER` JWT strictly omits `revenue` and `totalProfit` fields so publishers only ever see their `payout` (`[07:12]`).

---

## 3. Client-Specific Business Logic Verification Checklist
Run the following functional assertions against the live backend before completion:
1. [ ] **Publisher Creation Simplification (`[01:53]`):** `POST /api/v1/publishers` accepts ONLY `{ name, email, password }`. It does NOT require `publisherType`, `offers`, or `postback`.
2. [ ] **Publisher Deactivation Cascade (`[02:20]`):** Calling `PATCH /api/v1/publishers/:id/status` with `{ "status": "INACTIVE" }` atomically removes that publisher's active links in `offer_publishers` and blocks `/click` redirects for their `aff_id`.
3. [ ] **Network Free-Text Contact Details (`[03:06]`):** `POST /api/v1/networks` accepts `{ name, contactDetails, allowDuplicateConversions }` without requiring a `software` enum.
4. [ ] **Offer Visibility State Machine (`[04:08]`):**
   - Setting Offer `visibility = 'PUBLIC'` clears `offer_publishers` and makes the offer available to all active publishers.
   - Setting Offer `visibility = 'PRIVATE'` restricts the offer exclusively to publishers in `offer_publishers`.
5. [ ] **Macro Replacement & S2S Postback (`[04:40]`, `[06:24]`):**
   - `GET /click?offer_id=17&aff_id=5&sub_id=test1` logs a click UUID and redirects with `{clickid}`, `{aff_id}`, `{offer_id}`, and `{sub_id}` interpolated.
   - `GET /postback?clickid=<uuid>` records a conversion with the offer's exact `revenue` ($150) and `payout` ($100) snapshot and respects `allowDuplicateConversions`.
6. [ ] **Dashboard & Report Calculations (`[00:13]`, `[07:35]`):**
   - `EPC` accurately computes `Payout / Clicks` (`68` clicks, `$750` payout -> `$11.03`).
   - Dashboard `Offers` and `Publishers` tables sort by `conversions DESC, clicks DESC` (`[01:04]`).

---

## 4. Automated Verification Command Sequence
In Antigravity IDE terminal, execute:
```bash
cd backend
npm run lint
npm run typecheck
npm test
```
All three commands must exit with code `0` before transitioning to frontend integration.
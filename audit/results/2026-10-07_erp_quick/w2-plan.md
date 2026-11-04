# Wave 2 plan: access control and sessions

Run 2026-10-07_erp_quick · Base: `master` backend `e0ee06e`, frontend `e43866c` (W0 and W1 included) · Version stays 1.1.0.
All 12 findings were re-checked on today's code: every one still holds.

Branches: backend `fix/w2-access-sessions`, frontend `fix/w2-access-sessions` (frontend only for SEC-008).
Order inside the wave: **W2a first** (no decision needed, low risk), then **W2b** (needs your answers).

---

## W2a: safe to start now

| ID | What changes | Behaviour users will notice | Proof test |
|---|---|---|---|
| **SEC-008** Logout does not revoke | Frontend calls `POST /auth/logout` before clearing state (failure ignored). Backend logout revokes the token **in the browser's cookie** (found by hash), works even if the access token has expired, clears the cookie with the same options used to set it. | Logging out in one browser no longer ends your sessions on other devices. (Today the backend would revoke all of them, but it is never called.) | Logout then `refresh` with the old cookie returns 401. A second login's token stays valid. |
| **SEC-009a** Password change keeps old sessions | `changePassword` and the admin password reset revoke **all** the user's refresh tokens in the same transaction; admin reset also clears `login_attempts`/`locked_until`. | After a password change or admin reset, every device must sign in again. This is the point. | After a change, old refresh token returns 401; the current request still works. |
| **SEC-010** Tokens in request logs | pino `redact` for `authorization`, `cookie`, `set-cookie` (config and `pinoHttp`). | None visible. Logs no longer contain tokens. | Log a request with a Bearer token and cookie: output contains neither. |
| **SEC-011** No `trust proxy` | `app.set('trust proxy', 1)` (one nginx hop). Add a rate limiter to `/auth/refresh` and `/auth/change-password`. | Login throttling counts each client separately instead of one shared bucket. | Supertest: two client IPs behind the proxy get separate limits. |
| **SEC-013** Lockout abuse and user enumeration | Reset the attempt counter when a lock has expired. Unknown, inactive and wrong-password cases return the same 401 and take the same time (dummy hash compare). Count failures per username **and** client IP. | A locked-out user is let in again after 15 min and gets one new try, not a re-lock. Messages no longer reveal which usernames exist. | Five failures lock; after 16 min one wrong try gives 401, not a lock; the three failure cases are indistinguishable. |
| **SEC-016** Users changes leave no trace | `createUser`, `updateUser` (role, active flag, password, employee link) and `deleteUser` write audit rows (field **names** changed, never secret values). Refuse removing or deactivating the **last active ADMIN**. | Admin screens show user changes in the audit list. An admin cannot lock everyone out of administration. | Role change inserts an audit row with actor, target, old and new role; last-admin removal returns 409. |
| **SEC-012** nginx rate limit keyed on a header | Key `api_limit` on `$binary_remote_addr`. **Workspace file, no git history: delivered as a patch, not applied.** | None. | Patch dry-run on a fresh copy; `nginx -t` if available. |

## W2b: needs your answers first

| ID | Question | My recommendation | What changes if you agree |
|---|---|---|---|
| **SEC-006** (D1) | Who approves the self-assessments of ADMIN and TOP_MANAGEMENT? | Another admin or top manager (four-eyes) | One `isOwnRecord()` helper with no role filter, used on create, update and approve in the assessment and CEFR controllers. A senior user's own record follows the engineer draft flow. |
| **SEC-005** | When an engineer edits an already **approved** skill, what happens? | The skill goes back to pending and needs re-approval (the old level stays visible until then) | Today the level and score change silently while the status stays "approved". |
| **SEC-007** | May any manager approve another manager's skills? | No: only the subject's own Line Manager (an active assignment with can-assess) | Mutual approval between two managers in one department stops working. |
| **SEC-009b** | Rotate the refresh token on every refresh? | **Not now.** With two tabs open, rotation can look like theft and log the user out everywhere. It needs a short grace window and its own tests. | Skipped in W2: password change and logout (W2a) already close the main gaps. Tracked separately. |
| **SEC-014** Behavioral writes | Apply the same submission window as skills, reject unknown subjects with 404 | Yes | Behavioral ratings are refused outside an open appraisal window (new behaviour). |
| **SEC-015** Deleting assessments | Block deleting approved or pending assessments for engineers and own-record managers; require an open window; write an audit row | Yes | An engineer can no longer delete their own approved skill. |

SEC-014 and SEC-015 follow the same rules as the existing skill flow, so I will treat them as agreed unless you object.

## Rules for the wave
Tests first (each fails before, passes after). Backend before frontend. Coverage not below baseline (backend 73.99%, frontend 83.87%). Type-check, lint, tests, build pass. Local Sonar pre-check (with the redundant-type rule) **before any push**. Real-data check on the local dev database (read-only; no logins that write) for the user and session endpoints. Everything lands on `staging` first, then `master`, with no version change.

## Owner actions this wave creates
- Apply the nginx patch (SEC-012) after a look: it changes how rate limiting counts clients.
- Tell users that after the deploy, everyone has to sign in again once if a password is changed (SEC-009a) — normal.

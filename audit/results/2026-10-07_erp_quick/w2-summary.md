# Wave 2 summary: Access control and sessions

Run 2026-10-07_erp_quick · Plan: `w2-plan.md` · Branches: backend and frontend `fix/w2-access-sessions` (from `master` with W0 and W1).
Status: **done on local branches, waiting for your approval. Nothing pushed, no pull requests, version still 1.1.0.**

## Findings

| ID | Result | What changed |
|---|---|---|
| SEC-005 | **Fixed** | Editing an approved skill sends it back to pending; the level is kept (it used to reset to "Unset"); re-sending identical values changes nothing. |
| SEC-006 (D1) | **Fixed** | Nobody approves their own record at any role (skills, CEFR, behavioral). ADMIN and TOP_MANAGEMENT included. |
| SEC-007 | **Fixed** | A manager cannot approve (or assess) another manager unless they are that manager's Line Manager. ADMIN and TOP_MANAGEMENT are not peers. |
| SEC-008 | **Fixed** (both repos) | Signing out ends this browser's session on the server. The app now calls the logout endpoint. |
| SEC-009 | **Partly fixed** | A password change (yours, or an admin reset) ends the other sessions. **Not done, by your decision:** refresh-token rotation. |
| SEC-010 | **Fixed** | Bearer tokens and cookies no longer reach the request logs. |
| SEC-011 | **Fixed** | `trust proxy` is set; new rate limits on refresh and change-password; the hop count is a setting. |
| SEC-012 | **Patch delivered** | `sec-012-nginx.patch`, tested with `nginx -t`. Not applied (workspace file, no git history). |
| SEC-013 | **Partly fixed** | No username enumeration, correct lock order, lock reset after expiry. **Not done:** counting failures per client address (needs a shared store). |
| SEC-014 | **Partly fixed** | Unknown subject returns 404; the submission window applies. **Not done:** accepting only employee codes (the frontend may send ids), and a period column (needs a migration). |
| SEC-015 | **Fixed** | Delete needs an open window, is audited, and is blocked for approved/pending skills on one's own record. |
| SEC-016 | **Fixed** | User create, change and deactivate are audited; the last active admin cannot be removed. |

Not reproduced: none. Deferred: the three "not done" items above.

## Numbers

| | Before (master) | After |
|---|---|---|
| Backend tests | 648 | **779** |
| Backend line coverage | 73.99% | **75.37%** |
| New-code coverage (Sonar-style) | n/a | **97.6%** |
| Frontend tests | 2,354 | **2,358** |
| Frontend line coverage | 83.87% | 83.87% |
| Type-check, lint errors, build | pass | pass |
| Production vulnerabilities, trivy gate | 0 / pass | 0 / pass |
| Local Sonar pre-check (with the redundant-type rule) | n/a | **0 hits** (both repos) |

The pre-check caught 2 more issues before any push (a constant named like a password, and an `x-powered-by` header in a test app). Both are fixed.

## Proof

- Every fix has tests that failed before it (several did not even compile before): 131 new backend tests, 4 new frontend tests.
- The log redaction test shows the real leak: without redaction the token, the cookie and the Set-Cookie value all appear in the log.
- The proxy and rate-limit tests use real HTTP with simulated client addresses; all 4 failed on the old files.
- **Real-data check on your local dev database** (read-only, refused-before-write cases only), 13 of 13 passed: server starts; users and audit log contain no hashes; an out-of-scope manager gets 403 on a CEFR result; an unknown behavioral subject gets 404; an engineer is still refused; the login limiter limits one client address after 10 attempts and not another; an unknown user gets the ordinary 401.
- **nginx:** `nginx -t` passes on both the original and the patched file.

## What users will notice

- **Engineers:** editing a skill after it was approved sends it back for approval, and it **stops counting toward the score until a manager re-approves it**. They can no longer delete an approved or pending skill.
- **Managers:** two managers can no longer approve each other's skills, CEFR results or behavioral ratings; their own Line Manager (or an admin / top manager) does it. Behavioral ratings are refused outside an open appraisal window.
- **Admins and top managers:** they can no longer approve their own record; another admin or top manager does. They also cannot demote or deactivate the last active admin.
- **Everyone:** signing out really signs you out of this browser (other devices stay signed in). Changing a password signs you out of your other devices.
- **Login:** unknown usernames and wrong passwords look identical. A locked account is only reported to someone who knows the right password, and the lock clears properly after 15 minutes.
- **Operations:** every user create, role change, password reset and deactivation appears in the audit log.

## Things to decide or check

1. **TRUST_PROXY_HOPS (default 1).** From `nginx/nginx.conf`, API requests pass **one** proxy (the TLS nginx proxies `/api/` straight to the API), so the default is right. If production has another proxy in front, set it to the real number. Too low is safe; too high is not.
2. **The nginx patch.** Check whether a cloud load balancer sits in front of this nginx before applying it (the README says what to add if so).
3. **Admins who work alone.** If a department has one admin, they cannot approve their own record: another admin or top manager must. That is the D1 rule.
4. **Existing data.** Skills already marked approved are unaffected until someone edits them.

## Left for later (all recorded in the logs)
Refresh-token rotation, per-address lockout counting, restricting behavioral subjects to codes, a period column for behavioral ratings, and the "any signed-in user" reports routes (W5).

## Next
On your approval I can push the two W2 branches and test them on `staging` as before (the staging pipelines are the real test), then `master` with no version change. W3 (make scores trustworthy) is the next wave after that.

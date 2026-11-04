# Wave 0 summary: Stop the exposure

Run 2026-10-07_erp_quick · Plan: `fix-plan.md` · Status: **done on branches, waiting for your approval**. Nothing pushed or merged.

## Findings

| ID | Status | Branch | Commits |
|---|---|---|---|
| SEC-001 Password hashes in API responses | fixed | backend `fix/w0-security-exposure` | 623ad5f, 4338f8a |
| SEC-002 Hashes in the audit log | fixed (code) · **owner must scrub and rotate** | backend `fix/w0-security-exposure` | 623ad5f, a524ce1, 4338f8a |
| SEC-003 CEFR status route has no scope check | fixed | backend `fix/w0-security-exposure` | 1065540 |
| SEC-004 Demo logins in the production bundle | fixed (code) · **owner must check production (D0)** | frontend `fix/w0-demo-accounts` | 43da81a |

Not reproduced: none. Deferred: none. Needing a decision: D0 (yours to check, see below).
Each repo also has a `REMEDIATION_LOG.md` commit (backend 19f4fe8, frontend 8dc6ae3). Master backups: local branches `backup/master-2026-10-07-pre-w0-fixes` and bundles in `backup/`.

## Numbers

| | Before | After |
|---|---|---|
| Backend tests | 548 | **580** |
| Backend line coverage | 66.08% | **66.74%** |
| Frontend tests | 2,334 | **2,342** |
| Frontend line coverage | 83.42% | **83.87%** |
| Type-check, lint errors | 0, 0 | 0, 0 (frontend: same 91 warnings) |
| Frontend build | pass | pass |

New code coverage: the three new backend files are at 100% lines. The frontend `LoginPage.tsx` is 73% as a whole file, but the changed lines (lazy import, Suspense) are covered; the uncovered lines are the existing submit handler.

## What changed for users

- **Admins and managers:** the user, assignment and audit-log API responses no longer carry password fields. No screen read them, so nothing looks different.
- **Managers approving CEFR results:** an employee outside your scope now returns "Access denied". Own-record attempts still say SELF_APPROVAL_PROHIBITED.
- **Everyone:** the login page looks the same in production. The demo list was already hidden there; it is now also absent from the files.
- **Developers:** the demo list still appears on the development server.

## Real-data smoke test (added after the first summary)

Run on 2026-10-07 against your **local dev database** (host localhost, `devops_platform_dev`, 47 users): the backend started on `master` and then on the W0 branch, and called the user endpoints with a real admin token. Read-only; counts only, no secret printed. Short-lived local tokens were minted in code, so nothing was logged in or written.

| Endpoint | master (before) | W0 (after) |
|---|---|---|
| GET /config/users | **47** password hashes | 0 |
| GET /config/access/department-assignments | 1 | 0 |
| GET /config/access/line-manager-assignments | **107** | 0 |
| GET /config/access/audit-logs | **121** | 0 |

- **It found a gap:** the first W0 version still returned 30 hashes from the audit-log list, from rows stored before the fix. Fixed in commit 4338f8a (strip on read; also drops lock-state keys). Merging the first version would not have stopped that leak.
- A real CEFR assessment and a real LINE_MANAGER who is out of its scope: `PATCH /comm/assessments/:id/status` returns **403 Access denied**. An ENGINEER gets 403 by role. (An in-scope approval was not tried: it would write to the database. It is covered by unit tests.)
- User objects keep every field the frontend uses (`employee`, `role_ref`, `is_active`, ...). The frontend never read the removed fields.
- **Not testable here:** the dev database has no TOP_MANAGEMENT or MANAGER user. From the code, TOP_MANAGEMENT gets only its assigned scope in assessment mode, the same rule every other CEFR route already uses, but this was not exercised with real data.
- Not done: opening the Users screen in a browser (it needs a real login; I deliberately did not write to the database to sign in).

## Proof that each fix works (failing before)

- SEC-001: a source-guard test found **22** unsafe user relations before the fix and 0 after. A second test fails if someone adds a column to User without deciding whether it may be sent.
- SEC-002: audit rows written through the service no longer contain hashes (tests); the scrub script is tested in dry-run, apply, confirm-host and second-run modes.
- SEC-003: 3 of the 4 new scope tests failed on the old code.
- SEC-004: `npm run check:no-demo` **failed on a fresh build of `master`** (list, description and password in the bundle) and **passes on the fix**. The production test for LoginPage fails on the old page.
- Browser (Chrome), both the production build and the dev server, light/dark/midnight at 375 and 1280 px: no list or chunk in production, list present in development, no overflow, no console errors, Enter on a demo button fills the form. Screenshots of the production build are in `screenshots-w0/`. Dev screenshots were deleted on purpose because they show the demo logins.

## Contract changes

Backend: secret fields removed from user objects (the frontend never used them); the CEFR status route can now return 403. Frontend: none. Both are listed in each `REMEDIATION_LOG.md`.

## What I did not do, and you must

1. **Scrub production audit rows:** from the backend folder, run `npx tsx src/scripts/scrub-audit-log-secrets.ts` first as a dry run. Then run it with `--apply` and `CONFIRM_SCRUB_HOST=<your production host>`.
2. **Rotate every user's password.** The hashes were readable through the API and the audit-log screen.
3. **Check production for the five demo logins** (one per role, including an Admin) and change their passwords if they exist (D0).
4. **Push, pull requests, merge, `npm version`.** Waiting for you.
5. Add `npm run check:no-demo` to the pipeline in W1.

## Things to know

- One existing test was updated, not weakened: the `listUsers` assertion expected the unsafe `include`; it now expects the safe `select`.
- A side finding while testing: the frontend `npm run test:coverage` starts Vitest in watch mode and never exits in CI-style use. I used `vitest run --coverage` instead. It is a W1 candidate (not changed).
- Backend lint is fully clean (0 errors, 0 warnings). Frontend lint has the same 91 warnings as the baseline (0 errors).
- Both fix branches are pushed to Bitbucket (2026-10-07, with your approval). Backend is 4 commits ahead of `master`, frontend 2. Pull requests are not opened yet: descriptions are in `pr-backend.md` and `pr-frontend.md`.

## Next

On your approval I can push the two branches and open pull requests, or you can review the diff first:
`git -C backend diff master...fix/w0-security-exposure` and `git -C frontend diff master...fix/w0-demo-accounts`. Then W1 (prompt 11) once W0 is merged.

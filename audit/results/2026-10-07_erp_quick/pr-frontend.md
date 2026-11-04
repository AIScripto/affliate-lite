**Title:** fix(security): W0 - keep demo sign-in shortcuts out of production builds (SEC-004)

**Branch:** `fix/w0-demo-accounts` into `master` · **Audit run:** 2026-10-07_erp_quick, wave W0

## What changed
- The demo accounts (employee-code logins sharing one test password) were hidden at runtime in production, but imported statically, so the logins stayed in the JavaScript every visitor downloads.
- `LoginPage` now loads `DemoAccounts` lazily only when `import.meta.env.DEV` is true. Vite removes that branch and the chunk from production builds. The `VITE_SHOW_DEMO_ACCOUNTS` override is gone.
- New `npm run check:no-demo` fails if a build contains the demo list or password.

## Proof
- [x] `npm run check:no-demo` **fails on a fresh build of `master`** and **passes on this branch**.
- [x] LoginPage tests for development and production; the production test fails on the old page.
- [x] Type-check, lint (0 errors, same 91 warnings), build, full suite: **2,342 tests** (was 2,334).
- [x] Coverage not below baseline: lines **83.87%** (was 83.42%).
- [x] Browser (Chrome), production build and dev server, light/dark/midnight, 375 and 1280 px, keyboard: no demo list or chunk in production; list works in development; no overflow or console errors.

## Contract changes
None.

## Owner actions (not done by the agent)
- [ ] Check whether the five demo logins exist in production and change their passwords if so.
- [ ] Add `npm run check:no-demo` after `npm run build` in the pipeline (planned for W1).
- [ ] `npm version` when merging to `master`.

## Rollback
Revert the merge. No data or API change.

## Review focus
`LoginPage.tsx` (the lazy import under `import.meta.env.DEV`) and `scripts/check-no-demo-accounts.mjs`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

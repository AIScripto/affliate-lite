# Wave 1 summary: Trust the pipeline and the tests

Run 2026-10-07_erp_quick · Plan: `fix-plan.md` · Status: **done on local branches, waiting for your approval**. Nothing pushed, no pull requests.
Both W1 branches start from `master`. W0 is not merged yet. They merge with the W0 branches without conflicts, and the merged result passes: backend **646** tests, frontend **2,353** tests, type-check clean.

## Findings

| ID | Status | Backend | Frontend |
|---|---|---|---|
| TST-001 No HTTP role-by-route tests | **fixed** | 4c59f7d | n/a |
| OPS-001 Stale `main` branch builds production images | **fixed in both repos**. Owner must also retire the branch (below). | 46bac01 | 0687517 |
| OPS-002 `latest` is the deploy default | **partly fixed**: tag builds no longer move `:latest` (repos). The compose and deploy-script part is a **patch for you** (not applied). | 46bac01 | 0687517 |
| OPS-003 Floating scanners, no dependency scan, login copied 8 times | **fixed**, except cutting the Docker variable names (needs you) | 46bac01 | 0687517 |
| DEP-001 Backend production vulnerabilities | **fixed**: 8 issues (1 critical) → 0 | 76b5039 | n/a |
| DEP-002 Frontend production vulnerabilities | **mostly fixed**: 11 → 9. axios and the router are fixed; what remains needs Tailwind 4 (separate) | n/a | 9e956b0 |

Also done (not a finding): frontend `npm run test:coverage` ran in watch mode and never exited. It is now a single run (dc48aff).
Not reproduced: none. Deferred: Tailwind 4 upgrade. Needing a decision: none new.

## Numbers

| | Before | After |
|---|---|---|
| Backend tests | 548 | **616** (646 together with W0) |
| Backend line coverage | 66.08% | **73.45%** (the routers and app wiring were at 0%) |
| Frontend tests | 2,334 | **2,345** (2,353 together with W0) |
| Frontend line coverage | 83.42% | 83.42% (unchanged, no app code changed) |
| Backend production vulnerabilities | 8 (1 critical, 3 high) | **0** |
| Frontend production vulnerabilities | 11 (7 high) | 9 (5 high, all Tailwind 3 build-time chain) |
| Type-check, lint errors | 0, 0 | 0, 0 |
| Builds | pass | pass |

## What the new tests protect

- **Public routes:** exactly 4 (health, login, refresh, public behavioral config). A fifth fails the build.
- **Unguarded routes:** 13 are listed with reasons (3 "any signed-in user" auth routes, 10 reports/improvement-plan routes from audit finding SEC-021). The list can only shrink: a new unguarded route fails, and fixing a listed one tells you to delete it from the list.
- **HTTP:** all 127 non-public routes answer 401 with no token and with a forged token. A deleted user gets 401. A role matrix (5 roles × 10 sensitive routes) checks who gets 403.
- **Pipelines:** parsed from the real YAML: only dev/staging/master/tags, every image pinned, dependency scan present and before any build, no manual Docker login, tag builds do not push `:latest`.

**Proof the tests can fail:** I broke the app on purpose and every breakage was caught, then restored: removing `authenticate` from reports, removing a permission guard, removing a role guard, adding an unguarded route (4 route breakages); and bringing back `main`, a floating scanner image, a skipped scan, `:latest` on a tag build, a manual login (5 pipeline breakages, backend; 3 on the frontend).

## What changed for you

- **Pushes to `main`** (if anyone does it) no longer build production images.
- **Tag builds** (`v1.2.3`) no longer overwrite `:latest`. The master build still does, so today's deploys behave the same.
- **Every pipeline** now runs a dependency scan after the quality checks. It fails only on **fixable** high or critical production vulnerabilities. Both repos pass it today. This scan can start failing in the future when a new CVE appears: that is its job, and you then update the package.
- **Scanners are pinned** to exactly what `latest` resolved to today (gitleaks v8.30.1, sonar-scanner 12.2), so nothing changes until you bump them.

## What I could not test

**None of the pipeline changes ran in a real Bitbucket pipeline.** The tests parse and check the file, and the trivy gate and the login script were run locally, but the first real run will be your first push to `dev` or `staging`. If something is off (for example the trivy image or the database download), it will show there. Both are one-line fixes.

## What only you can do

1. **Retire the stale `main` branch** and set the default branch in Bitbucket (OPS-001): the pipeline no longer builds from it, but the branch still exists.
2. **Decide on the compose and deploy-script patch** (OPS-002): `ops-002-workspace.patch`, with instructions in `ops-002-workspace-README.md`. It makes a release tag mandatory when deploying. It changes your deploy routine, so it is yours to apply.
3. **Tell me which Docker Hub variable names exist in Bitbucket** (OPS-003). The login script still accepts the old spellings, and once you confirm the real pair I will delete the others.
4. **After W0 is merged:** add `npm run check:no-demo` to the frontend pipeline (it only exists on the W0 branch). I will do it in the next wave.
5. Review, push, pull requests, merge, `npm version`.

## Things to know

- **Frontend audit not at zero:** 9 production findings remain: the Tailwind 3 chain (5 high, build-time only, shipped CSS is generated) and one React Router advisory that applies to server-side rendering, which this app does not use. The trivy gate ignores unfixable findings. A Tailwind 4 upgrade is a separate piece of work (visual risk: needs the browser matrix).
- **Dev dependencies** (jest and vitest chains) still have known issues: that is DEP-003 in W5.
- **Remediation log:** `REMEDIATION_LOG.md` exists only on the W0 branches. I did not add a second copy on the W1 branches, because both would conflict on merge. When W0 is merged I will add the W1 rows.
- I ran `npm audit fix --omit=dev`, which also pruned dev packages from `node_modules` on my machine (not from the lockfile). I restored them with `npm ci`; nothing in git was affected.

## Next

On approval, I can push the two W1 branches and give you the pull request links, the same way as W0. Then W2 (access control and sessions) is next. It starts with decision D1.

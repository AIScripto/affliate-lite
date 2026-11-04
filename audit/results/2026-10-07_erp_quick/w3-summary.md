# Wave 3 summary: make scores trustworthy

Run 2026-10-07_erp_quick · Branches: backend and frontend `fix/w3-score-integrity` (stacked on `fix/w2-access-sessions`).
Status: **done on local branches, waiting for your approval. Nothing pushed, no pull requests, version still 1.1.0.**
W2 is still on staging and has **not** been merged to master (waiting for your pipeline results). W3 must go after W2.

## Findings

| ID | Result | What changed |
|---|---|---|
| REL-001 | **Fixed** | A skill save and the score recompute are now one database transaction. If the recompute fails, the save is undone and the request fails. Before: the error was logged, the save stayed, scores were stale and the API still said 200. |
| REL-002 | **Fixed** | Saves for the same person run one after another (a per-person database lock). Checked on the dev database: a second save for the same person waited 800 ms; a save for another person did not wait. |
| PRF-001 | **Fixed** | A save recomputes only the skill area it touched, not all of them. Falls back to the whole person if the area is unknown. |
| DAT-002 | **Fixed** | "No data" is now `null`, not 0, in the executive summary (org and department rows). One rounding rule (half-up) for all report figures. The year-on-year report now scores skills the same way as the live scores and uses the configured "counts toward score" statuses. |
| DAT-003 (D4) | **Fixed** | The backend sends `ready_all_checks` and `near_ready` once per person. Screens read them. The client rules (`meetsAllChecks` logic, `isNearReady` with its 75%, the CEFR state fallback) are deleted. |
| DAT-001 | **Fixed** | AI Insights bars use their own percentage. "Ready People" no longer fills 3% for 3 of 12. The invented 18% minimum is gone. A count (Critical Gaps) has no bar. |
| DAT-004 | **Fixed** | The manager picker shows the employee code, not the database number. |

## Numbers

| | Before | After |
|---|---|---|
| Backend tests | 779 | **838** |
| Backend line coverage | 75.37% | **76.15%** |
| Frontend tests | 2,358 | **2,363** |
| Frontend line coverage | 83.87% | **83.89%** |
| Type-check, lint errors, build (both) | pass | pass |
| Production vulnerabilities (backend) | 0 | 0 |
| Local Sonar pre-check (backend, new lines) | n/a | 0 hits |
| Local Sonar pre-check (frontend, new lines) | n/a | 0 hits on new lines. It lists 8 "too complex" functions in files I touched; I did not change those function lines, so Sonar should not count them as new. The staging pipeline will confirm. |

## Proof

- 31 new atomicity tests, all failing before the change (one transaction, lock first, recompute with the same transaction, failures propagate, audit row inside the delete transaction).
- 4 new report tests failing before (null for no data, half-up rounding, YoY status and score rules).
- **Score regression check on your dev database** (rolled back, nothing written): 53 people, 731 score rows, before and after the change identical (0 differences).
- **YoY check on the dev database** (read-only): for the latest period, the YoY score equals the live score for 30 of 30 people who have data.
- **Browser check** (real Chrome against the dev server, API answers faked, no login to your database): Health Overview shows "Not assessed" with no bar for a department with no data; "Promotion Ready 1 / 14" comes from the backend field; AI bars drew 62%, 75%, 25% and none on Critical Gaps. No page errors. Screenshots deleted.

## What users will notice

- **Everyone:** a department with nobody assessed now says "Not assessed" instead of 0%. The AI dashboard bars match their numbers.
- **Managers:** saving an assessment is slightly stricter: if the score update fails, they get an error and can try again (before, it looked saved but scores were stale).
- **Reports:** a number that sat on a rounding tie (for example 0.45 shown as 0.4) may now show 0.5. The YoY figure for an old period can move if a skill's stored score was 0.

## Things to decide or check

1. **Deploy order: backend first, then frontend.** The new frontend needs `ready_all_checks`, `near_ready` and `cefr_state` from the backend. An old backend would show everyone as "not ready".
2. **Not done (open):**
   - A person whose real exact score is 0 counts as "not assessed" in the executive summary (the rule is `overall_score > 0`).
   - The Gap Matrix "ready" filter is still technical-only (that report has no CEFR or behaviour data).
   - About 50 other `Math.round` calls and a lint rule against them (4 cited files were converted).
   - The "Critical Gaps" tile on the AI page has no bar by design.
3. The manager picker label (DAT-004) is covered by a unit test only; I did not open that modal in the browser.

## Next
On your approval: push W3 to staging after W2 is merged to master (or stacked on top, as with W2). Then W4 needs your decision D6 and an approved migration plan.

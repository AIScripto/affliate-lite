# Audit items left or partly left (as of 2026-10-14)

Run: 2026-10-07_erp_quick. One file per item with the reason it was left, what could go wrong, when to revisit, and what is needed.

| ID | Title | Severity | Status | Needs from you |
|---|---|---|---|---|
| [CDH-001](CDH-001.md) | Five files hold about 6,800 lines of tangled logic | Medium | Left on purpose | None. It is optional. |
| [CDH-002](CDH-002.md) | Hard-coded colours are widespread (197 hex, 76 rgb, 415 raw Tailwind classes) | Low | Closed as controlled | A design decision on the new tokens, only if you want the cleanup. |
| [DEP-002](DEP-002.md) | Frontend production dependencies have known vulnerabilities | Medium | Done, except two parts left on purpose | None now. |
| [DEP-003](DEP-003.md) | Development tools have known vulnerabilities | Low | Done, small remainder | None. |
| [PRF-002](PRF-002.md) | Report endpoints compute everything on every read, with no pagination or cache | Medium | Closed as measured, no code change | None. |
| [SEC-013](SEC-013.md) | Account lockout can be triggered by anyone and re-locks after one wrong try | Medium | Done, extra rules only if needed | None. |
| [DAT-010](DAT-010.md) | Backup scripts leave dumps in /tmp, with no retention or encryption | Medium | Mostly done; backup task and one decision left | D3: retention period (30 days proposed). |
| [OPS-005](OPS-005.md) | Images are published under a personal Docker Hub account | Medium | Waiting for your decision (D2) | D2: which registry. |
| [UXD-002](UXD-002.md) | The whole app is one URL; no deep links or Back button | Medium | Waiting for your decision (D5) | D5: yes or no. |
| [DAT-005](DAT-005.md) | Appraisal history is not real (W4b: migration B) | High | Mostly done; migration B left on purpose | D6 and your go-ahead for migration B. |
| [SEC-006](SEC-006.md) | ADMIN and TOP_MANAGEMENT can approve their own skills and CEFR results | Medium | Fixed; old rows left by decision | None. |

## Other things left on purpose (no separate item ID)
- Audit-log password-hash scrub: deferred (owner decision 2026-10-08).
- Git history: left as is, the passwords were already changed (owner decision 2026-10-08).
- Demo accounts: removed from the code only (owner decision 2026-10-08).
- Repo seed uses old-style assessment levels (7 levels, `Unset` 0, no `Intermediate`), unlike production. Does not affect production scoring. Small todo.
- Local real-data dumps on the owner's machine: optional cleanup.
- SonarLint in VS Code: owner to install and connect it.

## Rule that applies to every item here
No change may touch the tested scoring formulas. If a fix seems to need it, stop and ask first.

Written from the audit records and the work of 2026-10-07 to 2026-10-14. Not part of `/documentation`.

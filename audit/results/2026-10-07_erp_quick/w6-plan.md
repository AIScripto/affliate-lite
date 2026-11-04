# Wave 6 plan: UI quality and maintainability

Base: `master` (W0 to W3 and W5 part 1 included). Version stays 1.1.0. No database migrations in this wave.
Rules as before: tests first (fail before, pass after), no change to scoring or results, type-check, lint, tests, build in both repos, browser check for every UI change, Sonar pre-check before any push, nothing pushed without your approval.

## Order (low risk first, each step is its own commit and can be stopped)

| Step | Findings | What changes | Who notices | Risk |
|---|---|---|---|---|
| **W6a** Keyboard and screen readers | A11-001, A11-002 | Confirm dialog: no global Enter key, proper dialog role, safe button focused first. Modal and SidePanel: focus moves in, stays in, and returns to the button that opened it. Hand-built overlays (8 files) move onto the same pieces. Form labels linked to their fields. | Keyboard and screen-reader users. Mouse users see no change. | Low to medium (focus code is easy to get subtly wrong, so each piece gets tests and a browser check) |
| **W6b** Load time | PRF-003 | Reports, Setup, AI Insights and Bulk Assessment load on demand. Chart library in its own chunk. Remove the unused `d3` dependency. | Faster first load. A short "loading" state when opening a big screen for the first time. | Low |
| **W6c** Colours | CDH-002 | Colours in `types/*.ts` and `designSystem.ts` move to the design tokens; a check lists any new raw colour. | Nothing visible if done right (checked in light, dark and midnight themes). | Low to medium (visual) |
| **W6d** Help | UXD-001 | A Help button and modal on the 6 dashboard tabs, the 4 report tabs without one, and the 42 Setup screens (your own rule, STANDARDS 5e). A check that every tab has one. | Everyone: a "?" on each screen. | Low, but the most content to write (about 50 short help texts) |
| **W6e** Backend tests | TST-002 | Tests for communication, reports controller, report data and AI fallback paths. No code change. | None. | None |
| **W6f** Code structure | CDH-001 | Split the 1,739-line config service and the other four big files into per-feature modules; shared check for `:id` params (a non-number id gives a 500 today, it should give a 400). Frontend: split `useConfig`, `BulkAssessmentTable`, `AIInsightsTab`. Behaviour stays the same; the test suite must stay green at every step. | None, except bad ids now get 400. | Medium (large move, so done last and in small steps) |
| **W6g** Deep links | UXD-002 | Real URLs per screen, Back button, return to the page after login. | Everyone. | Medium to high. **Needs D5.** |
| **W6h** Real end-to-end tests | TST-003 | 3 flows against a seeded test backend in CI (engineer saves a skill, manager approves, report shows it) plus 403 checks. | None. | Needs a CI decision (see below). |

## Decisions I need

- **D5, deep links (W6g).** Should the app get a real URL for each screen, so people can bookmark, share a link, and use the browser Back button? My recommendation: **yes, but after W6a to W6f**, because it touches the dashboard state and every screen's entry. It can be a separate wave if you prefer.
- **W6h (CI with a real backend).** Needs a seeded test database in the Bitbucket pipeline. That is pipeline work and your call on cost and time. My recommendation: skip for now and run it locally as a documented script first.
- **Start order.** My recommendation: W6a, W6b, W6e, W6c, W6d, then W6f; W6g and W6h only when you decide.

## Not in this wave
Tailwind 4 upgrade and DEP-003 (dev-tool vulnerabilities) stay in the separate dependency pull request. The migrations (W4) are still on hold.

# CDH-002 plan: hard-coded colours, step by step (draft for the owner, 2026-10-14)

Nothing here is started. Colour only: no scoring file is involved. Each chunk is small, tested locally first, and pushed only after the owner has seen the screenshots and says go.

## What the analysis found (479 raw colours, 75 files)

| Group | Files | Raw colours | Decision |
|---|---|---|---|
| A. Level and status colour maps (`types/communication.ts`, `types/behavioral.ts`) | 2 | 72 | Convert last, after design sign-off. The colour carries meaning. |
| B. PDF / print (`pdfGenerator.ts`) | 1 | 38 | **Keep.** Print has no CSS variables. |
| C. Setup screens | 20 | 148 | Mostly convert. Exceptions below. |
| D. Reports | 14 | 78 | Convert carefully (status colours). |
| E. Dashboard and team roster | 13 | 49 | Convert. |
| F. Assessment screens | 8 | 40 | Convert. |
| G. Shared UI pieces | 12 | 37 | Convert early (small, but used everywhere). |
| H. Other (login hero, formatters, dialogs) | 5 | 19 | Convert, but dialog scrims stay. |

**Keep on purpose (about 100 of the 479):** PDF (38); the colour-picker palettes that users choose from in `SkillDomainsSection` (18 hex) and `CategoriesSection` (13 hex), which are data, not styling; black scrims and drop shadows on dialogs and selects (`rgba(0,0,0,..)`).
**Realistic target:** about 380 colours in about 55 files, in 7 chunks.

Tokens that exist today: `accent*`, `success*`, `warning*`, `danger*`, `border*`, `text-1/2/3`, `surface`, three `pillar-*`. Missing, to add first (no visual change): a dark panel (surface, border, text), a scrim colour, and a neutral for the level scale if the design wants one.

## Chunks (each ends with a push only after your go)

**Chunk 0. Test harness, no product change.**
- A local script that opens every screen (the 36 from the real-API suite) in light and dark mode and saves screenshots to a folder outside git, on a throwaway database with CEFR loaded.
- Add a contrast check (axe) on the same screens.
- Output: the "before" set. Exit: before-set reviewed by you.

**Chunk 1. Tokens only (invisible).** Add the missing tokens in `index.css` and `tailwind.config.ts`, no usage yet. Exit: all tests pass, screenshots identical to the before-set.

**Chunk 2. Shared UI pieces (G, H).** `ToastContainer`, `InfoTip`, `GradientIcon`, `Badge`, `IconBadge`, `SkillTile`, login hero, `formatters.ts`. Each is used in many places, so screenshots cover all screens. Exit: before/after differ only by tiny shade changes you approve.

**Chunk 3. Setup, easy part (C).** `ConfigSection`, `CefrLevelsBandsTab`, `CefrPromotionGatingTab`, `LineManagerAccessPanel` and the other small Setup files. Admin only, no scores.

**Chunk 4. Setup, dark panel (`CefrDocumentationTab`, 39).** Uses the new dark panel tokens. Check light and dark.

**Chunk 5. Dashboard and assessment screens (E, F).** `TeamRoster`, `UserProfileMenu`, dashboard cards, `BehavioralAssessmentModal`, `BulkAssessmentTable`, hero layout.

**Chunk 6. Reports (D).** `ActionableGapsTable`, `YoYGrowthTab`, result sheet gauge and lists. Status colours: same meaning, check contrast.

**Chunk 7. Level and status maps (A).** Only after you approve the new level colours. Last, because the colour is the message.

## Test steps for every chunk (local, before any push)
1. Unit tests and type check: all pass, scoring tests unchanged.
2. `npm run check:colors -- --update` lowers the baseline (only down).
3. Screenshot the touched screens in light and dark mode, side by side with the before-set. You review.
4. Contrast check: no new failures.
5. Real-API suite (22 tests) passes.
6. Commit locally. Push only after your explicit go-ahead.

## Rollback
One commit per chunk. Undo with `git revert <commit>`. The image is rebuilt and the VM goes back with `./deploy.sh rollback`. Colour changes never touch data.

## Effort (rough)
Chunk 0: about 0.5 day. Chunks 1 to 3: about 1 day. Chunks 4 to 6: about 2 days. Chunk 7: 0.5 day plus design sign-off. Total about 4 days if done in one stretch.

## When to do it
Best done when branding is decided (the new palette would then feed the tokens in chunk 1). Chunk 0 can start any time.

## Update 2026-10-14
Chunks 0 to 6 are done locally (branches `chore/cdh-002-chunk0..6`), raw colours 479 -> 297. Not pushed. A full screenshot comparison (all inner tabs, 3 themes) runs once at the end. Small leftovers and decisions are in `CDH-002-snags.md`. Chunk 7 (level colour maps) waits for design sign-off. The admin-chosen colours are handled with branding (snags #7).

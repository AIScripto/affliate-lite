# CDH-002 snags: small colour issues to fix later (kept short on purpose)

Working mode agreed 2026-10-14: do all chunks with quick checks, then one full screenshot comparison at the end. Small issues found on the way are listed here instead of stopping work.

| # | Where | What | Size |
|---|---|---|---|
| 1 | `ui/SkillTile.tsx` | Shadows use `rgba(var(--danger),0.15)` with a space-separated triplet (`185 28 28`). That is not valid inside `rgba()` with a comma, so the coloured glow probably does not draw. Fix: `rgb(var(--danger) / 0.15)`. Needs a look at the tile first. | small, visual |
| 2 | `ui/ToastContainer.tsx`, `ui/GradientIcon.tsx` | The info toast and some icon gradients use sky and blue directly. Needs an "info gradient" decision. | decision |
| 3 | `lib/formatters.ts` `getReadinessStatus` | Emerald and slate badge classes. Left alone because the file also holds rounding helpers (scoring-adjacent rule). Convert only with your go-ahead. | small |
| 4 | `ui/IconBadge.tsx` (info variant) | Now uses the shared info blue (sky-600) instead of blue-500. Not on a recorded screen. | check |
| 5 | `config/access/LineManagerAccessPanel.tsx` | Teal-to-violet header gradient and the white chips on it left as they are (brand gradient, wait for branding). | wait |
| 6 | InfoTip icon, Setup search placeholder | Now a bit darker in light mode (muted-text token). Better contrast; approve in the final comparison. | approve |
| 7 | `SkillDomainsSection`, `CategoriesSection` (31 hex) | Admin-chosen colours (16 presets) saved in the database as hex. Kept on purpose. **Do with branding: option C first.** Offer the brand palette in the picker, and map any old saved colour to the nearest palette colour on display. No database write, easy to revert. Option B (overwriting the saved values) only later, with a backup and your explicit go-ahead; production data is never overwritten as a style fix. | with branding |
| 8 | Same two screens | Contrast check: pale presets (yellow `#ca8a04`, lime `#65a30d`) next to text may be hard to read. Check once, separately from the colour cleanup. | small check |

Decision 2026-10-14 (owner): go with the recommendation above.
| 9 | `styles/globals.css` `.alert-danger`, `.alert-warning`, `.alert-success` | Same dead line as the info alert had: `border-left-color` is written before `border-color`, so the shorthand overrides it and the solid left accent bar never shows (Sonar css:S4657, older code, not counted). The info alert's dead line was removed with no visual change. Fixing the other three by putting `border-left-color` AFTER `border-color` would make the left bar appear on every danger, warning and success alert: a visible design change, so it needs your decision. | decision |

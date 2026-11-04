# UX and Visual Design Standard (Enterprise Pro-Level Application)
**Finding ID prefix:** UXD
**Applies when:** There is a user interface (web, desktop, or mobile app). Evaluates mission-critical enterprise workflows, data density, Calm Ledger visual hierarchy, layout containment, and interactive ergonomics.

---

## 1. Goal & Philosophy

Evaluate whether the user interface matches the standard of a **tier-1 pro-level enterprise application** (e.g. Linear, Stripe Dashboard, Modern Affiliate Tracking Platforms). 

Financial, operational, and management staff spend 8+ hours a day inside this software. The interface must be:
- **Calm & Unobtrusive:** Restrained palettes, zero decorative neon gradients, zero 3D gimmicks, subtle 1px structural rules, and flat presentation.
- **Densely Informative:** 32px standard control heights, 36px table rows, compact summary tiles (~64px–72px), and high information-to-ink ratios.
- **Accurate & Monospace Aligned:** All monetary amounts, account codes, SKU numbers, quantities, and dates use tabular monospace figures (JetBrains Mono) and are right-aligned.
- **Zero Scroll-Trapping:** Smooth vertical scrolling, 100% viewport fit on standard laptop screens (768px–900px), with no outer `overflow: hidden` clipping.
- **Master-Detail Non-Destructive:** Detail views render in overlapping slide-over drawers (`Drawer.tsx`, size `lg`/`xl`), keeping underlying grids 100% wide and intact.

---

## 2. Deep Audit Checklists by Capability

### A. Screen Anatomy, Density & Viewport Containment
- [ ] **Laptop Screen-Fit Standard (768px–900px Viewports):**
  - Does the overview dashboard and top-level workspaces fit on common laptop displays without vertical sprawling?
  - Are summary KPI tiles sleek and compact (~64px–72px height)?
  - Are chart plot heights proportional (~180px–190px) rather than excessively tall (300px+)?
  - Is internal padding kept tight (8px–12px) to prevent unnecessary white-space sprawl?
- [ ] **No Scroll-Blocking Outer Containers:**
  - Are outer page shells free of rigid `overflow: hidden` that clips lower cards, tables, or buttons off-screen?
  - Is smooth vertical scrolling (`overflow-y: auto`) guaranteed when viewport height is constrained?
- [ ] **Responsive Viewport Containment:**
  - Do wide line-item tables scroll horizontally with smooth indicators while freezing key identification columns (Item Code / Account Code via `position: sticky; left: 0`)?
  - Are toolbars wrapped cleanly with flex wrap rather than overflowing or stacking awkwardly?

---

### B. Master-Detail Architecture & Slide-Over Drawers
- [ ] **Slide-Over Drawer Standard (`DocumentDetailPanel`):**
  - Do document and transaction detail inspections (Vouchers, Purchases, Sales, Transfers, Adjustments, Returns, Logs) render in a standardized elevated slide-over `Drawer` (`size="lg"` / `xl`) over a backdrop scrim?
  - Is the underlying list table preserved at 100% width rather than squished into an unreadable side-by-side split view?
  - Inside the drawer, do line item descriptions, SKU codes, quantities, and rates render in full un-truncated width?
- [ ] **7-Part Document Detail Anatomy:**
  1. **Descriptive Top Heading:** Clear document title (e.g., `Voucher Details`, `Purchase Invoice Details`, `Stock Transfer Details`, `Audit Log Details`), never just a bare raw ID.
  2. **Standard Header Actions:** Edit Draft icon button (when editable), Print icon button, and Close button (`IconX`).
  3. **Structured Metadata Grid (`DetailFields`):** Document No, Date, Type, Status badge (`StatusChip`), Parties, Locations, References.
  4. **Clean Line Items Table (`DetailLinesTable`):** Standard columns (`No.`, `Item Code` / `Account Code`, `Description` / `Account Name`, `UOM` / `Debit`, `Quantity` / `Credit`, `Unit Price` / `Rate`, `Total Amount`).
  5. **Right-Aligned Totals (`DetailTotals`):** Totals neatly aligned to the right.
  6. **Lifecycle Guidance Note (`DetailNote`):** Explaining Draft, Posted, Reversed, or Cancelled state.
  7. **Bottom Action Footer (`DetailActions`):** Action buttons (Post, Edit Draft, Reverse, Cancel) docked at the bottom of the drawer, never placed as raw top banners.

---

### C. Master Filter Toolbars & Search Controls
- [ ] **SearchableSelect Dropdown Standard:**
  - Do list filter toolbars (Status, Direction, Business Type, Warehouse, Category, UOM Type, Operator) use searchable dropdowns (`SearchableSelect`) rather than segmented button rows (`SegmentedControl`) or native browser `<select>`?
  - Are segmented controls (`SegmentedControl`) restricted solely to binary view toggles (e.g. Analytics vs Explorer)?
- [ ] **Filter Alignment & Layout Stability:**
  - Do filter bars use standard `.filter-bar > .filter-grid` layouts so controls align horizontally with consistent height (32px)?
  - Are inputs and select triggers prevented from stacking awkwardly into 1-column mobile layouts on wide screens?

---

### D. Typography, Numbers & Monospace Financial Discipline
- [ ] **Dual-Font System:**
  - Is all UI prose and navigation text rendered in clean sans-serif (**Poppins** / `var(--font-sans)`)?
  - Are all numbers, currencies, account codes, document numbers, SKU codes, and quantities rendered in monospace (**JetBrains Mono** / `var(--font-mono)` with `font-variant-numeric: tabular-nums`)?
- [ ] **Right-Aligned Numeric Figures:**
  - Are debit amounts, credit amounts, balances, totals, unit prices, and quantities strictly right-aligned in tables and cards?
  - Are column headers for numeric data right-aligned to match the data cells below them?
- [ ] **12px Floor Rule:**
  - Is readable user text strictly kept at 12px or larger (`var(--font-size-xs)` / `var(--font-size-2xs)`)? No 10px or 11px illegible text.
- [ ] **Sentence & Title Case Consistency:**
  - Are buttons, labels, and table headers formatted in Title Case ("Sales Price", "Account Name", "Save Voucher")?
  - Are error descriptions and system instructions formatted in Sentence case? No all-caps shout headings.

---

### E. Data Visualization & Analytics Standards
- [ ] **Flat 2D Calm Ledger Presentation:**
  - Are charts strictly rendered in clean, modern 2D flat aesthetics (`variant="flat"`) using the design token palette?
  - Are awkward 3D styles, faux gradients, and confusing spiderweb/radar charts eliminated in favor of standard flat column charts, bar charts, and donut charts?
- [ ] **Zero Fabricated or Invented Numbers:**
  - Are all charts, summary tiles, and graphs dynamically derived from live database records?
  - When data is absent, does the UI show a clean "No data recorded" state rather than fabricated dummy statistics?
- [ ] **Chart Cards & Header Standard:**
  - Does every chart container render inside a standardized `ChartCard` with descriptive title, explanatory subtitle, action slots (e.g. Table View / CSV Export), and `HelpButton`?

---

### F. Executive AI Copilot & Decision Windows
- [ ] **Global Header Launch:**
  - Can executive leadership trigger the Executive AI Copilot (`ExecutiveAiDrawer`) directly from the top navigation bar (`AppHeader`) from any screen in the system?
  - Is the launcher appropriately restricted to authorized roles (Admin & Top Management)?
- [ ] **Dedicated Command Center (`/executive-ai`):**
  - Does the full-screen AI workspace provide an instant multi-factor health pulse, critical anomaly alerts, strategic inquiry prompt pills, and interactive tabular analysis?
  - Are responses structured with executive synthesis narrative, metric badges, live ledger tables, and actionable management recommendations?

---

### G. State Handling, Feedback & Consequence Protection
- [ ] **Loading States & Zero Layout Shift (CLS):**
  - Do data tables display multi-row skeleton loaders (`TableSkeleton`) matching the exact column count and row height of the target table?
  - Are full-screen layout shifts eliminated during data fetching?
- [ ] **Error Recovery vs. False Empty States:**
  - Do API query failures display an informative error row (`TableMessageRow tone="danger"`) with a clear explanation and a "Retry" button, rather than masquerading as "No records found"?
- [ ] **Consequence Protection (`ConfirmDialog`):**
  - Are irreversible or ledger-affecting mutations (Approve Voucher, Post Voucher, Reverse Document, Cancel Draft, Delete Master Data) guarded by an explicit `ConfirmDialog` summarizing document number, date, and monetary impact?

---

### H. Accessibility & Design Tokens
- [ ] **Accessible Field Associations:**
  - Does every form input link to a `<FieldLabel htmlFor="...">`?
  - Are validation errors linked via `aria-invalid` and `aria-describedby`?
- [ ] **Keyboard & Focus Trapping:**
  - Do all modal dialogs and slide-over drawers trap focus (`useDialogFocus`), handle the `Escape` key, and return focus to the trigger button upon dismissal?
- [ ] **Zero Raw Colour Literals:**
  - Does `npm run check:colors` pass with 0 violations across all components?
  - Are semantic tokens used exclusively (`var(--color-primary)`, `var(--color-surface)`, `var(--color-border)`, etc.)?
  - Is full visual parity maintained across both Light (`html.affliate` / `light`) and Dark (`html.affliate.dark` / `dark`) themes with WCAG 2.1 AA (4.5:1) contrast?

---

## 3. How to Gather Evidence & Audit Scoring

1. **Browser Walkthrough:** Inspect document modules (Purchases, Sales, Transfers, Adjustments, Vouchers, Reports, Audit Logs, Executive AI) at 1280px, 1440px, and 1920px viewports.
2. **Viewport Stress Test:** Test on a 1280x800 and 1366x768 viewport to ensure zero scroll clipping, proper drawer sliding, and single-screen fit for dashboards.
3. **Automated Guard Checks:** Run `npm run check:colors`, `npm run lint`, and accessibility automated checks.
4. **Interactive State Verification:** Deliberately throttle the network to verify skeleton loaders, trigger API errors to test error recovery banners, and test `ConfirmDialog` modal interactions.

# 04 - Frontend Definition of Done (DoD) & UI Audit Skill (Antigravity IDE)

## Skill Purpose
This executable skill governs the quality, visual parity, interactivity, and client-customization compliance of the `/frontend` React + Vite + Tailwind CSS application in Antigravity IDE.

---

## 1. Build, Type & Zero-Placeholder Gates
- [ ] **Zero TypeScript/Build Errors:** `npm run build` (`tsc -b && vite build`) and `npm run lint` complete with `0` errors and `0` warnings.
- [ ] **Zero Unwired Buttons:** Every button in the UI (`Switch Theme`, `Add Publisher`, `Add Domain`, `Add Network`, `Add Offer`, `+` / `-` Affiliate assignment buttons, macro insertion pills, Copy URL buttons, and Table Action icons) is wired to a working state/API handler with toast feedback.
- [ ] **No Excluded Legacy Bloat:**
  - Sidebar does **NOT** render `Notifications` (`[07:30]`).
  - `Add Publisher` form does **NOT** render `Publisher Type`, `Offers`, or `PostBack` inputs (`[01:52]`–`[02:03]`).
  - `Add Network` form replaces the legacy `Software` dropdown with a free-text `Contact Details` input (`[03:06]`).
  - Dashboard renders the **30-Day Traffic Statistics chart at 100% full width** and omits `Affiliate panel`, `Affiliates info`, and `Top Affiliates and Offers` (`[00:47]`–`[00:56]`).

---

## 2. Screen-by-Screen UI & Functional Audit Checklist

### A. Dashboard (`/dashboard`)
- [ ] Displays Date Range Picker, 4 KPI Cards (`Clicks`, `Conversions`, `Payout`, and `EPC` with interactive `USD` Currency Switcher).
- [ ] Renders 100%-width `Traffic statistics for the last 30 day` interactive chart with hover tooltip (`Date`, `Total Conversions`, `Clicks`, `Total Profit`, `Total Income`).
- [ ] Renders bottom 2-column `Offers` and `Publishers` scrollable tables automatically sorted by `Conversions DESC, Clicks DESC` (`[01:04]`).

### B. Publishers (`/publishers`), Domains (`/domains`), Networks (`/networks`)
- [ ] Top-right green `Add [Entity]` button smoothly toggles the creation form panel.
- [ ] Submitting an empty required field displays `"Please fill out this field."` (`[01:55]`, `[02:36]`, `[03:03]`).
- [ ] Toggling a Publisher's status to `Inactive` displays a clear confirmation dialog and unassigns their active offers (`[02:20]`).
- [ ] DataTables support `Show [10/25/50] entries`, live debounced `Search:`, sortable columns, and pagination.

### C. Offers & 5-Tab Builder (`/offers`, `/offers/new`, `/offers/:id/edit`)
- [ ] **General Tab:** Supports `Name *`, `Advertiser *`, `Visibility` (`Public`, `Private`, `Requires approval` with warning note), and `Status` (`Active`, `Paused`, `Disabled`).
- [ ] **Tracking & Controls Tab:** Clicking `{clickid}`, `{aff_id}`, `{offer_id}`, or `{sub_id}` macro pills inserts the token into `Base destination URL`.
- [ ] **Targeting Tab:** Multi-select pills for `Devices` (`All`, `PC`, `Android`, `iOS`, `Tablet`) and `Countries` with `AND`/`OR` toggle.
- [ ] **Affiliates Tab:** Dual-column `All affiliates` and `Enabled affiliates` lists with working search and instant `+` (assign) and `-` (revoke) buttons (`[05:24]`–`[06:20]`).
- [ ] **Postbacks Tab:** Displays copyable Global Postback URL (`https://{domain}/postback?clickid={clickid}`) with customizable clickid macro input (`[06:28]`).
- [ ] **Revenue & Payouts Tab:** Captures `CPA (Fixed)`, `Currency`, `Revenue` (e.g., `150`), and `Payout` (e.g., `100`) and displays the live profit spread (`[07:02]`–`[07:20]`).

### D. Reports (`/reports/networks`, `/reports/offers`, `/reports/publishers`)
- [ ] All 3 report views include Date Range filter, Search box, grouped `Conversions (Approved | Unchecked | Total)` headers where applicable, enriched columns (`Offer Name`, `Clicks`, `EPC`, `Payout`), and bold footer summary totals (`[07:35]`–`[08:25]`).

---

## 3. Impeccable Visual & Accessibility Audit Protocol
1. **Theme Polarity Test:** Click `Switch Theme` in the top navbar and verify every card, table header, input, badge, and chart legend remains legible with WCAG AA contrast (`>= 4.5:1`) in both Dark and Light modes.
2. **Responsive Overflow Check:** Inspect at `1440px`, `1024px`, and `768px` viewports. Data tables must wrap inside `overflow-x-auto` containers without causing horizontal page scroll.
3. **Tabular Numerals & Alignment:** Verify all numeric columns (`Clicks`, `Conversions`, `Payout`, `EPC`) apply `tabular-nums` and right/center alignment consistently with their headers.
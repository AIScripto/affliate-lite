# 01 - UI/UX Design System & Impeccable Audit Specification

## 1. Visual Identity & Theme Polarity
The application blends **Oval Media's clean, dark-mode administrative shell** (`zshe.panel.7tracking.com`) with **Max Wave's high-contrast analytics cards, dual-list selectors, and multi-tab forms** (`offers-maxwave.affise.com`), while supporting the top-right **`Switch Theme`** toggle (`Dark Mode` default + `Light Mode`).

### 1.1 Tailwind CSS Color Tokens (`tailwind.config.ts` / CSS Variables)

| Token Role | Dark Mode (Default - Observed) | Light Mode (`Switch Theme`) | Tailwind Utility Mapping |
| :--- | :--- | :--- | :--- |
| **App Canvas Background** | `#181924` (Deep Slate Navy) | `#F4F6FA` (Cool Alabaster) | `bg-canvas` |
| **Surface / Card / Sidebar** | `#212332` (Elevated Charcoal) | `#FFFFFF` (Pure White) | `bg-surface` |
| **Surface Elevated / Input** | `#282A3C` (Input / Table Header) | `#F8FAFC` (Slate 50) | `bg-surface-elevated` |
| **Border / Divider** | `#2E3248` (Subtle Hairline) | `#E2E8F0` (Slate 200) | `border-subtle` |
| **Primary Brand Accent** | `#6C5CE7` / `#7C3AED` (Purple) | `#6D28D9` (Violet 700) | `bg-primary` / `text-primary` |
| **Success / Add Action** | `#2ECC71` / `#28A745` (Emerald) | `#16A34A` (Green 600) | `bg-success` (`Add Publisher` button) |
| **Info / Edit / Tag Chip** | `#007BFF` / `#2563EB` (Royal Blue) | `#2563EB` (Blue 600) | `bg-info` (Multi-select pills & Edit icon) |
| **Warning / Pause Action** | `#F39C12` / `#EAB308` (Amber) | `#D97706` (Amber 600) | `bg-warning` |
| **Danger / Delete / Block** | `#E74C3C` / `#EF4444` (Crimson) | `#DC2626` (Red 600) | `bg-danger` |
| **Text Primary** | `#F1F5F9` (Crisp White-Slate) | `#0F172A` (Slate 900) | `text-fg` |
| **Text Secondary / Muted** | `#94A3B8` (Muted Cool Grey) | `#64748B` (Slate 500) | `text-fg-muted` |

---

## 2. Typography & Spacing Scale
- **Font Family:** `Inter, system-ui, -apple-system, sans-serif` for UI and tables; `JetBrains Mono, monospace` for Postback URLs, Click IDs, and Tracking Macros (`{clickid}`).
- **Scale:**
  - Page Header Title (`Dashboard`, `Publisher`, `Offer`): `text-xl font-semibold tracking-tight text-fg`
  - KPI Metric Value (`68`, `$ 750.00`, `190`): `text-3xl font-bold tabular-nums text-fg`
  - Card / Section Title (`Offers`, `Publishers`, `Core information`): `text-base font-semibold text-fg`
  - Table Header & Form Label: `text-xs font-semibold uppercase tracking-wider text-fg-muted`
  - Table Cell & Input Text: `text-sm font-normal text-fg`

---

## 3. Core Reusable Component Specifications

### 3.1 App Shell (`AdminLayout.tsx`)
- **Left Sidebar (`w-64 fixed inset-y-0 left-0 bg-surface border-r border-subtle`):**
  - Top Brand Header: Purple heart/shield logo + `Oval Media` title (`[00:01]`).
  - User Profile Block: Avatar icon, username dropdown (`adren v`), and subtitle email (`zeeshan@gmail.com`).
  - Section Divider: `- ADMIN` uppercase muted label.
  - Navigation Links (`Dashboard`, `Publishers`, `Domain`, `Network`, `Offers`, expandable `Report` -> `Networks`, `Offers`, `Publishers`, and `Log Out`). Note: `Notifications` is omitted per client directive at `[07:30]`.
- **Top Navbar (`h-16 bg-surface border-b border-subtle px-6 flex items-center justify-between`):**
  - Left: Hamburger sidebar collapse toggle (`[00:04]`).
  - Right: `Switch Theme` button (`px-3 py-1.5 rounded bg-surface-elevated text-xs font-medium border border-subtle hover:border-primary transition`).

### 3.2 DataTables Component (`DataTable.tsx`)
Matches the exact table anatomy observed across `Publishers`, `Domain`, `Network`, `Offers`, and `Reports`:
- Top Control Bar: Left `Show [10 | 25 | 50 | 100] entries` select dropdown; Right `Search: [________]` debounced input (`300ms`).
- Table Grid: Bordered cells (`border border-subtle`), sortable column headers with dual up/down sort chevrons, `tabular-nums` alignment for numeric metrics (`Clicks`, `Conversions`, `Payout`, `EPC`).
- Bottom Pagination Bar: Left `"Showing X to Y of Z entries (Total: N)"`; Right `[Previous] [1] [Next]` pagination buttons.

### 3.3 Action Icon Button Group (`ActionButtons.tsx`)
Observed in `Publishers`, `Domain`, `Network`, and `Offers` tables (`[02:05]`, `[02:35]`, `[02:56]`):
- Square icon buttons (`w-8 h-8 rounded flex items-center justify-center text-white transition hover:opacity-90`) with tooltips:
  - **Edit:** Amber/Yellow (`bg-amber-500`) or Blue (`bg-blue-600`) with pencil/edit icon.
  - **Toggle Status (Active / Pause / Inactive):** Green/Purple toggle icon (`bg-emerald-500` or `bg-indigo-600`).
  - **Delete:** Red (`bg-rose-500`) with trash/ban icon + confirmation modal.

---

## 4. Impeccable UI Audit Matrix
1. **Zero Layout Shift (CLS = 0):** All KPI cards, tables, and the 30-day chart render fixed-dimension `animate-pulse` skeletons while `isLoading` is true.
2. **Tabular Numerals:** Every metric card, currency figure, conversion count, and timestamp uses `font-variant-numeric: tabular-nums` (`tabular-nums`) for vertical alignment.
3. **Interactive State Completeness:** Every control implements `default`, `hover:`, `focus-visible:ring-2 focus-visible:ring-primary`, `active:scale-[0.99]`, and `disabled:opacity-50 disabled:pointer-events-none`.
4. **Native Validation Parity:** Required inputs display crisp inline error states (`border-danger text-danger`) with `"Please fill out this field."` matching the video (`[01:55]`, `[02:36]`, `[03:03]`).
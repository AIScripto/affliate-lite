# 02 - Max Wave Screens & Workflows Specification

## 1. Screen Inventory (Extracted & Adapted from Max Wave)
While the outer navigation shell uses Oval Media's sidebar, the client explicitly directed that the **Dashboard widgets** and the **Offer Management module** incorporate Max Wave's (`offers-maxwave.affise.com`) feature set.

---

## 2. Screen-by-Screen Functional Breakdown

### Screen 1: Unified Analytics Dashboard (`/dashboard`)
**Video References:** `[00:01]`–`[01:22]` (Synthesizing Oval Media `[00:09]` with Max Wave `[00:32]`–`[00:56]`).

#### A. Header & Filter Bar
- Breadcrumb: `Home > Dashboard`
- Date Range Picker (`[00:08]`): Calendar button displaying active range (e.g., `October 1, 2026 - October 22, 2026`) with presets (`Today`, `Yesterday`, `Last 7 Days`, `Last 30 Days`, `This Month`, `Custom Range`).

#### B. 4-Card KPI Row (`grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4`)
Per client audio at `[00:14]` and `[00:33]`–`[00:38]`:
1. **Card 1 — Clicks:**
   - Label: `Clicks` | Value: `68` (or `190`) | Trend badge: `+136% Today` (emerald) | Icon: Trending arrow (`↗`).
2. **Card 2 — Conversions:**
   - Label: `Conversions` | Value: `5` (or `15`) | Trend badge: `+200% Today` (emerald) | Icon: Filter/Funnel icon.
3. **Card 3 — Payout / Earnings:**
   - Label: `Payout` (or `Earnings` with `USD` badge) | Value: `$ 750.00` | Icon: Users/Group icon.
4. **Card 4 — EPC & Currency Selector (`[00:15]`, `[00:35]`):**
   - Header includes an interactive currency dropdown (`USD v`, `EUR`, `GBP`, `PKR`, `AED`).
   - Displays `EPC`: `$ 11.03` alongside `Earnings By Currency` filtered by the selected currency.

#### C. Full-Width 30-Day Traffic Statistics Chart (`[00:46]`–`[00:56]`)
> Client directive at `[00:47]`: *"Aapne ek aur kaam karna hai, aapne isko 100% pe laga dena hai... ye Traffic statistics for the last 30 day... ye chhota laga hua hai na, aapne poora laga dena hai, baaki saari options (Affiliate panel, Affiliates info, Top Affiliates) khatam ho jayengi."*
- **Layout:** Spans `col-span-full` (`w-full`) directly below the 4 KPI cards.
- **Chart Type:** Recharts / Chart.js dual-axis ComposedChart (Bars + Smooth Line) for the last 30 days.
- **Interactive Hover Tooltip (`[00:53]`):** Shows Date (`17 October 2026`), `Total Conversions`, `Clicks`, `Total Profit ($ USD)`, and `Total Income ($ USD)`.
- **Legend Toggles:** `Total Conversions` (purple), `Clicks` (pink), `Total Profit` (cyan), `Total Income` (blue).

#### D. Bottom 2-Column Top Performers Grid (`grid-cols-1 lg:grid-cols-2 gap-6`)
> Observed at `[00:58]`–`[01:21]`.
1. **Left Card — `Offers` Table:**
   - Fixed-height scrollable table (`max-h-72 overflow-y-auto`).
   - Columns: `#` (Offer ID), `Name` (`Fusion`, `BIO`, `LUX`, `Gold`, `Medi Bloom`, `Tru`, `Air`, `Sweep`), `Clicks`, `Conversions`.
   - **Auto-Sort Rule (`[01:04]`):** Automatically sorted by `Conversions DESC, Clicks DESC` so active offers with conversions appear at the very top.
2. **Right Card — `Publishers` Table:**
   - Fixed-height scrollable table (`max-h-72 overflow-y-auto`).
   - Columns: `#` (Publisher ID `5`), `Name` (`Farhan`), `Clicks` (`68`), `Conversions` (`5`).
   - Sorted by `Conversions DESC, Clicks DESC`.

---

### Screen 2: Offer Management & 5-Tab Offer Builder (`/offers`, `/offers/new`, `/offers/:id/edit`)
**Video References:** `[03:27]`–`[07:22]`.
> Client directive at `[03:45]` & `[05:08]`: Copy the core Offer workflow from Max Wave (`General`, `Tracking & Controls`, `Targeting`, `Affiliates`, `Postbacks`, `Revenue & Payouts`). You may present the 5 sections as clean vertical tabs (like Max Wave) or a unified stepped/tabbed page.

#### A. Offers List View (`/offers`)
- Header: `Manage Offer` with top-right green `+ Add Offer` button (`[03:28]`).
- Table Columns (`[03:28]` & `[03:46]`):
  - `#` (ID), `Name` (`Luovia - OA`, `Will`, `Tru`), `Domain` (`zshe.panel.7tracking.com`), `Network` (`Mobeeka`, `Everflow`), `Visibility` (`Private`, `Public`, `Requires approval`), `Clicks`, `Conversions`, `PostBack` (read-only copyable URL), `Status` (`Active` green badge, `Paused` amber badge, `Disabled` red badge), `Action` (`Edit`, `Duplicate`, `Toggle Status`, `Delete`).

#### B. Tab 1 — `General` (`Core information` - `[03:52]`–`[04:32]`)
| Field Label | Input Type | Options / Placeholder | Required | Behavioral Rule |
| :--- | :--- | :--- | :--- | :--- |
| `Name *` | Text Input | e.g., `Layvaris Keto` | Yes | Identifies campaign across platform. |
| `Advertiser *` (Network) | Searchable Select | Populated from `/api/v1/networks` (e.g., `Nutra - Layvaris`, `Mobeeka`) | Yes | Links offer to Advertiser for reporting. |
| `Visibility` | Select Dropdown | `Public`, `Private`, `Requires approval` | Yes | **Public:** Auto-available to all affiliates (`[04:10]`). **Private:** Admin manually assigns in Affiliates tab (`[04:16]`). **Requires approval:** Affiliates request access (`[04:20]`). |
| `Status` | Select Dropdown | `Active`, `Paused`, `Disabled` | Yes | Controls whether offer accepts live traffic (`[04:28]`). |
| `Preview URL` | URL Input | `https://...` | No | Live preview link of landing page for affiliates. |
| `Description` | Rich Text / Textarea | Campaign notes & restrictions | No | Shown to affiliates in offer details. |

#### C. Tab 2 — `Tracking & Controls` (`[04:34]`–`[05:01]`)
- **Left Column (`Core settings`):**
  1. `Tracking domain`: Dropdown populated from `/api/v1/domains` (e.g., `maxwave.trk248a.com` or `zshe.panel.7tracking.com`).
  2. `Base destination URL *`: URL input with a 1-click Copy button.
  3. `Enforce IP uniqueness`: Switch toggle.
  4. `Block duplicate IPs`: Switch toggle.
- **Right Column (`Base Destination URL macros` reference panel - `[04:39]`–`[05:00]`):**
  - Displays clickable macro pills that append/insert directly into `Base destination URL` when clicked:
    - `{clickid}` or `{click_id}` — Click ID (**Mandatory primary macro**)
    - `{aff_id}` — Affiliate / Publisher ID
    - `{offer_id}` — Offer ID
    - `{sub_id}` — Sub ID parameter (`{sub1}`–`{sub5}`)
    - `{country}` — Country code ISO 3166-1 alpha-2
    - `{device_ua}` — Device User Agent

#### D. Tab 3 — `Targeting` (`[05:02]`–`[05:17]`)
- `Name`: Text input (`Targeting group #1`).
- `Condition`: Segmented button toggle (`AND` | `OR`).
- `Devices`: Multi-select pill input (`All`, `PC`, `Android`, `iOS`, `Tablet` — matches `[03:41]` & `[05:04]`).
- `Countries`: Multi-select country picker (`All`, `United States`, `United Kingdom`, etc.) + `Exclude` checkbox.
- `Cities` & `Regions`: Multi-select inputs + `Exclude` checkbox.

#### E. Tab 4 — `Affiliates` (Dual-List Publisher Assignment - `[05:18]`–`[06:23]`)
> Client explanation at `[05:24]`–`[06:20]`: *"Main har publisher ko har offer nahi deni. Main apni marzi se offers pe ja ke usko assign kar sakun... plus karunga to Enabled affiliates mein aa jayegi, minus karunga to wapis chali jayegi."*
- **Two-Column Split Card (`grid-cols-1 md:grid-cols-2 gap-6`):**
  1. **Left List (`All affiliates`):**
     - Search input (`Search` by name/email/ID).
     - Scrollable list of all `ACTIVE` publishers not yet enabled on this offer.
     - Each row displays `[ID] [Email / Name]` and a right-aligned **`+` button**. Clicking `+` immediately moves the publisher to `Enabled affiliates`.
  2. **Right List (`Enabled affiliates`):**
     - Search input (`Search`).
     - Scrollable list of publishers currently assigned to this offer.
     - Each row displays `[ID] [Email / Name]` and a right-aligned red **`-` button**. Clicking `-` immediately revokes the offer from that publisher and moves them back to `All affiliates`.

#### F. Tab 5 — `Postbacks` (`Integration pixels` - `[03:48]`, `[06:24]`–`[06:58]`)
- **Left Panel:**
  - Read-only copyable **Global S2S Postback URL** template:
    `https://{selected_tracking_domain}/postback?clickid={clickid}`
  - Editable parameter mapping helper allowing the Admin to type the Advertiser's click ID macro (e.g., `{s2}`, `{sub1}`, `{click_id}`) and copy the final postback string in one click (`[06:32]`).
  - Read-only `Image Pixel` and `Iframe Pixel` snippets.
- **Right Panel (`Integration pixels parameters` reference table):**
  - Lists `{clickid}` / `{click_id}` (Mandatory), `{goal}`, `{sum}` (Conversion revenue), `{status}` (`1` Approved, `2` Pending, `3` Declined).

#### G. Tab 6 — `Revenue & Payouts` (`[06:59]`–`[07:22]`)
> Client directive at `[07:02]`–`[07:21]`: *"Bas ye chaar fields chahiye: Payment model CPA, Currency USD, Revenue (150 jo mujhe piche se mili), aur Payout (100 jo publisher ke portal mein show hogi)."*
- **4 Required Controls:**
  1. `Payment model`: Dropdown (`CPA (Fixed)` default, `CPC`, `CPM`, `RevShare`).
  2. `Currency`: Dropdown (`USD` default, `EUR`, `GBP`, `PKR`, `AED`).
  3. `Revenue *`: Numeric input (`150`) — *Helper text: "Define the total amount you earn from the advertiser per conversion."*
  4. `Payout *`: Numeric input (`100`) — *Helper text: "Define the amount visible and paid to the publisher per conversion."*
- **Live Profit Margin Badge:** Automatically displays computed spread: `Net Margin: $50.00 (33.3%)`.
- **Bottom Action Bar:** `[Save & continue]`, `[Save changes]`, `[Cancel]`, and right-aligned `[Duplicate offer]`.
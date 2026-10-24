# 03 - Oval Media Screens & Workflows Specification

## 1. Screen Inventory (Extracted from Oval Media `zshe.panel.7tracking.com`)
1. **Manage Publisher (`/publishers`)** — `[01:26]`–`[02:28]`
2. **Manage Domain (`/domains`)** — `[02:29]`–`[02:48]`
3. **Manage Network / Advertiser (`/networks`)** — `[02:49]`–`[03:23]`
4. **Networks Report (`/reports/networks`)** — `[07:34]`–`[07:52]`
5. **Offers Report (`/reports/offers`)** — `[07:53]`–`[08:08]`
6. **Publishers Report (`/reports/publishers`)** — `[08:09]`–`[08:28]`

---

## 2. Screen-by-Screen Functional Breakdown

### Screen 1: Manage Publisher (`/publishers`)
**Video References:** `[01:26]`–`[02:28]`.

#### A. Header & Collapsible Form Drawer/Card
- Page Title: `Publisher` | Breadcrumb: `Home > Publisher`
- Card Header: `Manage Publisher` with right-aligned green button `Add Publisher` (`bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded`).
- Clicking `Add Publisher` toggles the creation form panel above the `List` table (`[01:31]`).

#### B. Simplified Add Publisher Form (Per Client Audio Directive `[01:52]`–`[02:04]`)
> **CRITICAL CUSTOMIZATION:** In the legacy Oval Media video, `Publisher Type`, `Offers` tags, and `PostBack` were shown on this form, but the client explicitly instructed at `[01:52]`–`[02:03]`: *"Publisher Type... chhorein isko, type humein kuch nahi chahiye. Sirf Name aa jaye, uski Email, uska Password aa jaye, that's it. Yahan pe ye (Offers/Postback) kuch bhi nahi chahiye, bas."*

| Field Label | Input Type | Placeholder | Required | Validation Message (`[01:55]`) |
| :--- | :--- | :--- | :--- | :--- |
| `Name` | Text (`name`) | `Enter Name` | Yes | `"Please fill out this field."` |
| `Email` | Email (`email`) | `Enter Email` | Yes | `"Please fill out this field."` / Valid email format |
| `Password` | Password (`password`) | `Password` | Yes | `"Please fill out this field."` (Min 6 chars) |

- Submit Button: Purple `Add` button (`bg-primary text-white px-5 py-2 rounded`).

#### C. Publisher List Table (`[02:04]`–`[02:25]`)
- **Columns:**
  1. `#` (ID, e.g., `5`)
  2. `Name` (e.g., `Farhan`)
  3. `Email` (e.g., `farhan@gmail.com`)
  4. `Status` (`Active` emerald badge, `Inactive` slate/red badge, `Paused` amber badge — `[02:13]`)
  5. `Added` (Timestamp `YYYY-MM-DD HH:mm:ss`, e.g., `2026-08-13 10:25:08`)
  6. `Action` (Action button group:
     - **Edit** (`bg-amber-500`): Opens modal/drawer to edit Name, Email, or reset Password.
     - **Status Toggle** (`bg-emerald-500` / `bg-indigo-600`): Toggles `Active` <-> `Inactive` / `Paused`. Displays confirmation warning: *"Setting this publisher to Inactive will automatically unassign all their active offers."* (`[02:20]`).
     - **Delete** (`bg-rose-500`): Confirms and deletes publisher.)

---

### Screen 2: Manage Domain (`/domains`)
**Video References:** `[02:29]`–`[02:48]`.

#### A. Header & Collapsible Form
- Page Title: `Domain` | Breadcrumb: `Home > Domain`
- Top-right green button: `Add Domain`.
- Clicking `Add Domain` expands the inline creation form (`[02:34]`):
  - `Name`: Text input (`placeholder="Enter Name"`, e.g., `zshe.panel.7tracking.com`), Required (`"Please fill out this field."` at `[02:36]`).
  - Purple `Add` button (`bg-primary`).

#### B. Domain List Table (`[02:40]`)
- **Columns:**
  1. `#` (`5`)
  2. `Name` (`zshe.panel.7tracking.com`)
  3. `Status` (`Active` / `Inactive`)
  4. `Added` (`2026-08-20 09:03:05`)
  5. `Action`:
     - **Toggle Status** (`bg-indigo-600` power icon)
     - **Delete** (`bg-rose-500` ban/trash icon)

---

### Screen 3: Manage Network / Advertiser (`/networks`)
**Video References:** `[02:49]`–`[03:23]`.

#### A. Header & Customized Add Network Form
- Page Title: `Network` (Advertiser) | Breadcrumb: `Home > Network`
- Card Header: `Manage Network` with right-aligned green button `Add Network` (`[02:56]`).
- **CRITICAL CUSTOMIZATION (`[03:01]`–`[03:19]`):** The legacy `Software` dropdown (`Network (Required)`, `HasOffers`, `Everflow`, etc.) is **removed** and replaced with a free-text **`Contact Details`** field so the Admin can type Telegram handles, emails, or Skype IDs freely.

| Field Label | Input Type | Placeholder | Required | Notes (`[03:03]`–`[03:18]`) |
| :--- | :--- | :--- | :--- | :--- |
| `Name` | Text | `Enter Name` | Yes | `"Please fill out this field."` (e.g., `Mobeeka`, `Everflow`) |
| `Contact Details` | Text | `Enter Telegram, Email, or Phone (Optional)` | No | Replaces legacy `Software` dropdown (`[03:07]`). |
| `Allow Duplicate Conversions` | Switch Toggle | Unchecked by default | No | Maps to `Duplicate: Allowed / Restricted` in table (`[03:00]`). |

- Submit Button: Purple `Add` button.

#### B. Network List Table (`[02:55]`)
- **Columns:**
  1. `#` (`49`, `42`, `41`, `40`, `38`)
  2. `Name` (`Everflow`, `Adiction Affiliate Jessica`, `Grabads`, `Affilizzompal`, `Optivar Zeeshi`)
  3. `Contact Details` (Displays Telegram/Email entered by Admin)
  4. `Duplicate` (`Restricted` or `Allowed`)
  5. `Status` (`Active` / `Inactive`)
  6. `Added` (`2026-09-13 06:26:43`)
  7. `Action` (`Edit` amber button, `Toggle Status` purple button, `Delete` red button)

---

### Screen 4: Networks (Advertisers) Report (`/reports/networks`)
**Video References:** `[07:34]`–`[07:52]`.

- **Header:** `Networks Report` | Breadcrumb: `Home > Networks Report`
- **Filter Controls:** Date Range Picker (`September 23, 2026 - October 22, 2026`), `Show [10] entries`, and right-aligned `Search:` input (filters by Advertiser Name or Offer Name).
- **Table Columns (Enriched per Client Directive at `[07:43]`–`[07:51]`):**
  > Client audio at `[07:43]`: *"Jab aap Advertiser report pe search karoge, usmein aapko Advertiser Name, uski Offer, uske Click, Conversion, aur Payout show karega."*
  1. `#` (Advertiser ID, e.g., `2`)
  2. `Name` (Advertiser Name, e.g., `Mobeeka`)
  3. `Offer` (Offer Name, e.g., `Luovia - OA`)
  4. `Clicks` (`68`)
  5. `Conversions` (Grouped Header spanning 3 sub-columns):
     - `Approved` (`0`)
     - `Unchecked` (`5`)
     - `Total` (`5`)
  6. `Payout` (`$ 750.00`)
- **Footer Summary Row:** Displays bold column totals (`0`, `5`, `5`, `$ 750.00`) as observed at `[07:48]`.

---

### Screen 5: Offers Report (`/reports/offers`)
**Video References:** `[07:53]`–`[08:08]`.

- **Header:** `Offers Report` | Breadcrumb: `Home > Offers Report`
- **Filter Controls:** Date Range Picker (`October 1, 2026 - October 22, 2026`), `Show [10] entries`, `Search:` input.
- **Table Columns (`[07:56]`–`[08:05]`):**
  1. `#` (Offer ID, e.g., `17`)
  2. `Name` (`Luovia - OA`)
  3. `Conversions` (`5`)
  4. `Payout` (`$ 750.00`)
  5. `Clicks` (`68`)
  6. `EPC` (`$ 11.03`)
- **Footer Summary Row:** Totals row displaying summed `Conversions` (`5`), `Payout` (`$ 750.00`), `Clicks` (`68`), and weighted `EPC` (`$ 11.03`).

---

### Screen 6: Publishers Report (`/reports/publishers`)
**Video References:** `[08:09]`–`[08:28]`.

- **Header:** `Publishers Report` | Breadcrumb: `Home > Publishers Report`
- **Filter Controls:** Date Range Picker (`September 23, 2026 - October 22, 2026`), `Show [10] entries`, `Search:` input.
- **Table Columns (Enriched per Client Directive at `[08:15]`–`[08:22]`):**
  > Client audio at `[08:16]`: *"Farhan ke upar ja ke: Farhan (Publisher Name), Offer Name, Click, Conversion (Approved / Unchecked / Total), EPC, Payout."*
  1. `#` (Publisher ID, e.g., `5`)
  2. `Name` (Publisher Name, e.g., `Farhan`)
  3. `Offer` (Offer Name, e.g., `Luovia - OA`)
  4. `Clicks` (`68`)
  5. `Conversions` (Grouped Header spanning 3 sub-columns):
     - `Approved` (`0`)
     - `Unchecked` (`5`)
     - `Total` (`5`)
  6. `EPC` (`$ 11.03`)
  7. `Payout` (`$ 750.00`)
- **Footer Summary Row:** Displays bold column totals (`68`, `0`, `5`, `5`, `$ 11.03`, `$ 750.00`).
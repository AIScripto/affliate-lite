# TechFSD Platform Live Audit & Field Findings

**Target System**: [https://panel.techfsd.com](https://panel.techfsd.com) (Trackody Performance Marketing Engine)  
**Audit Date**: November 2026  
**Audited Accounts**:
- **Owner / Super Admin**: `mohsinmoon143@gmail.com`
- **Publisher / Sub-Affiliate**: `mohsin_moon786@yahoo.com`

---

## 1. Executive Summary

A comprehensive, authenticated live crawl was performed across all administrative screens, forms, tables, and settings on `panel.techfsd.com`. Every HTML page, form control, option list, help text, and table header was extracted and compared against the current React application codebase ([affliate-lite](file:///Users/tk-lpt-1088/projects/react/affliate)).

### Core Finding
The reference site combines a lightweight PHP/Twig interface with powerful performance ad-tech features. While our current application already implements the primary workflows (Offers, Publishers, Networks, Domains, Reports, Dashboard), `panel.techfsd.com` contains granular targeting, fraud prevention, dayparting, traffic-type blocking, multi-tier report verification, and event logging that can be added seamlessly without altering our existing 3D UI aesthetic or workflows.

---

## 2. Crawled Route Inventory

The following 25 administrative routes were retrieved and analyzed during the audit:

| Route | Page Title / Purpose | Payload Size |
| :--- | :--- | :--- |
| `/dashboard` | Administrator Executive Dashboard | 94.7 KB |
| `/offer/add` | Campaign / Offer Creation Form | 184.5 KB |
| `/offers` | Offer Management Data Table | 236.7 KB |
| `/offer/edit/:id` | Offer Edit Form (General Tab) | 193.0 KB |
| `/offer/edit/:id/cap` | Offer Caps Sub-Tab (Daily/Total limits) | 72.3 KB |
| `/offer/edit/:id/payouts` | Publisher-Specific Custom Payout Overrides | 66.5 KB |
| `/offer/edit/:id/history` | Offer Version Audit History | 58.9 KB |
| `/offer/requests` | Offer Private Access Request Approvals | 63.4 KB |
| `/publisher/add` | Publisher Creation Form | 114.0 KB |
| `/publishers` | Publisher Management Data Table | 84.4 KB |
| `/publisher/edit/:id` | Publisher Edit & Payable Policies Form | 117.2 KB |
| `/network/add` | Network / Advertiser Creation Form | 67.7 KB |
| `/networks` | Network Management Data Table | 83.0 KB |
| `/domain/add` | Custom Tracking Domain Registration | 58.3 KB |
| `/domains` | Domain Health & Management Table | 85.5 KB |
| `/report/offers` | Offers Performance Report (4-tier verification) | 123.5 KB |
| `/report/publishers` | Publishers Performance Report | 181.0 KB |
| `/report/networks` | Networks / Advertisers Performance Report | 173.9 KB |
| `/report/countries` | Country-level Performance Report | 155.4 KB |
| `/report/devices` | Device-level Performance Report | 155.4 KB |
| `/report/dates` | Daily Performance Trend Report | 122.6 KB |
| `/log/clicks` | Real-Time Inbound Click Telemetry | 245.8 KB |
| `/log/conversions` | Real-Time S2S Conversion Telemetry & Latency | 273.0 KB |
| `/log/sessions` | Inbound Session Telemetry | 72.8 KB |
| `/log/useragents` | User Agent Analytics & Click Breakdown | 237.0 KB |
| `/payouts` | Publisher Payout Accounting Ledger | 62.6 KB |
| `/settings/*` | Global Policies, Duplicates, Rates, SMTP | 60–173 KB |

---

## 3. Detailed Screen-by-Screen Field Inspection

### 3.1 Offer Management Module

#### A. Offer Creation Form (`/offer/add`)

| Field Label | HTML Input Name | Type / Allowed Options | Reference Help Text / Behavior | In Current Codebase? |
| :--- | :--- | :--- | :--- | :--- |
| **Name** | `offer_name` | Text (Required) | Campaign identifier shown across platform | ✅ Yes (`OfferBuilder.tsx`) |
| **Description** | `offer_description` | Textarea (Optional) | Target KPI, instructions, or restrictions | ✅ Yes (`OfferBuilder.tsx`) |
| **Blocked Traffic Types** | `offer_traffic_types_exclude[]` | Multi-select: `Contextual`, `Display`, `Search`, `Social`, `Native`, `Mobile Ads`, `Email`, `Incentive` | Informational restrictions shown to publishers on Browse Offers | ❌ **Missing** |
| **Domain** | `offer_domain_id` | Select dropdown | Mapped tracking domain | ✅ Yes (`OfferBuilder.tsx`) |
| **Network** | `offer_network_id` | Select dropdown | Linked advertiser network | ✅ Yes (`OfferBuilder.tsx`) |
| **Category** | `offer_category_id` | Select dropdown (with inline creation) | Offer categorization (E-commerce, Nutra, etc.) | ❌ **Missing** |
| **Visibility** | `offer_visibility` | Select: `private`, `public`, `approval` | Controls whether offer is open, private, or requires approval | ✅ Yes (`OfferBuilder.tsx`) |
| **Publishers** | `offer_publishers[]` | Multi-select with Select All / Unselect All | Enabled publishers for private offers | ✅ Yes (Dual-List implemented) |
| **Countries** | `offer_countries[]` | Multi-select (ISO country codes + `ALL`) | Geo-targeting allowed countries | ✅ Yes (`OfferBuilder.tsx`) |
| **Blocked States** | `offer_states_exclude[]` | Multi-select: `AL`, `AK`, `AZ`, `CA`, `NY`, `TX`... | Clicks from selected US states are blocked | ❌ **Missing** |
| **Devices Mode** | `offer_devices_mode` | Select: `all` vs `specific` | Determines universal vs per-device links | ⚠️ Partial |
| **Devices** | `offer_devices[]` | Multi-select: `Desktop`, `Android`, `iOS` | Targeted device types | ✅ Yes (`OfferBuilder.tsx`) |
| **Universal Link** | `offer_link_universal` | Textarea / URL | Tracking destination when mode is `all` | ✅ Yes (`baseDestinationUrl`) |
| **Desktop Link** | `offer_link_desktop` | Textarea / URL | Dedicated destination link for PC/Mac clicks | ❌ **Missing** (direct field) |
| **Android Link** | `offer_link_android` | Textarea / URL | Dedicated destination link for Android clicks | ❌ **Missing** (direct field) |
| **iOS Link** | `offer_link_ios` | Textarea / URL | Dedicated destination link for iPhone/iPad clicks | ❌ **Missing** (direct field) |
| **Redirect Interstitial** | `offer_redirect` | Select: `direct`, `facebook`, `google`, `youtube` | Shows Facebook/Google/YouTube intermediary before destination | ❌ **Missing** |
| **Referrer Policy** | `offer_referrer` | Select: `0` (Hide - strips referrer), `1` (Show - sends tracking domain) | Strips or passes referral header to advertiser | ❌ **Missing** |
| **Revenue Type** | `offer_revenue_type` | Select: `fixed`, `revshare` | Fixed amount vs amount passed on postback (`&p=`) | ✅ Yes (`OfferBuilder.tsx`) |
| **Revenue Currency** | `offer_currency_id` | Select dropdown (Global currencies) | Defaults to platform currency (PKR/USD) | ✅ Yes (`OfferBuilder.tsx`) |
| **Revenue** | `offer_revenue` | Numeric input | Expected revenue per conversion | ✅ Yes (`OfferBuilder.tsx`) |
| **Lock Revenue** | `offer_revenue_lock` | Checkbox (0/1) | Keeps entered revenue fixed even if postback sends different amount | ❌ **Missing** |
| **Payout Type** | `offer_payout_type` | Select: `fixed`, `revshare` | Fixed payout vs % share of conversion revenue | ✅ Yes (`OfferBuilder.tsx`) |
| **Payout** | `offer_payout` | Numeric input | Publisher payout amount | ✅ Yes (`OfferBuilder.tsx`) |
| **Payout Revshare** | `offer_revshare` | Select dropdown: `0%` to `100%` | Percentage of conversion revenue paid to publisher | ✅ Yes (`OfferBuilder.tsx`) |
| **Timezone** | `offer_timezone_id` | Select (IANA timezones) | Reference timezone for evaluating dayparting & schedules | ❌ **Missing** |
| **Days** | `offer_days[]` | Multi-select: Monday – Sunday | Active days of the week | ❌ **Missing** |
| **Hours** | `offer_hours` | Select: `whole` (24h), `working` (9am-5pm), `custom` | Dayparting time restrictions | ❌ **Missing** |
| **Hours Start / End** | `offer_hours_start`, `offer_hours_end` | Time inputs | Custom daily hour window (e.g. 10:00 to 18:00) | ❌ **Missing** |
| **Starts** | `offer_start_at` | Datetime input | Auto-enables offer at specified schedule | ❌ **Missing** |
| **Expiry** | `offer_expiry` + `offer_expiry_at` | Toggle + Datetime input | Auto-disables offer upon reaching expiry | ❌ **Missing** |
| **Proxy Filter** | `offer_proxy` | Select: `0` (Off), `1` (On) | Rejects clicks flagged as VPN, proxy, or low-trust IP | ❌ **Missing** |
| **Duplicate IP Rule** | `offer_duplicate` | Checkbox toggle | On: allows duplicates; Off: blocks repeat clicks/conversions for lifetime | ✅ Yes (`enforceIpUniqueness`) |

#### B. Offer Edit Sub-Tabs (`/offer/edit/:id`)
On `panel.techfsd.com`, an existing offer contains 4 dedicated sub-navigation tabs:
1. **General (`/offer/edit/:id`)**: Form fields above.
2. **Caps (`/offer/edit/:id/cap`)**:
   - `offer_cap_daily`: Daily conversion cap.
   - `offer_cap_total`: Total lifetime conversion cap.
   - `offer_click_cap_daily`: Daily click cap.
   - `offer_click_cap_total`: Total lifetime click cap.
3. **Payouts (`/offer/edit/:id/payouts`)**:
   - Table of publisher-specific payout overrides:
     - Columns: `Publisher`, `Type` (Fixed / RevShare), `Payout`, `Action` (Edit, Delete).
4. **History (`/offer/edit/:id/history`)**:
   - Version audit log for offer changes:
     - Columns: `Version`, `Archived`, `Links`, `Revenue`, `Payout`, `Profit`, `Clicks`, `Conversions`.

#### C. Offers Manage Table Columns (`/offers`)
- `#` (ID with version badge, e.g. `10587 v1`)
- `Name` (with subtitle chips for targeted devices and countries)
- `Domain`
- `Network`
- `Clicks`
- `Conversions`
- `Cap` (Displays visual count / cap status: e.g. `0 / 50` or `"Cap Hit"` alert)
- `Status` (`Active`, `Paused`, `Disabled`)
- `Added` (Timestamp)
- `Actions`: Edit, Copy Link, Duplicate, Toggle Status, Delete

---

### 3.2 Publisher Management Module

#### A. Add Publisher Form (`/publisher/add`)

| Field Label | HTML Input Name | Type / Behavior | In Current Codebase? |
| :--- | :--- | :--- | :--- |
| **Name** | `publisher_name` | Text (Required) | ✅ Yes |
| **Email** | `publisher_email` | Email (Required) | ✅ Yes |
| **Password** | `publisher_password` | Password (Min 8 characters) | ✅ Yes |
| **Offers** | `publisher_offers[]` | Multi-select with Select All / Unselect All | ✅ Yes |
| **Timezone** | `publisher_timezone_id` | Select (IANA timezone list) | ❌ **Missing** |
| **Payout Type** | `publisher_payout_type` | Select: `offer` (uses offer default) vs `fixed` (custom fixed amount) | ❌ **Missing** |
| **Payout Amount** | `publisher_payout` | Numeric input (used when Payout Type is `fixed`) | ❌ **Missing** |
| **Link Mode** | `publisher_link_mode` | Select: `inherit`, `choose` (manual offers), `rotate` (auto-rotates clicks across assigned offers) | ❌ **Missing** |
| **Postback** | `publisher_postback` | Textarea for global publisher S2S postback callback | ✅ Yes (with 1-click token chips) |
| **Welcome Email** | `publisher_welcome_email` | Checkbox: "Email the sign-in link and password to this publisher" | ❌ **Missing** |

#### B. Edit Publisher Form (`/publisher/edit/:id`)
- `Payable policy for rejected conversions`: Select (`non-payable` vs `payable`).
- `Payable policy for unchecked conversions`: Select (`payable` vs `non-payable`).
- `New Password`: Optional password reset input.

#### C. Publishers Manage Table Columns (`/publishers`)
- `#` (ID)
- `Name` (with email subtitle)
- `Offers` (Count badge of active assigned offers)
- `Status` (`Active`, `Inactive`, `Paused`)
- `Added` (Timestamp)
- `Actions`: Edit, Login as Publisher, Toggle Status, Delete

---

### 3.3 Network (Advertiser) Management Module

#### A. Add Network Form (`/network/add`)

| Field Label | HTML Input Name | Type / Behavior | In Current Codebase? |
| :--- | :--- | :--- | :--- |
| **Name** | `network_name` | Text (Required advertiser name) | ✅ Yes |
| **Contact Details** | (Custom text) | Telegram handle, Skype ID, or Email | ✅ Yes |
| **Software** | `network_software_id` | Dropdown: Custom, Everflow, Lead Byte, Affise, imonetizeit, pdl profit, etc. | ❌ Dropped previously (Can be restored as optional) |
| **Tracking Template** | `network_tracking` | Text input with 1-click macro chips: `{click_id}`, `{gclid}`, `{fbclid}`, `{publisher_id}`, `{random{a,b,c}}`, `{replace_publisher{...}}` | ❌ **Missing** |
| **Postback Click Param** | `network_postback` | The parameter key this network uses for click ID on postbacks (`c=`) | ❌ **Missing** |
| **Postback Revenue Param** | `network_postback_revenue` | The parameter key this network uses for revenue amount on postbacks (`p=`) | ❌ **Missing** |
| **Duplicate Scope** | `network_duplicate` | On: scopes IP block to single offer; Off: blocks repeat IPs network-wide for lifetime | ✅ Yes (`allowDuplicateConversions`) |

#### B. Networks Manage Table Columns (`/networks`)
- `#` (ID)
- `Name`
- `Offers` (Count badge of associated campaigns)
- `Last Conversion` (Timestamp of most recent conversion received)
- `Duplicates` (`Restricted` / `Allowed`)
- `Status` (`Active` / `Inactive`)
- `Added` (Timestamp)
- `Actions`: Edit, Toggle Status, Delete

---

### 3.4 Custom Domains Module

#### A. Add Domain Form (`/domain/add`)
- `domain_name`: Text input (FQDN, e.g. `trk.myoffer.live`).

#### B. Domains Manage Table Columns (`/domains`)
- `Name`: Domain hostname.
- `Offers`: Number of active offers configured to use this domain.
- `Health`: Real-time DNS/SSL verification pill (`Active` green badge, `Propagating` amber badge, `Unverified` red badge).
- `Status`: `Active` vs `Inactive`.
- `Added`: Timestamp.
- `Actions`: Status Toggle, Delete.

---

### 3.5 Reports & Verification Module (`/report/*`)

In `panel.techfsd.com`, reporting is structured around **audit-proof 4-column group verification**:

#### A. Multi-Tier Columns
1. **Clicks Group (4 Sub-Columns)**:
   - `Clean`: Approved, verified legitimate traffic.
   - `Flagged`: Blocked traffic (VPN, proxy, bot, or duplicate IP).
   - `Not Checked`: Unfiltered raw traffic.
   - `Total`: Aggregate click count.
2. **Conversions Group (4 Sub-Columns)**:
   - `Clean`: Approved, payable conversions.
   - `Flagged`: Declined, duplicate, or fraud conversions.
   - `Not Checked`: Pending verification.
   - `Total`: Total conversions recorded.
3. **Financials**:
   - `Payout`: Aggregate publisher commissions.
   - `Revenue`: Aggregate advertiser receivables.
   - `Profit`: Net margin (`Revenue - Payout`).
   - `CR`: Conversion rate (`Conversions / Clicks * 100`).
4. **Status / Cap Indicator**: Active status or Cap Hit warning tooltip.

#### B. Report Views Available
- `/report/offers`
- `/report/publishers`
- `/report/networks`
- `/report/countries`
- `/report/devices`
- `/report/dates`

---

### 3.6 Real-Time Event Logs (`/log/*`)

The live reference site provides four dedicated real-time telemetry streams:

1. **Click Logs (`/log/clicks`)**:
   - Columns: `#` (Click UUID), `Offer`, `Domain`, `Network`, `Publisher`, `Geolocation` (Country flag, City, IP address), `Device` (OS, Browser, Device Type), `Status` (Clean vs Flagged), `Added` (Exact timestamp).
2. **Conversion Logs (`/log/conversions`)**:
   - Columns: `#` (Conversion ID), `Offer`, `Revenue`, `Payout`, `Publisher`, `Geolocation`, `Device`, `Status` (Approved, Declined, Unchecked), `Payable` (Payable vs Non-Payable), `Converted` (Timestamp), `Click to conversion` (Calculated latency: e.g. `4m 12s`).
3. **Session Logs (`/log/sessions`)**:
   - Columns: `#`, `Publisher`, `Geolocation`, `Device`, `Added`.
4. **User Agent Logs (`/log/useragents`)**:
   - Columns: `User Agent` string, `Clicks` count.

---

### 3.7 Payouts Ledger (`/payouts`)
- **Columns**: `#`, `Publisher`, `Earned`, `Paid`, `Adjusted`, `Balance`, `Status` (Pending / Processed).
- **Actions**: Record Payment, Adjust Balance.

---

### 3.8 Global Platform Settings (`/settings/*`)
- **General (`/settings`)**: Platform Title, Tagline, Default Currency (PKR/USD/EUR).
- **Duplicates (`/settings/duplicates`)**:
  - `Duplicate block window`: Time window for duplicate IP rejection.
  - `Duplicate click window`: Minimum delay required between repeated clicks.
- **Publishers (`/settings/publishers`)**:
  - Option to let publishers see CR and EPC on their dashboards.
  - Global default link mode (`Choose offers` vs `Rotate all offers`).
- **Payable Policy (`/settings/payable`)**:
  - Global default policies for rejected and unchecked conversions.
- **Fraud Check (`/settings/proxy`)**:
  - VPN/Proxy detection threshold and API configuration.
- **Exchange Rates (`/settings/rates`)**:
  - Currency conversion matrix against platform base currency.

---

## 4. Gap Matrix & Recommendation Map

| Module | Missing Feature / Field from `panel.techfsd.com` | Recommended Placement in Current Codebase |
| :--- | :--- | :--- |
| **Offers** | Category dropdown | [OfferBuilder.tsx](file:///Users/tk-lpt-1088/projects/react/affliate/frontend/src/components/offers/OfferBuilder.tsx) (Tab 1: General) |
| **Offers** | Blocked Traffic Types (Contextual, Display, Native, etc.) | [OfferBuilder.tsx](file:///Users/tk-lpt-1088/projects/react/affliate/frontend/src/components/offers/OfferBuilder.tsx) (Tab 1: General) |
| **Offers** | Blocked US States picker | [OfferBuilder.tsx](file:///Users/tk-lpt-1088/projects/react/affliate/frontend/src/components/offers/OfferBuilder.tsx) (Tab 3: Targeting) |
| **Offers** | Dedicated Desktop / Android / iOS destination URLs | [OfferBuilder.tsx](file:///Users/tk-lpt-1088/projects/react/affliate/frontend/src/components/offers/OfferBuilder.tsx) (Tab 2: Tracking) |
| **Offers** | Redirect Interstitial (Direct, Facebook, Google, YouTube) | [OfferBuilder.tsx](file:///Users/tk-lpt-1088/projects/react/affliate/frontend/src/components/offers/OfferBuilder.tsx) (Tab 2: Tracking) |
| **Offers** | Referrer policy (Hide vs Show domain) | [OfferBuilder.tsx](file:///Users/tk-lpt-1088/projects/react/affliate/frontend/src/components/offers/OfferBuilder.tsx) (Tab 2: Tracking) |
| **Offers** | Lock Revenue toggle | [OfferBuilder.tsx](file:///Users/tk-lpt-1088/projects/react/affliate/frontend/src/components/offers/OfferBuilder.tsx) (Tab 6: Revenue & Payouts) |
| **Offers** | Proxy / Fraud filter toggle | [OfferBuilder.tsx](file:///Users/tk-lpt-1088/projects/react/affliate/frontend/src/components/offers/OfferBuilder.tsx) (Tab 2: Tracking) |
| **Offers** | Dayparting & Scheduling (Days, Hours, Starts, Expiry) | [OfferBuilder.tsx](file:///Users/tk-lpt-1088/projects/react/affliate/frontend/src/components/offers/OfferBuilder.tsx) (Tab 3: Targeting — collapsible card) |
| **Offers** | Daily & Total Conversion/Click Caps | [OfferBuilder.tsx](file:///Users/tk-lpt-1088/projects/react/affliate/frontend/src/components/offers/OfferBuilder.tsx) (New sub-section in General or Tracking) |
| **Offers Table** | Cap Progress Column (e.g. `12 / 100` with Cap Hit alert) | [OffersView.tsx](file:///Users/tk-lpt-1088/projects/react/affliate/frontend/src/components/offers/OffersView.tsx) (Table column) |
| **Publishers** | Timezone selector | [PublishersView.tsx](file:///Users/tk-lpt-1088/projects/react/affliate/frontend/src/components/publishers/PublishersView.tsx) (Form & Modal) |
| **Publishers** | Payout mode (Offer default vs Fixed custom payout) | [PublishersView.tsx](file:///Users/tk-lpt-1088/projects/react/affliate/frontend/src/components/publishers/PublishersView.tsx) (Form & Modal) |
| **Publishers** | Link mode (Choose offers vs Rotate offers) | [PublishersView.tsx](file:///Users/tk-lpt-1088/projects/react/affliate/frontend/src/components/publishers/PublishersView.tsx) (Form & Modal) |
| **Publishers** | Payable policies (for rejected & unchecked conversions) | [PublishersView.tsx](file:///Users/tk-lpt-1088/projects/react/affliate/frontend/src/components/publishers/PublishersView.tsx) (Edit Modal) |
| **Networks** | Software dropdown & Tracking template with macro chips | [NetworksView.tsx](file:///Users/tk-lpt-1088/projects/react/affliate/frontend/src/components/networks/NetworksView.tsx) (Form & Edit Modal) |
| **Networks** | Postback click param (`c=`) and revenue param (`p=`) | [NetworksView.tsx](file:///Users/tk-lpt-1088/projects/react/affliate/frontend/src/components/networks/NetworksView.tsx) (Form & Edit Modal) |
| **Networks Table** | Active offer count & Last conversion timestamp | [NetworksView.tsx](file:///Users/tk-lpt-1088/projects/react/affliate/frontend/src/components/networks/NetworksView.tsx) (Table columns) |
| **Domains Table** | DNS / SSL Health verification badge | [DomainsView.tsx](file:///Users/tk-lpt-1088/projects/react/affliate/frontend/src/components/domains/DomainsView.tsx) (Table column) |
| **Reports** | 4-tier verification columns (Clean / Flagged / Not Checked / Total) | [ReportsView.tsx](file:///Users/tk-lpt-1088/projects/react/affliate/frontend/src/components/reports/ReportsView.tsx) |
| **Logs** | Real-time Click, Conversion, and Session telemetry | Candidate for new dedicated Logs view |
| **Payouts** | Publisher billing and balance ledger | Candidate for new dedicated Payouts view |

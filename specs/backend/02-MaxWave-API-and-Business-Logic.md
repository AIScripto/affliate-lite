# 02 - Max Wave Modules: API & Business Logic Specification

## 1. Scope of Max Wave Modules
Per the client walkthrough, the following high-power functional modules are extracted from **Max Wave (`offers-maxwave.affise.com`)**:
1. **Top KPI Bar with Currency Switcher & Full-Width 30-Day Traffic Chart** (`[00:14]`, `[00:32]`–`[00:56]`).
2. **5-Tab Offer Management Engine** (`[03:45]`–`[07:22]`):
   - Tab 1: `General` (Name, Advertiser/Network, Visibility: Public/Private/Requires Approval, Status: Active/Paused/Disabled, Preview URL, Description).
   - Tab 2: `Tracking & Controls` (Tracking Domain selector, Base Destination URL with `{clickid}`, `{aff_id}`, `{offer_id}`, `{sub_id}` macro injection, IP uniqueness toggles).
   - Tab 3: `Targeting` (Devices, Countries, Cities, Regions, AND/OR condition).
   - Tab 4: `Affiliates` (Dual-column `All affiliates` vs. `Enabled affiliates` assignment with instant `+` / `-` toggling).
   - Tab 5: `Revenue & Payouts` (Payment Model `CPA [Fixed]`, Currency `USD`, Advertiser `Revenue` vs. Affiliate `Payout` spread).
3. **Global S2S Postback & Integration Pixels** (`[03:48]`, `[06:24]`–`[06:58]`).

---

## 2. API Endpoint Catalog & Contracts

### 2.1 Dashboard Analytics (`GET /api/v1/dashboard/summary`)
Powers the merged Dashboard KPI cards and the 100%-width 30-Day Traffic Statistics chart (`[00:46]`–`[00:56]`).

- **Query Parameters (Zod Schema):**
  ```typescript
  const DashboardQuerySchema = z.object({
    startDate: z.string().date().optional(), // e.g., '2026-10-01'
    endDate: z.string().date().optional(),   // e.g., '2026-10-22'
    currency: z.enum(['USD', 'EUR', 'GBP', 'PKR', 'AED']).default('USD')
  });
  ```
- **Business Formulas:**
  - `EPC` (Earnings Per Click) = `clicks > 0 ? Number((payout / clicks).toFixed(2)) : 0.00` (Observed at `[00:13]`: 68 clicks, $750.00 payout -> $11.03 EPC).
  - `Profit` = `sum(revenue) - sum(payout)`.
- **Response Payload (`200 OK`):**
  ```json
  {
    "kpis": {
      "clicks": { "total": 68, "today": 12, "trendPercent": 136 },
      "conversions": { "total": 5, "today": 1, "trendPercent": 200 },
      "payout": { "total": 750.00, "currency": "USD" },
      "revenue": { "total": 1125.00, "currency": "USD" },
      "epc": { "total": 11.03, "currency": "USD" },
      "earningsByCurrency": { "amount": 750.00, "currency": "USD" }
    },
    "trafficLast30Days": [
      {
        "date": "2026-10-17",
        "clicks": 68,
        "conversions": 5,
        "totalProfit": 375.00,
        "totalIncome": 1125.00
      }
    ],
    "topOffers": [
      { "id": 17, "name": "Luovia - OA", "clicks": 68, "conversions": 5 },
      { "id": 3, "name": "Fusion", "clicks": 0, "conversions": 0 }
    ],
    "topPublishers": [
      { "id": 5, "name": "Farhan", "clicks": 68, "conversions": 5 }
    ]
  }
  ```
- **Sorting Rule (`[01:04]`):** `topOffers` and `topPublishers` must be sorted by `conversions DESC, clicks DESC` so active offers with conversions automatically float to the top.

---

### 2.2 Complete 5-Tab Offer CRUD (`/api/v1/offers`)

#### `POST /api/v1/offers` & `PUT /api/v1/offers/:id`
Supports either saving all 5 tabs in a single unified payload or tab-by-tab partial updates (`Save & continue` / `Save changes` at `[03:53]`).

- **Request Body Schema (Zod):**
  ```typescript
  export const UpsertOfferSchema = z.object({
    general: z.object({
      name: z.string().min(2, "Offer name is required"),
      networkId: z.number().int().positive(),
      visibility: z.enum(['PUBLIC', 'PRIVATE', 'REQUIRES_APPROVAL']).default('PRIVATE'),
      status: z.enum(['ACTIVE', 'PAUSED', 'DISABLED']).default('ACTIVE'),
      previewUrl: z.string().url().optional().or(z.literal('')),
      description: z.string().optional()
    }),
    tracking: z.object({
      domainId: z.number().int().positive(),
      destinationUrl: z.string().url("Valid destination URL with macros is required"),
      enforceIpUniqueness: z.boolean().default(false),
      blockDuplicateIps: z.boolean().default(false)
    }),
    targeting: z.object({
      name: z.string().default('Targeting group #1'),
      conditionOp: z.enum(['AND', 'OR']).default('AND'),
      isEnabled: z.boolean().default(true),
      devices: z.array(z.enum(['ALL', 'PC', 'Android', 'iOS', 'Tablet'])).default(['ALL']),
      countries: z.array(z.string()).default(['ALL']),
      excludeCountries: z.boolean().default(false),
      cities: z.array(z.string()).default([]),
      regions: z.array(z.string()).default([])
    }),
    affiliates: z.object({
      enabledPublisherIds: z.array(z.number().int().positive()).default([])
    }),
    revenuePayouts: z.object({
      title: z.string().default('Default'),
      goalValue: z.string().default('1'),
      paymentModel: z.enum(['CPA_FIXED', 'CPC', 'CPM', 'REVSHARE']).default('CPA_FIXED'),
      currency: z.enum(['USD', 'EUR', 'GBP', 'PKR', 'AED']).default('USD'),
      revenue: z.number().nonnegative("Revenue must be >= 0"),
      payout: z.number().nonnegative("Payout must be >= 0")
    })
  });
  ```

- **Visibility State Machine (`[04:01]`–`[04:26]`):**
  1. `PUBLIC`: Automatically accessible to all `ACTIVE` publishers without manual assignment. Warning note shown in UI: *"Switching to Public permanently clears the enabled affiliates list."*
  2. `PRIVATE`: Only accessible to publishers explicitly present in `offer_publishers` (`Enabled affiliates` list).
  3. `REQUIRES_APPROVAL`: Visible in publisher catalog, but tracking links are locked until Admin approves the publisher's request.

---

### 2.3 Dual-List Affiliate Assignment Endpoints (`[05:18]`–`[06:23]`)
Powers the instant `+` and `-` buttons in Tab 4 (`Affiliates`):
- `GET /api/v1/offers/:id/affiliates`: Returns `{ allAffiliates: [...], enabledAffiliates: [...] }` with search filter support (`?search=`).
- `POST /api/v1/offers/:id/affiliates/:publisherId`: Moves publisher from `All affiliates` to `Enabled affiliates` (`+` button).
- `DELETE /api/v1/offers/:id/affiliates/:publisherId`: Removes publisher from `Enabled affiliates` (`-` button) and immediately revokes offer visibility on the publisher's portal (`[05:48]`).

---

### 2.4 Tracking Link Macro Engine & S2S Postback Receiver

#### Tracking Click Redirect (`GET /click`)
- **Inbound Query:** `https://{domain}/click?offer_id={id}&aff_id={pub_id}&sub_id={sub}`
- **Execution Flow:**
  1. Verify Offer `status === 'ACTIVE'` and Publisher `status === 'ACTIVE'`.
  2. Verify Publisher permission (if Offer is `PRIVATE`, check `offer_publishers`).
  3. Enforce `enforceIpUniqueness` / `blockDuplicateIps` if enabled.
  4. Insert record into `clicks` table and generate UUID `clickid`.
  5. Replace macros in `offer.destination_url` (`[04:40]`–`[05:00]`):
     - `{clickid}` or `{click_id}` -> Generated UUID
     - `{aff_id}` -> `publisher_id`
     - `{offer_id}` -> `offer_id`
     - `{sub_id}` -> `sub_id`
  6. Issue `302 Found` redirect to resolved advertiser destination URL.

#### Global S2S Postback Receiver (`GET /postback` & `POST /postback`)
> Observed in Max Wave Tab `Postbacks` (`[03:48]`, `[06:24]`–`[06:58]`): `https://offers-maxwave.affise.com/postback?clickid={clickid}`
- **Inbound Query Parameters:**
  - `clickid` or `click_id` (Required UUID)
  - `goal` (Optional, defaults to `'1'`)
  - `sum` (Optional override revenue)
  - `status` (Optional: `1` = Approved, `2` = Pending/Unchecked, `3` = Declined)
- **Execution Flow:**
  1. Look up `click` by `clickid`. If not found, return `404 { "error": "Invalid clickid" }`.
  2. Check `network.allow_duplicate_conversions` (`[03:00]`). If `false` and a conversion already exists for `clickid`, return `409 Conflict`.
  3. Fetch `offer_payouts` for the offer to snapshot `revenue` (e.g., `$150`) and `payout` (e.g., `$100`).
  4. Create `conversions` row.
  5. If Publisher has a configured `postback_url`, fire an asynchronous outbound S2S webhook replacing `{clickid}`, `{payout}`, and `{sub_id}`.
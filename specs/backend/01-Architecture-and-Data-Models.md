# 01 - Architecture & Data Models (Unified CPA Affiliate Tracking Platform)

## 1. System Context & Client Synthesis
The client walkthrough demonstrates two reference systems:
1. **Oval Media (`zshe.panel.7tracking.com`):** A lightweight custom PHP affiliate tracking panel providing the primary left-sidebar navigation shell (`Dashboard`, `Publishers`, `Domain`, `Network`, `Offers`, `Report -> Networks / Offers / Publishers`, `Log Out`).
2. **Max Wave (`offers-maxwave.affise.com`):** An Affise-based enterprise CPA platform whose specific functional modules (4-KPI Currency Dashboard, 30-Day Traffic Chart, 5-Tab Offer Builder, Dual-List Affiliate Assignment, Global S2S Postbacks, and Revenue vs. Payout Spread) must be merged into the simplified Oval Media layout.

### Explicitly Excluded Features (Per Client Audio Directives)
- **Publisher Type (`Publisher` / `SubPublisher`):** Explicitly dropped at `[01:52]`.
- **Network Tracking Software Dropdown (`HasOffers`, `Everflow`, etc.):** Replaced with a free-text `Contact Details` input at `[03:02]`.
- **Notifications Module:** Explicitly skipped at `[07:30]`.
- **Max Wave Clutter Widgets:** `Affiliate panel`, `Affiliates info`, `Top Affiliates and Offers`, `Optimization tool`, and `Coupon codes` are excluded (`[00:48]`, `[07:20]`).

---

## 2. Target Backend Stack
- **Runtime:** Node.js v24 (Native ESM `"type": "module"`, native `crypto`, built-in `node:test` runner).
- **Framework & Validation:** Express/Fastify with strict TypeScript and **Zod** validation gates on all incoming `body`, `query`, and `params`.
- **Database:** PostgreSQL 16+ with Prisma or Drizzle ORM.
- **Security & Auth:** JWT (Access + Refresh tokens), `bcrypt` password hashing, and Role-Based Access Control (`ADMIN`, `PUBLISHER`).

---

## 3. Complete Database Schema (PostgreSQL DDL / ORM Blueprint)

### 3.1 Enumerations
```sql
CREATE TYPE user_role AS ENUM ('ADMIN', 'PUBLISHER');
CREATE TYPE entity_status AS ENUM ('ACTIVE', 'INACTIVE', 'PAUSED', 'DISABLED');
CREATE TYPE offer_visibility AS ENUM ('PUBLIC', 'PRIVATE', 'REQUIRES_APPROVAL');
CREATE TYPE offer_status AS ENUM ('ACTIVE', 'PAUSED', 'DISABLED');
CREATE TYPE condition_operator AS ENUM ('AND', 'OR');
CREATE TYPE payment_model AS ENUM ('CPA_FIXED', 'CPC', 'CPM', 'REVSHARE');
CREATE TYPE currency_code AS ENUM ('USD', 'EUR', 'GBP', 'PKR', 'AED');
CREATE TYPE conversion_status AS ENUM ('APPROVED', 'UNCHECKED', 'DECLINED');
```

### 3.2 Core Tables

#### `users` (Admins & Publishers / Affiliates)
> Observed in Oval Media (`publisher.php` `[01:30]`) and Max Wave (`affiliates` `[01:38]`).
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'PUBLISHER',
  status entity_status NOT NULL DEFAULT 'ACTIVE',
  postback_url TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_role_status ON users(role, status);
```
*Critical Business Rule (`[02:20]`):* Transitioning a Publisher's `status` from `ACTIVE` to `INACTIVE` or `PAUSED` must automatically revoke/disable their active offer assignments in `offer_publishers` and reject incoming tracking clicks for their `aff_id`.

#### `domains` (Custom Tracking Domains)
> Observed in Oval Media (`domain.php` `[02:31]`) and Max Wave (`Tracking & Controls` `[04:35]`).
```sql
CREATE TABLE domains (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL, -- e.g., 'zshe.panel.7tracking.com' or 'maxwave.trk248a.com'
  status entity_status NOT NULL DEFAULT 'ACTIVE',
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `networks` (Advertisers)
> Observed in Oval Media (`network.php` `[02:55]`) and Max Wave (`Advertisers` `[02:51]`).
```sql
CREATE TABLE networks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL, -- e.g., 'Everflow', 'Mobeeka', 'Nutra - Layvaris'
  contact_details TEXT NULL,  -- Client replacement at [03:06] for Telegram/Email/Skype free text
  allow_duplicate_conversions BOOLEAN NOT NULL DEFAULT FALSE, -- Observed toggle at [03:00]
  status entity_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `offers` (Core Offer & Tracking Configuration)
> Synthesized from Max Wave 5-Tab Offer Editor (`[03:52]`–`[07:22]`) and Oval Media (`offer.php` `[03:28]`).
```sql
CREATE TABLE offers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL, -- e.g., 'Layvaris Keto - MM', 'Luovia - OA', 'Fusion'
  network_id INTEGER NOT NULL REFERENCES networks(id) ON DELETE RESTRICT,
  domain_id INTEGER NULL REFERENCES domains(id) ON DELETE SET NULL,
  visibility offer_visibility NOT NULL DEFAULT 'PRIVATE',
  status offer_status NOT NULL DEFAULT 'ACTIVE',
  preview_url TEXT NULL,
  description TEXT NULL,
  destination_url TEXT NOT NULL, -- Base URL supporting macros: {clickid}, {aff_id}, {offer_id}, {sub_id}
  enforce_ip_uniqueness BOOLEAN NOT NULL DEFAULT FALSE,
  block_duplicate_ips BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_offers_status_visibility ON offers(status, visibility);
```

#### `offer_targeting_groups` (Geo & Device Targeting Rules)
> Observed in Max Wave Tab 3 (`Targeting` `[05:03]`) and Oval Media (`Countries` & `Devices` `[03:38]`).
```sql
CREATE TABLE offer_targeting_groups (
  id SERIAL PRIMARY KEY,
  offer_id INTEGER NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL DEFAULT 'Targeting group #1',
  condition_op condition_operator NOT NULL DEFAULT 'AND',
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  countries TEXT[] NOT NULL DEFAULT '{}',        -- ISO 3166-1 alpha-2 codes or ['ALL']
  exclude_countries BOOLEAN NOT NULL DEFAULT FALSE,
  devices TEXT[] NOT NULL DEFAULT '{}',          -- ['PC', 'Android', 'iOS', 'Tablet'] or ['ALL']
  cities TEXT[] NOT NULL DEFAULT '{}',
  regions TEXT[] NOT NULL DEFAULT '{}',
  exclude_regions BOOLEAN NOT NULL DEFAULT FALSE,
  additional_urls JSONB NOT NULL DEFAULT '[]'    -- Optional device-specific override URLs
);
```

#### `offer_publishers` (Dual-List Affiliate Assignment & Requests)
> Observed in Max Wave Tab 4 (`Affiliates` `[05:18]`).
```sql
CREATE TABLE offer_publishers (
  offer_id INTEGER NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  publisher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  approval_status VARCHAR(30) NOT NULL DEFAULT 'APPROVED', -- 'PENDING', 'APPROVED', 'REJECTED'
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (offer_id, publisher_id)
);
```

#### `offer_payouts` (Revenue vs. Payout Spread)
> Observed in Max Wave Tab 5 (`Revenue & Payouts` `[06:59]`).
```sql
CREATE TABLE offer_payouts (
  id SERIAL PRIMARY KEY,
  offer_id INTEGER NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL DEFAULT 'Default',
  goal_value VARCHAR(50) NOT NULL DEFAULT '1',
  payment_model payment_model NOT NULL DEFAULT 'CPA_FIXED',
  currency currency_code NOT NULL DEFAULT 'USD',
  revenue NUMERIC(12, 2) NOT NULL DEFAULT 0.00, -- Admin earnings from Advertiser (e.g., 150.00)
  payout NUMERIC(12, 2) NOT NULL DEFAULT 0.00,  -- Publisher payout visible in their portal (e.g., 100.00)
  countries TEXT[] NOT NULL DEFAULT '{}',
  exclude_countries BOOLEAN NOT NULL DEFAULT FALSE
);
```

#### `clicks` & `conversions` (Traffic & S2S Postback Ledger)
> Powers Dashboard KPIs, 30-Day Chart, S2S Postbacks (`[06:24]`), and 3 Report Views (`[07:35]`–`[08:25]`).
```sql
CREATE TABLE clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Serves as {clickid} / {click_id}
  offer_id INTEGER NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  publisher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sub_id VARCHAR(255) NULL,
  ip_address VARCHAR(45) NOT NULL,
  country_code VARCHAR(10) NULL,
  device_type VARCHAR(30) NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_clicks_offer_pub_date ON clicks(offer_id, publisher_id, created_at);

CREATE TABLE conversions (
  id SERIAL PRIMARY KEY,
  click_id UUID NOT NULL REFERENCES clicks(id) ON DELETE RESTRICT,
  offer_id INTEGER NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  publisher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  network_id INTEGER NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
  goal_value VARCHAR(50) NOT NULL DEFAULT '1',
  status conversion_status NOT NULL DEFAULT 'UNCHECKED', -- Maps to Report 'Approved' & 'Unchecked'
  currency currency_code NOT NULL DEFAULT 'USD',
  revenue NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  payout NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  external_tx_id VARCHAR(255) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_conversions_report ON conversions(created_at, network_id, offer_id, publisher_id, status);
```

---

## 4. RBAC & Data Visibility Matrix

| Resource / Field | `ADMIN` Role (`adren` / `zeeshan@gmail.com`) | `PUBLISHER` Role (`Farhan`) |
| :--- | :--- | :--- |
| **Dashboard KPIs** | Sees total `Clicks`, `Conversions`, `Revenue/Payout`, `EPC`, and `Earnings By Currency` across all or filtered publishers. | Sees only own `Clicks`, `Conversions`, `Payout` (never `Revenue`), and `EPC`. |
| **Offer Financials** | Full CRUD on `revenue` ($150) and `payout` ($100); sees net profit spread ($50). | Read-only access to `payout` ($100). `revenue` is stripped at serializer level. |
| **Offer Visibility** | Sees `PUBLIC`, `PRIVATE`, and `REQUIRES_APPROVAL` offers. | Sees `PUBLIC` offers + `PRIVATE` offers explicitly linked in `offer_publishers` (where `is_enabled = true` and user `status = 'ACTIVE'`). |
| **Publishers / Domains / Networks** | Full CRUD access. | Forbidden (`403 Forbidden`). |
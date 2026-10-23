# AffiliateX - Multi-Tier Affiliate & Sub-Affiliate Tracking Platform

> High-performance Server-to-Server (S2S) Click ID Attribution Engine, Dynamic URL Parameter Translation Registry, and Automated Ledger Split.

---

## 🏗 Architecture Overview

The platform operates as a master affiliate distribution hub with strict role-based separation:
- **Direct Master Promotion (Mode A)**: 100% Margin directly credited to Master Profit.
- **Sub-Affiliate Network Promotion (Mode B)**: Automated commission split (e.g., 60% to Sub-Affiliate Wallet, 40% Master Override Profit).
- **Inbound Redirect Interceptor (`<50ms`)**: Captures shopper telemetry (Device, OS, Browser, Geo, IP Hash), generates cryptographic Click ID (`clk_...`), translates URL query parameters dynamically per brand, and returns HTTP 302 to the brand.
- **S2S Postback Webhook**: Receives brand sales notifications, validates security tokens, enforces order deduplication, and writes to an immutable double-entry ledger.

---

## 🛠 Technology Stack

- **Backend**: Node.js **v24**, Express, TypeScript, `pg` (PostgreSQL Client), `ua-parser-js`, `zod`.
- **Frontend**: **React 18/19**, **Vite**, **Tailwind CSS**, Lucide Icons.
- **Database**: **PostgreSQL 16** with indexed relational schema.
- **Orchestration**: **Docker & Docker Compose** with isolated containers for PostgreSQL, Backend, and Frontend.

---

## 🚀 Running with Docker Containers

```bash
# Build and start all three containers in background
docker compose up --build -d

# Check status of containers
docker compose ps

# View live backend logs
docker compose logs -f backend
```

Once started:
- **Frontend App (Master Admin & Partner Portal)**: `http://localhost:5173`
- **Backend API & Tracking Redirects**: `http://localhost:5000`
- **PostgreSQL Database**: `localhost:5432`

---

## 🧪 Testing Core Flows

### 1. Test Inbound Tracking Redirect
Visit or test a tracking link:
```bash
curl -i "http://localhost:5000/go/running-shoe-123?ref=sub_ali_05&src=youtube&camp=winter_sale_26&json=true"
```
Returns generated `click_id`, telemetry, and translated outbound brand URL.

### 2. Test S2S Postback Sale Webhook
Simulate a brand conversion:
```bash
curl -X POST http://localhost:5000/api/v1/postback \
  -H "Content-Type: application/json" \
  -d '{
    "click_id": "clk_98412_yt01",
    "order_id": "ORD-LIVE-9012",
    "sale_amount": 100.00,
    "commission": 20.00,
    "secret": "sec_nike_postback_99182"
  }'
```
Response automatically splits the $20 commission ($12 to Ali Khan, $8 Master Override) and updates wallet balances in PostgreSQL.

---

## 🖥 Application Features

1. **Master Admin Hub (`Wireframe A`)**:
   - KPI Cards: Total Clicks, Direct Profit ($), Sub Override ($), Sub Payable Liability ($).
   - Brand URL Parameter Definition Registry: Dynamic translation template management.
   - Live Conversion & Attribution Real-Time Stream.
   - Direct vs Sub-Affiliate Revenue Economics Breakdown.
   - Sub-Affiliate Leaderboard & Automated Bot/Fraud Audit.
   - Built-in S2S Postback Simulator modal.

2. **Sub-Affiliate Portal (`Wireframe B`)**:
   - Partner Metrics: Clicks (30D), CR%, Approved Wallet, Pending Wallet, EPC.
   - Promotional Link Generator with 1-click Copy and Test Click inspector.
   - Personal Traffic by Channel breakdown.
   - Personal Scoped Conversion Ledger (hides master margins).
   - Instant Payout Request workflow.

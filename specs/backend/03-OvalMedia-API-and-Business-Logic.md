# 03 - Oval Media Modules: API & Business Logic Specification

## 1. Scope of Oval Media Modules
Per the client walkthrough of **Oval Media (`zshe.panel.7tracking.com`)**, the following administrative CRUD and reporting modules form the backbone of the platform:
1. **Manage Publisher (`publisher.php` `[01:26]`–`[02:28]`):** Streamlined creation (`Name`, `Email`, `Password` only—`Publisher Type`, `Offers`, and `PostBack` removed from creation form per client audio at `[01:52]`–`[02:03]`) and status lifecycle (`Active`, `Inactive/Paused`, `Delete`).
2. **Manage Domain (`domain.php` `[02:29]`–`[02:48]`):** Custom tracking domain registration and status management.
3. **Manage Network / Advertiser (`network.php` `[02:49]`–`[03:23]`):** Simplified Advertiser creation (`Name`, free-text `Contact Details` replacing the `Software` dropdown per `[03:06]`, and `Allow Duplicate Conversions` toggle).
4. **Three Dedicated Report Engines (`[07:33]`–`[08:25]`):**
   - `Networks Report` (`report_network.php`)
   - `Offers Report` (`report_offers.php`)
   - `Publishers Report` (`report_publisher.php`)

---

## 2. API Endpoint Catalog & Contracts

### 2.1 Manage Publishers (`/api/v1/publishers`)

#### `POST /api/v1/publishers`
> Strictly follows client simplification directive at `[01:53]`: *"Type humein kuch nahi chahiye... sirf Name aa jaye, Email aa jaye, Password aa jaye, that's it."*
- **Request Body Schema (Zod):**
  ```typescript
  export const CreatePublisherSchema = z.object({
    name: z.string().trim().min(1, "Please fill out this field."),
    email: z.string().trim().email("Please enter a valid email address."),
    password: z.string().min(6, "Please fill out this field.")
  });
  ```
- **Response (`201 Created`):**
  ```json
  {
    "id": 5,
    "name": "Farhan",
    "email": "farhan@gmail.com",
    "status": "ACTIVE",
    "createdAt": "2026-08-13T10:25:08Z"
  }
  ```

#### `PATCH /api/v1/publishers/:id/status`
> Implements client directive at `[02:08]`–`[02:25]`: *"Agar hum pause kar rahe hain, active kar rahe hain, inactive kar rahe hain... jab inactive hoga zahir hai uske paas se saari offers automatic remove ho jayengi."*
- **Request Body:** `{ "status": "ACTIVE" | "INACTIVE" | "PAUSED" }`
- **Transactional Side-Effect:**
  ```sql
  BEGIN;
  UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 AND role = 'PUBLISHER';
  -- Automatically revoke offer assignments when set to INACTIVE or PAUSED
  DELETE FROM offer_publishers WHERE publisher_id = $2 AND $1 IN ('INACTIVE', 'PAUSED');
  COMMIT;
  ```

#### `GET /api/v1/publishers`
- Supports DataTables-style server pagination, sorting, and search (`?page=1&limit=10&search=Farhan&sortBy=id&sortDir=desc`).

#### `DELETE /api/v1/publishers/:id`
- Deletes or soft-deletes the publisher and cascades removal of `offer_publishers` links.

---

### 2.2 Manage Domains (`/api/v1/domains`)
> Observed at `[02:31]`–`[02:48]` (`zshe.panel.7tracking.com`).

- **`POST /api/v1/domains` Schema:**
  ```typescript
  export const CreateDomainSchema = z.object({
    name: z.string().trim().min(1, "Please fill out this field.")
      .regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid domain hostname")
  });
  ```
- **`GET /api/v1/domains`:** Returns list of domains (`#`, `Name`, `Status`, `Added`, `Action`).
- **`PATCH /api/v1/domains/:id/status`:** Toggles `ACTIVE` / `INACTIVE`.
- **`DELETE /api/v1/domains/:id`:** Deletes tracking domain if not actively bound to live traffic.

---

### 2.3 Manage Networks / Advertisers (`/api/v1/networks`)
> Observed at `[02:50]`–`[03:23]`. Incorporates the client's audio modification at `[03:06]`: *"Software... ye matter nahi karta, sirf Name de dein aur uska Contact Detail kar dein bas (Telegram, Email jo bhi daalna ho)."*

- **`POST /api/v1/networks` Schema:**
  ```typescript
  export const CreateNetworkSchema = z.object({
    name: z.string().trim().min(1, "Please fill out this field."),
    contactDetails: z.string().trim().optional().default(''), // Replaces 'Software' dropdown
    allowDuplicateConversions: z.boolean().default(false)
  });
  ```
- **`GET /api/v1/networks`:**
  Returns paginated list with columns: `id` (`#`), `name` (`Everflow`, `Mobeeka`, `Grabads`), `contactDetails`, `duplicate` (`Allowed` vs. `Restricted` derived from `allowDuplicateConversions`), `status` (`Active`), and `createdAt` (`Added`).

---

### 2.4 Unified Reporting Engine (`/api/v1/reports/*`)
> Observed at `[07:34]`–`[08:25]`. All three report endpoints accept `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&page=1&limit=10&search=`.

#### 1. Networks (Advertisers) Report (`GET /api/v1/reports/networks`)
> Observed at `[07:35]`–`[07:51]`. Client explicitly requested enriched columns at `[07:43]`: Advertiser Name, Offer Name, Clicks, Conversions (Approved / Unchecked / Total), and Payout.
- **Response Row Structure:**
  ```json
  {
    "id": 2,
    "networkName": "Mobeeka",
    "offerName": "Luovia - OA",
    "clicks": 68,
    "approvedConversions": 0,
    "uncheckedConversions": 5,
    "totalConversions": 5,
    "payout": 750.00,
    "revenue": 1125.00
  }
  ```

#### 2. Offers Report (`GET /api/v1/reports/offers`)
> Observed at `[07:53]`–`[08:08]` (`report_offers.php`).
- **Response Row Structure:**
  ```json
  {
    "id": 17,
    "offerName": "Luovia - OA",
    "conversions": 5,
    "payout": 750.00,
    "clicks": 68,
    "epc": 11.03
  }
  ```

#### 3. Publishers Report (`GET /api/v1/reports/publishers`)
> Observed at `[08:10]`–`[08:25]` (`report_publisher.php`). Client explicitly requested at `[08:16]` that the Publisher report include Publisher Name, Offer Name, Clicks, Conversions (Approved / Unchecked / Total), EPC, and Payout.
- **Response Row Structure:**
  ```json
  {
    "id": 5,
    "publisherName": "Farhan",
    "offerName": "Luovia - OA",
    "clicks": 68,
    "approvedConversions": 0,
    "uncheckedConversions": 5,
    "totalConversions": 5,
    "epc": 11.03,
    "payout": 750.00
  }
  ```
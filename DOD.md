# Definition of Done (DOD)
## AffiliateX Platform Quality & Completion Standards

Every feature, configuration module, and update must meet this **Definition of Done (DOD)** before it is considered complete.

---

### 1. Simple Language & Usability (Layman-Friendly)
- [ ] **Plain English First**: Always use everyday, simple words that non-native English speakers and non-technical users understand easily.
  - *Example*: Use "Tracking ID" instead of "Attribution token identifier".
  - *Example*: Use "Money to pay partner" instead of "Sub-affiliate liability accrual".
  - *Example*: Use "Where visitor came from" instead of "Traffic source acquisition telemetry".
- [ ] **No Clutter (Tables Over Badges)**:
  - Complex information (such as parameters, query keys, webhooks, or fields) must **always** be presented in clean, well-spaced **tables** with clear columns.
  - Avoid wrapping badge clouds or messy pills that create visual clutter and are difficult to scan.
- [ ] **Intuitive UX**:
  - Important actions (like copying links or adding parameters to a template) must be doable in **1 single click**.
  - Provide instant visual feedback (e.g., "Copied!", "In URL ✓", green checkmarks).

---

### 2. UI Layout & Module Separation
- [ ] **Separation of Config UIs**:
  - Each configuration module (URL Parameters, Products & Offers, Sub-Affiliates, Webhooks, Rules) must have its own separate, distinct UI.
  - No mixing or cross-contaminating different configurations into one confusing view.
- [ ] **Tabbed Organization Where Helpful**:
  - When a configuration module has multiple related sections (e.g. List of Templates, Table of Parameters, Test Sandbox, How It Works Guide), organize them into clean **Tabs** rather than stacking everything onto one long, cluttered page.

---

### 3. Visual Quality & Multi-Theme Design
- [ ] **Multi-Theme Support**:
  - Full support for both **Dark Mode** and **Light Mode**.
  - High contrast and crisp readability in both themes (no low-contrast grey-on-white or dark-on-black).
- [ ] **3D Gradient Look & Feel**:
  - Panels feature subtle 3D depth, specular top highlights (`inset 0 1px 0 0 rgba(...)`), and smooth shadows.
  - Buttons have raised tactile gradients with hover lifts and pressed-down feedback.

---

### 4. Parameter Engine & Link Generation
- [ ] **Unlimited Parameters**:
  - Users can define as many standard and custom URL parameters as needed (e.g. `{utm_source}`, `{sub1}`, `{c_id}`).
  - 1-click **"+ Add to URL"** button automatically appends `&param_key={token}` directly into the URL template without typing errors.
- [ ] **Real-Time Preview**:
  - URL template changes must update the live preview instantly so the user can verify the link before saving.

---

### 5. Backend Logic & Data Integrity
- [ ] **Zero-Leak Fallback**:
  - Traffic with missing or invalid partner codes must safely fallback to the Master Admin link so no sales or money are lost.
- [ ] **Idempotent Webhooks**:
  - Duplicate postback calls with the same `order_id` must never double-count sales or inflate commissions.
- [ ] **Fast Redirection**:
  - Public shopper links (`/go/:slug`) must resolve and redirect in under 50ms.

---

### 6. Test Cases Requirement
- [ ] **Always Write Test Cases**:
  - Test case files must be created for every core module (URL compiler, parameter resolution, commission math, webhooks, theme toggling).
  - Test cases must cover normal cases, edge cases (empty parameters, strange characters), and error recovery.
  - *Note*: Automated test suites are only executed when explicitly requested by the user.

---

### 7. Production Readiness Checklist
- [ ] TypeScript check (`tsc --noEmit`) passes with **0 errors**.
- [ ] Database schema changes are documented in `schema.sql` and backwards-compatible.
- [ ] Docker containers build and run cleanly.

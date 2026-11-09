# Testing Guide: Affiliate Tracker

This guide helps you test the tracker before real affiliates use it.
Follow the steps in order. You only need a web browser.

---

## All links

| What | Link |
|---|---|
| Panel (admin login) | https://affiliate.asesment.com |
| Postback link for networks (basic) | `https://affiliate.asesment.com/api/v1/postback?clickid={clickid}` |
| Postback link for networks (full) | `https://affiliate.asesment.com/api/v1/postback?clickid={clickid}&goal={goal}&status={status}&action_id={action_id}&sum={sum}&currency={currency}` |
| Tracking link (for visitors) | `https://affiliate.asesment.com/click?offer_id=OFFER_ID&aff_id=PUBLISHER_ID&sub_id=ANY_TEXT` |
| Image pixel (thank-you page) | `https://affiliate.asesment.com/api/v1/postback/pixel.jpg?clickid={clickid}` |
| Script pixel (thank-you page) | `https://affiliate.asesment.com/sdk/pixel.js?clickid={clickid}` |
| Sandbox (automatic tests) | http://161.97.110.121:9999 |
| Server health | https://affiliate.asesment.com/health/database |

**Passwords:** ask the admin for the panel login and the sandbox password.
They are not written here on purpose.

**Important:** always use `https://affiliate.asesment.com`.
The old address `http://161.97.110.121:3085` does not work any more.

---

## Words used in this guide

| Word | Meaning |
|---|---|
| Click | A visitor opens a tracking link. The tracker gives the visit a **click ID**. |
| Click ID | A long code like `8f7a2b91-4c3e-4d5a-8b1e-7f6a5b4c3d2e`. |
| Conversion | A sale or sign-up that came from a click. |
| Postback | The network tells the tracker: "this click made a conversion". |
| Network / source | The company that sends us postbacks. |
| Publisher | The affiliate who sent the visitor. They get paid for approved conversions. |

---

## Step 1: Check that the server is up

1. Open https://affiliate.asesment.com/health/database
2. You should see `"status":"ok"` and `"database":"connected"`.
3. If not, stop and tell the developer.

---

## Step 2: Run the automatic tests (5 minutes)

The sandbox is a fake network and a fake publisher. It tests everything for you.

1. Open http://161.97.110.121:9999
2. Enter any user name and the sandbox password.
3. Press **Create / refresh test records**.
4. Press **Run all tests**. Wait about 15 seconds.
5. Every test should show **Passed**. You should see **17 of 17 passed**.
6. If a test shows **Failed**, click nothing else. Take a screenshot and send it to the developer.
7. When you finish, press **Delete test data**, and then press it again to confirm.
   This removes the test sales from the reports.

---

## Step 3: Test by hand in the browser (15 minutes)

### 3.1 Make a test click

1. Log in to the panel: https://affiliate.asesment.com
2. Pick an active offer and a publisher. Note their ID numbers.
3. Open this link (put in your numbers). `json=1` shows the result instead of moving to the advertiser:

   `https://affiliate.asesment.com/click?offer_id=OFFER_ID&aff_id=PUBLISHER_ID&sub_id=test1&json=1`

4. Copy the value of **clickId** from the page. This is your click ID.

### 3.2 Send a conversion

Open each link below. Replace `CLICK_ID` with your click ID.

| # | Open this link | You should see |
|---|---|---|
| 1 | `https://affiliate.asesment.com/api/v1/postback?clickid=CLICK_ID&goal=1` | `"success":true` and `"status":"APPROVED"` |
| 2 | The same link again | `"duplicate":true` (no double payment) |

### 3.3 Change the status (use a NEW click ID from step 3.1)

| # | Open this link | You should see |
|---|---|---|
| 1 | `https://affiliate.asesment.com/api/v1/postback?clickid=CLICK_ID&goal=1&status=2` | `"status":"UNCHECKED"` (pending) |
| 2 | `https://affiliate.asesment.com/api/v1/postback?clickid=CLICK_ID&goal=1&status=1` | `"updated":true` and `"status":"APPROVED"` |
| 3 | `https://affiliate.asesment.com/api/v1/postback?clickid=CLICK_ID&goal=1&status=3` | `"status":"DECLINED"` |

### 3.4 Order number and amount (use a NEW click ID)

| Open this link | You should see |
|---|---|
| `https://affiliate.asesment.com/api/v1/postback?clickid=CLICK_ID&goal=1&action_id=ORDER-1&sum=49.99` | `"externalTxId":"ORDER-1"` and `"revenue":49.99` |

### 3.5 Wrong values must be refused

| Open this link | You should see |
|---|---|
| `https://affiliate.asesment.com/api/v1/postback?clickid={clickid}` | `Invalid clickid format` |
| `https://affiliate.asesment.com/api/v1/postback?clickid=CLICK_ID&sum=-5` | `sum must be a positive number` |
| `https://affiliate.asesment.com/api/v1/postback?clickid=CLICK_ID&status=maybe` | `Unknown status` |
| `https://affiliate.asesment.com/api/v1/postback?clickid=00000000-0000-4000-8000-000000000000` | `Invalid clickid` (not found) |

### 3.6 Security token (optional)

1. In the panel, open the offer. Set a **Security Token**, for example `TEST123`. Save.
2. Make a new click (step 3.1) for this offer.
3. Open the postback link **without** the token. You should see `Invalid or missing advertiser security token`.
4. Add `&secure_token=TEST123` to the link. You should see `"success":true`.
5. Remove the token from the offer again and save.

### 3.7 Check the panel

1. Open **Reports → Conversions**.
2. Your test conversions are there, with the right status and order number.

---

## Step 4: Test with one real network

1. In the offer, the **destination URL** must send our click ID to the network.
   Example: `https://network-link.com/?sub1={clickid}`
2. In the network's dashboard, set the postback link:

   `https://affiliate.asesment.com/api/v1/postback?clickid={sub1}&goal=1`

   Change `{sub1}` to the network's own name for that value.
   Add `&status=`, `&action_id=` and `&sum=` with the network's own macros if it has them.
3. Open the offer's tracking link as a visitor.
4. Use the network's **Test conversion** or **Test postback** button.
5. In the panel, open **Reports → Conversions**. The test conversion must be there.

---

## What the answers mean

| Answer | Meaning | Good or bad? |
|---|---|---|
| `"success":true` | Conversion saved | Good |
| `"duplicate":true` | Same postback sent again; nothing new saved | Good |
| `"updated":true` | Status changed (for example pending to approved) | Good |
| 400 Bad Request | Something in the link is wrong. The message says what. | Good when you test wrong values |
| 403 Forbidden | Security token is missing or wrong | Good in the token test |
| 404 Not Found | Click ID does not exist | Good in the "not found" test |
| 409 Conflict | This click already has a sale, and the network allows only one | Good when testing a second goal |
| 500, or the page does not open | Server problem | **Bad.** Tell the developer. |

---

## How to report a problem

Send the developer:

1. The step number (for example "Step 3.3, row 2").
2. The full link you opened.
3. What you saw (copy the text or take a screenshot).
4. The time you did it.

---

## When you finish

1. In the sandbox, press **Delete test data**.
2. Tell the developer which test clicks you made by hand (sub ID `test1`, `test2` …) so they can be removed from reports.
3. If you set a security token on a real offer, remove it.

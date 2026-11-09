# Affiliate Sandbox

A **test-only** fake network and fake publisher. They use the tracker exactly like real partners do:

```
visitor ──▶ tracker /click ──302──▶ sandbox "advertiser page"
                                          │  (Approve / Pending / Chargeback …)
                                          ▼
          tracker /api/v1/postback ◀── sandbox "network"
                    │  (approved conversions only)
                    ▼
          sandbox /publisher/postback   ("publisher" receives its payout)
```

> Never run the sandbox against the production tracker. It creates real clicks and conversions.

## What it checks

| Area | Tests |
|---|---|
| Basic flow | Tracking link redirects with a click ID; approved conversion saved with the offer payout |
| Retries | Same postback 2–3 times and 10 at once: one conversion, all answered 200, one publisher payment |
| Status changes | Pending → approved → chargeback on one conversion; declined is never paid |
| Request styles | GET link, POST form, POST JSON, other names (`click_id`, `amount`, `transaction_id`), capital letters |
| Goals | Second goal refused or accepted depending on the network setting |
| Security token | Missing, wrong, right (`secure_token`), and in a header |
| Wrong values | Unreplaced `{clickid}`, unknown click, bad amount, unknown status: clear answer, nothing saved |
| Pixels | Image and script pixels |
| Tracker log | Every postback the sandbox sent appears in the tracker's postback log |
| Publisher | Tracker sends the publisher postback with the right payout, only for approved conversions |

## Test records it creates in the tracker

| Record | Purpose |
|---|---|
| Sandbox Network (one conversion per click) | Network that refuses a second conversion on a click |
| Sandbox Network (many goals per click) | Network that allows lead + sale on one click |
| Sandbox Publisher (`sandbox.publisher@sandbox.test`) | Its postback URL points at this sandbox |
| Sandbox Offer / (multi-goal) / (token) | Destination URL is the sandbox advertiser page; payout 6, revenue 10 |

Sandbox clicks have sub IDs starting with `sbx-`. **Delete test data** (screen) or `npm run cleanup` removes the
sandbox offers with all their clicks and conversions. The next setup creates them again.

## Settings (`.env`)

| Name | Meaning |
|---|---|
| `PORT` | Port to listen on (9999) |
| `TRACKER_URL` | Tracker panel address, e.g. `http://161.97.110.121:3085` |
| `SANDBOX_PUBLIC_URL` | Address the tracker uses to reach this sandbox. Must be public (not localhost), otherwise publisher checks are skipped |
| `SANDBOX_PASSWORD` | Password for the screen and API. Without it the sandbox stays locked |
| `TRACKER_ADMIN_EMAIL` / `TRACKER_ADMIN_PASSWORD` | Tracker admin login, used to create and delete the test records |
| `SANDBOX_OFFER_TOKEN` | Security token set on the token offer |

## Use it

**On the test server (full checks, including the publisher step):**

```bash
./sandbox/deploy.sh                 # build, push, start on 161.97.110.121:9999
# first time only: fill TRACKER_ADMIN_EMAIL / TRACKER_ADMIN_PASSWORD in
# /deployments/affliate-sandbox/.env on the server, then: docker compose up -d
```

Open `http://161.97.110.121:9999`, enter the password (any user name), press **Create / refresh test records**, then **Run all tests**.

**On your computer (publisher step is skipped: the tracker refuses to call local addresses on purpose):**

```bash
cd sandbox && npm install
cp .env.example .env               # set TRACKER_URL to your local tracker
npm run test:all                   # all tests, pass/fail table, exit code 1 on failure
npm run test:all -- retry token    # only some tests
npm run dev                        # the screen on http://localhost:9999
npm test                           # sandbox's own unit tests
```

## Code map

| Folder | What is inside |
|---|---|
| `src/config.ts` | All settings, record names, paths |
| `src/tracker/` | Talking to the tracker: admin API (`admin.ts`), clicks and postbacks (`traffic.ts`), network styles (`profiles.ts`) |
| `src/scenarios/` | Test list (`catalog.ts`) and the runner |
| `src/web/` | Screen, fake advertiser page, password check |
| `src/server.ts` / `src/cli.ts` | Web server / command line |

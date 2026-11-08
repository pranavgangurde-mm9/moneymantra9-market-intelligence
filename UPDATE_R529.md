# MoneyMantra 9 — R5.2.9 — Special-session 15-second refresh fix

## What caused the problem

On Sunday 8 November 2026, NSE held Diwali Muhurat Trading. The earlier application had **two independent weekend checks**:

- **Frontend:** `marketOpenNow()` returned `false` on every Sunday. When the app believed the Indian market was closed, `fetchProxyMarket()` could reuse the last Indian quote for **up to 120 seconds**, although the top 'Checked' timestamp and countdown still advanced approximately every 15 seconds.
- **Cloudflare Worker:** `exchangeOpenForCache('india')` returned `false` on every Sunday and placed successful `/api/live-quotes?group=india` responses in its **90-second closed-session cache** rather than the **14-second open-session cache**.

Therefore automatic checks did **not** mean new source requests every 15 seconds during today's special session. Manual refresh bypassed the frontend's local throttling, but still depended on the public-provider data timestamp and Worker response cache.

## Fixes in R5.2.9

1. Both the frontend and Worker now explicitly recognize NSE's **8 Nov 2026 Muhurat equity session**:
   - 14:05–14:20 IST: Pre-open.
   - 14:20–15:30 IST: Open (eligible non-CAS equity trading; closing auction arrangements vary by security).
   - After 15:30 IST: Closed for the standard continuous cash session.
2. While that equity session is open, the frontend permits an Indian market-source fetch roughly every 15 seconds, and the Worker uses its ~14-second active-session cache instead of 90 seconds.
3. The status badge identifies **OPEN · MUHURAT** during the special equity session.
4. Under **Data source details**, the app displays the latest Indian quote's own observation time, separately from the app's latest **Checked** time.
5. The Worker quote-group cache key has changed so a previously stored 90-second weekend response is not reused after deployment.
6. The existing full R5.2.8 application is preserved, including F&O participant positions, sector drill-downs, investor insights, history, Gold/Silver, Finance AI, policies and reports. Razorpay payment access is still disabled.

**Important:** A check approximately every 15 seconds is **not** a guarantee of a changed Nifty price every 15 seconds. The existing public Yahoo/other quote feeds can be delayed or publish in coarser 1-/5-minute intervals. Source observations retain the actual quote timestamps. Do not promise licensed, tick-level real-time data or commercial redistribution rights.

## Deploy to your existing setup

**Cloudflare first:** In Workers & Pages → `mm9-market-proxy` → Edit code, replace the Worker with `worker/src/index.js` from the Worker ZIP and deploy. Keep Workers AI, KV bindings and your other settings unchanged.

**GitHub second:** In `pranavgangurde-mm9/moneymantra9-market-intelligence`, replace only the existing root `index.html` and `sw.js` with the two files from the GitHub ZIP, then commit on `main`. Do not delete or replace `config.js` or existing branding/policy files. Confirm the Pages action completes.

Reload the hosted application in Chrome (on mobile, close/reopen the tab; if necessary clear this site's cached files). Test the **Checked IST** timestamp, the **Latest Indian quote** time under Data source details, and the status badge. During an exchange session, compare two checks approximately 15–30 seconds apart, but allow a longer interval for a delayed upstream quote to change.

**Endpoint to verify:** `https://mm9-market-proxy.pranav-gangurde1.workers.dev/api/live-quotes?group=india`. Its `generatedAt` and each `quotes.nifty.epoch` serve different purposes: the first is when the Worker checked, the second is the quote's actual provider observation time.

## Calendar maintenance

The 8 Nov 2026 override was added based on official NSE Muhurat circular `NSE/CMTR/76941` (19 October 2026). For future special Saturday/Sunday trading sessions, the session calendar must be updated from exchange circulars or a licensed exchange calendar; ordinary weekends remain closed.

## Tested locally

- Browser + Worker date tests at 14:10, 14:20, 15:16 and 15:31 IST, ordinary Sunday, Saturday and Monday: PASS.
- Worker and inline app script syntax: PASS.
- Mobile Chromium UI at 390px with mock quote responses: **OPEN · MUHURAT** status visible, quote requests initiated, and no page JavaScript errors: PASS.
- Live public market quote changes from the production Cloudflare Worker: **not verified** (publisher may delay/block access).

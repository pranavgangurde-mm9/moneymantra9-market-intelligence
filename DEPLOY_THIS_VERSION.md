# MoneyMantra 9 Market Intelligence — Build 2026.10.22-R2

This update applies to your EXISTING GitHub repository and Cloudflare Worker. No new repository or Worker is required.

## A. Update Cloudflare first

1. Open Cloudflare > Workers & Pages > `mm9-market-proxy` > Edit code.
2. Replace its code with the contents of `worker/src/index.js` and deploy.
3. Retain the Workers AI binding with variable name `AI`.
4. Test each endpoint in a browser (expected status is JSON with `ok:true` when upstream data is accessible):
   - `https://mm9-market-proxy.pranav-gangurde1.workers.dev/health`
   - `https://mm9-market-proxy.pranav-gangurde1.workers.dev/api/symbols`
   - `https://mm9-market-proxy.pranav-gangurde1.workers.dev/api/pulse?symbol=RELIANCE.NS`
   - `https://mm9-market-proxy.pranav-gangurde1.workers.dev/api/market`
   - `https://mm9-market-proxy.pranav-gangurde1.workers.dev/api/gold`
   - `https://mm9-market-proxy.pranav-gangurde1.workers.dev/api/silver`
   - `https://mm9-market-proxy.pranav-gangurde1.workers.dev/api/sector?name=IT`

Only `POST /api/ask` can be tested inside the app or an API client. Do not test it with a plain browser GET.

**Important:** `ok:false` from `/api/symbols` or `/api/gold` can mean the publisher blocked Cloudflare or its site changed. The app will not manufacture prices, and known ticker symbols can still be entered manually. NSE symbol listings are authoritative for the exchange's main-board equity securities; unlisted, SME-only, BSE-only, or unusual securities may not appear in this directory.

## B. Optional: prepare the NSE directory before users open the app

The default app refreshes the NSE CSV on the FIRST visitor request of the day and uses a locally saved list on subsequent visits. To make it server-side scheduled before opening:

1. Cloudflare > Storage & databases > KV > Create namespace, e.g. `MM9_STOCK_DIRECTORY`.
2. Cloudflare > Workers & Pages > `mm9-market-proxy` > Settings > Bindings > Add binding > **KV namespace**.
3. Bind the created namespace using the variable name exactly `SYMBOLS_KV` and deploy/save.
4. In the same Worker, open Settings > Triggers > Cron Triggers > Add a Cron Trigger.
5. Set `45 1 * * mon-fri` (UTC), meaning approximately **7:15 AM IST Monday–Friday**.
6. The Worker `scheduled` handler fetches the official directory and saves the last successful list in KV. If NSE blocks the fetch, the previous list remains in KV; the app marks it as cached.

Cron timing is not guaranteed to execute to the second. The stock list remains source-dependent. If using Wrangler, `worker/wrangler.jsonc` already includes the Cron expression; include a KV binding ID appropriate for your own Cloudflare account before deploying by CLI.

## C. Update your existing GitHub Pages website

1. Open `pranavgangurde-mm9/moneymantra9-market-intelligence` > Code.
2. Upload and replace the ROOT files `index.html`, `config.js`, `sw.js`, `manifest.json`, `brand-logo.png`, `icon-192.png`, and `icon-512.png`.
3. Optionally commit the `worker/` folder to store backend code in GitHub, but don't accidentally make GitHub Pages use that folder as the site root.
4. Commit to `main`; verify a new GitHub Actions Pages deployment is completed with a green check.
5. Open `https://pranavgangurde-mm9.github.io/moneymantra9-market-intelligence/` and check that **20 completed-session closes, New chat / Clear, and Copy report** appear. If an old interface persists, refresh or remove the old site's service-worker data. The build identifier is kept in HTML metadata, not shown in the mobile header.

## D. Client acceptance tests

- Home > Choose what to watch: type `RELIANCE.NS` or `INFY.NS`; see distinct stock data; return to Indian Market to see Nifty Pulse.
- NSE directory: check the number of NSE tickers loaded or its cached/unavailable status. Reopen the app during the same Indian day to confirm no repeated directory download on that device.
- 15 Minute, 30 Minute, 1 Hour and Daily: verify each has its own label, source time and completed-candle indicator.
- Historical log: select two different stocks; check that the last 20 completed closes, dates and line-chart tooltip change by symbol; export CSV.
- Home trend: hover or tap to see time and Nifty % on chart. Markets > Sector: tap a sector and move/tap along its trend chart.
- Markets > Gold / Silver: no `NaN`, no international XAU/USD conversion; show a *dated Indian bullion benchmark* or a clear unavailable state.
- Radar: no-data symbols should appear as unknown instead of a false red signal.
- AI: ask `What is the latest Indian 22K gold rate for 10g?`, `What about silver?`, `How did Nifty move?`, and a follow-up. Use **New chat / Clear** to clear the local chat context.
- Investor: generate Current Brief and Closing Report. Click Copy, then Share on WhatsApp and enter a phone number if desired. WhatsApp opens a PREPARED MESSAGE; the user must press Send.

## E. Accuracy and limitations

- The `15 seconds` setting is the interval between source checks, **not a guarantee of 15-second exchange-fresh pricing**.
- Historical 20-day closes come from the public chart feed. They are historical market observations, NOT a 20-day backtest of historical signal predictions.
- The NSE ticker master can be blocked/rate-limited by NSE from the Worker. A previously cached list is used when available; entries can also be entered manually via exchange ticker.
- Indian bullion benchmark and its date are distinct from MCX traded futures prices and jewellery-counter quotations.
- No API or publisher permission is bypassed; failed providers are reported as unavailable.
- The public data adapters may have use/republication restrictions: check relevant terms before commercial distribution.
- The chat and report features are educational; no trading advice, no guaranteed returns, no automated WhatsApp sending.

# MoneyMantra 9 – R5.2.8 – Automatic F&O Participant Reports

This is an **incremental update** to the full R5.2.7 application. Razorpay payment collection remains disabled.

## What is different for clients?

- In **Markets → F&O Participant Positioning**, the app checks the latest available **F&O Participant-wise Open Interest** report when the panel is opened.
- A dated FII / DII / PRO / Client view is the main screen, not a CSV upload form.
- If previously verified data is available, it stays visible, labelled with the original trading date. A new daily publication can replace it.
- **Check latest report** allows an on-demand check. **Import an NSE report (optional)** remains collapsed, available only when the official source cannot be fetched.
- The previous session's positions enable net-OI change calculations when both files are accessible. Open interest is NOT an executed-trade or buy/sell ledger.

## Why a CSV file was previously requested

NSE maintains a daily archive at a URL with a dated filename such as `fao_participant_oi_06112026.csv`. The prior Worker already tried automated retrieval, but NSE sometimes refuses requests from cloud-hosted servers (HTTP 403, timeouts, missing files). The manual upload was intended as a fallback, not the primary user experience. This revision fixes the fallback presentation and adds an optional **shared verified-report cache**.

## Deployment to existing services

1. **Cloudflare Worker:** Workers & Pages → `mm9-market-proxy` → Edit code → replace with `worker/src/index.js` → Deploy. Keep AI and all existing settings.
2. **GitHub Pages:** In repository `pranavgangurde-mm9/moneymantra9-market-intelligence`, replace root `index.html` and `sw.js` with the GitHub two-file package. Commit to `main`; confirm Pages deployment succeeds.
3. **Test the endpoint:** `https://mm9-market-proxy.pranav-gangurde1.workers.dev/api/positions`. A successful response has `ok:true`, an exact `date`, `current.FII`, `current.DII`, `current.PRO`, `current.RETAIL`, and optionally `previous`/`previousDate`.
4. On the hosted app, open Markets → F&O Participant Positioning. Confirm that the daily report loads, date displays correctly, and the optional upload form is collapsed.

## Recommended extra setup: shared Cloudflare KV storage

This is **optional but strongly recommended** if more than one person will use the app.

- In the Cloudflare dashboard, create a KV namespace called `mm9-positions` (name is your choice).
- Open Worker `mm9-market-proxy` → Settings → Bindings → Add → KV namespace. Set binding variable **`POSITIONS_KV`** and select your new namespace. Save/deploy.
- There is no API key and no user information stored in this namespace. It stores the last successfully parsed, dated official participant report and (when available) the prior session's data.
- **Optional scheduled check:** add Worker Cron trigger `45 13 * * mon-fri` (13:45 UTC = 19:15 IST). The Worker already contains the scheduled handler. This trigger is distinct from the existing symbols-directory morning job. When deploying with Wrangler, it is included in `worker/wrangler.jsonc`; dashboard-only code edits do not add triggers automatically.

**KV does not solve an NSE source that is blocked on every attempt.** A saved report exists only after a successful authorised retrieval. If NSE blocks all requests, the screen displays an unavailable message and the optional original-file import remains available. An authorised, commercially licensed exchange-data source is the appropriate long-term solution for a paid product.

## Source and limitations

Official NSE reports: https://www.nseindia.com/all-reports-derivatives

Technical specification: https://archives.nseindia.com/content/press/EOD_FAO.pdf

- Data is published at end of trading day, not every 15 seconds. Some dates are non-trading days or published later than expected.
- CSV filename and contents are checked. Invalid/incomplete files are not used.
- Never describe the report as live exchange prices or guaranteed trade signals.
- The app remains in free/pre-monetisation mode; no Razorpay checkout or paid entitlement has been enabled.

## Validation completed in this build

- Worker JavaScript syntax check passed.
- Frontend inline JavaScript syntax check passed.
- Simulated two-session reports parsed and returned the correct FII index futures and net changes.
- Simulated blocked NSE fetch returned an explicit unavailable response.
- Shared KV fallback returned the previously verified report, preserving its date when the upstream source was blocked.
- Frontend rendering tests checked empty, loading and verified-data states and a collapsed manual import.

Live NSE fetch and a fully deployed browser test are **not** verified here; validation above uses simulations.

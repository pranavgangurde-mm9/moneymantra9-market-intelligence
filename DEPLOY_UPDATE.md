# Update your existing MoneyMantra 9 app (no new repository required)

## 1. Update your existing Cloudflare Worker
Cloudflare Dashboard → Workers & Pages → `mm9-market-proxy` → Edit code.
Replace the **entire** existing code with this ZIP's `worker/src/index.js`. Click Deploy. Keep the Workers AI binding named `AI`.

### Quick Worker tests
Open these URLs in your browser after deployment:

- Market: https://mm9-market-proxy.pranav-gangurde1.workers.dev/api/pulse?symbol=%5ENSEI
- Reliance: https://mm9-market-proxy.pranav-gangurde1.workers.dev/api/pulse?symbol=RELIANCE.NS
- Infosys: https://mm9-market-proxy.pranav-gangurde1.workers.dev/api/pulse?symbol=INFY.NS

Look for `ok: true`, a `quote`, `periods` with `m15/m30/h1/d1`, and `history`. A timeframe can correctly be `null` if no completed candle is yet available. Prices depend on the public upstream provider.

## 2. Update GitHub Pages (existing repo)
Upload/replace these files **at the root** of your existing repository:

- `index.html`
- `config.js`
- `sw.js`
- `manifest.json`
- `brand-logo.png`
- `icon-192.png`
- `icon-512.png`
- `README.txt`

Optionally add `RELEASE_NOTES.md` and this guide.

Commit to `main`. GitHub Pages should redeploy automatically. The package's `config.js` already contains your Cloudflare Worker base URL; do not add `/api/pulse` to its value.

## 3. Mobile verification
Open your existing GitHub Pages HTTPS URL and test:

- Current (market): the 15-second refresh mechanism remains active.
- 15 Min / 30 Min / 1 Hour: the panel reads **completed** candles, not 15-second movement.
- Daily: displays latest **completed** trading day; updates after exchange close when the source delivers final data.
- Enter `RELIANCE.NS`, `INFY.NS`, or use the suggested stock buttons.
- Switch back to **Market (Nifty)**.
- Check the local 20-session log and CSV export.
- Make sure Radar, Markets, Sector Intelligence, AI, Investor and More still work.

If your PWA displays the old screen, close it and clear site storage/cache once, or reinstall the PWA.

## How to interpret the 20-day integrity test
Ask each client to use the app on at least 20 distinct trading sessions. At a consistent time (for example after 15:30), compare the Nifty and selected stock's *data timestamp, price, and percentage change* against a verified broker/exchange source; record discrepancies and outages.

The app's log is **browser-local** and collects observations only while opened; it does not automate unattended daily monitoring. A centrally scheduled 20-day study requires Cloudflare Cron + persistent D1 storage + a licensed benchmark/reference. The pulse score is a descriptive momentum measure, not a statistically validated prediction.

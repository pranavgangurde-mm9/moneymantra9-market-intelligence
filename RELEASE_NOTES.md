# MoneyMantra 9 Market Intelligence — Stock Watch + Timeframe Pulses

## New controls
- **Current**: 15-second quote check, not a guarantee of 15-second exchange quotes.
- **15 Min / 30 Min / 1 Hour**: scores built from completed 5-minute chart candles, aggregated from 09:15 IST, updated when the timeframe finishes.
- **Daily**: score from the latest **completed trading-day** close; current day's bar is not treated as final until after 15:30 IST and an exchange-close quote is available.
- **Stock selector**: Reliance, Infosys and other suggested NSE shares. You can enter valid exchange tickers such as `RELIANCE.NS`, `INFY.NS`, `TCS.NS`, or BSE `.BO` codes accepted by the upstream provider. Stock score measures **stock price momentum**, not Nifty breadth or a trade recommendation.
- **20-session observation log**: saves the last completed daily reading when this browser retrieves it; CSV export allows clients to check data against their source. This is **not forecast accuracy**.

## Important difference: clock versus source
- The app checks current market data approximately every 15 seconds while visible.
- 15m/30m/1h scores only change when a **complete candle** is available, not every 15 seconds.
- A 60-minute candle anchored to 09:15 closes at 10:15, 11:15, etc. The final 15 minutes of the exchange day are not mislabeled a complete hour.
- Public quotes may be delayed or throttled. Missing bars produce 'Awaiting Data', not a fabricated pulse.
- After market close, the last completed Indian-market snapshot remains visible; GIFT and global markets have separate trading windows.

## Update existing deployments
1. Cloudflare Dashboard → Workers & Pages → `mm9-market-proxy` → **Edit code**. Replace the script with `worker/src/index.js` and Deploy; keep Workers AI binding `AI`.
2. Test `https://mm9-market-proxy.pranav-gangurde1.workers.dev/api/pulse?symbol=%5ENSEI` and `.../api/pulse?symbol=RELIANCE.NS`. Look for `ok:true` with `periods.m15`, `periods.m30`, `periods.h1`, `periods.d1` (some may be null before first completed period).
3. Upload/replace `index.html`, `config.js`, `sw.js`, icons, and `manifest.json` at your existing GitHub Pages repository root. The package already has your Worker URL in `config.js`.
4. Commit and wait for the GitHub Pages redeploy. Clear an old installed PWA's cache if it still shows previous app code.
5. Test on mobile: Market Current, 15m, 30m, 1h, Daily, Reliance, Infosys, and local CSV export.

## 20 trading-day evaluation
An observation is saved **only when your browser retrieves a completed daily record**, and is stored **locally on this browser**. This does not record unattended sessions or provide multi-device persistence. For a true 20-session always-on integrity assessment, deploy a scheduled Cloudflare Worker with persistent D1 storage and compare quote timestamps/levels against a licensed or exchange-authorized benchmark.

**Not a licensed live feed or financial recommendation.**

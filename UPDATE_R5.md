# MoneyMantra 9 — R5 update

This release builds on the Razorpay review/navigation build and retains all policy pages, six tabs, market and sector features. No payment gate is activated.

## Changes
- Matching doughnut / direction ring across Current, 15 Min, 30 Min, 1 Hour and Daily, for both Nifty and selected NSE stocks.
- The intraday line chart automatically changes from Nifty to the selected stock; each chart point shows the corresponding market price and percentage relative to previous close, when supported.
- Cloudflare `/api/pulse` now returns `intraday: {sessionDate, previousClose, points, source, lastBar}` from observed 5-minute price bars for the selected symbol. Never mixes different days' bars.
- The previous ambiguous 'Period data & freshness' is replaced with 'When was this reading updated?', a per-frame explanation and source-observation timestamp.
- Button checks the last available completed candle or daily close; it cannot force a market-data provider to publish new data.

## Deploy, using EXISTING GitHub + Cloudflare
1. Cloudflare → Workers & Pages → `mm9-market-proxy` → Edit code → paste the complete `worker/src/index.js` from this ZIP → Deploy. Keep binding AI and existing secrets/settings.
2. Check `/api/pulse?symbol=RELIANCE.NS` includes a nonempty `intraday.points` array when the public quote source is available. Also check `/api/pulse?symbol=%5ENSEI`.
3. On GitHub replace `index.html` and `sw.js`, and keep the existing policy pages, icons and `config.js`. If uploading the whole package, only put files from the root folder in GitHub root; do not upload the `worker` folder as a public site.
4. Once GitHub Pages deployment succeeds, clear cache (Ctrl+Shift+R) and look for Build R5.
5. Test Market / Current, Market / 15 Min, Market / Daily, Reliance / Current, Infosys / 30 Min, and price charts in each case.

## Important limitations
The chart is generated from available 5-minute public-source bars. A 15-second source check does not imply a 15-second price tick. Some tickers/providers may return no bars or delayed bars; the app then displays a clear unavailable message. Direction score and rings are educational measures, not predictions. Real market data needs live verification after Cloudflare deployment.

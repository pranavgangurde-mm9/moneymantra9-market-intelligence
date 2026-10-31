# MoneyMantra 9 — R5.2 15-second data checks (pre-monetization test build)

## What changed
- Every 15 seconds while the app is in the foreground, it checks the data status. Network quote requests occur approximately every 15 seconds for active source sessions, and use local/edge caching when the markets are closed. The quote source may still provide delayed, 5-minute, or closing values.
- The old CPU-intensive `/api/market` endpoint is no longer called by the R5.2 frontend on automatic refresh. It remains in the Worker for backwards compatibility.
- New lightweight endpoints: `/api/live-quotes?group=india` and `/api/live-quotes?group=global`. Each group fetches four indices instead of the old 19-source request.
- GIFT Nifty is checked at 15-second intervals only during a reported GIFT session when the official feed is working; failed requests back off to 60 seconds.
- Indian sector index quotes are loaded separately in `/api/sector-quotes?part=0`, `part=1`, and `part=2`, approximately every 90 seconds. Sector detail drilldowns remain available through existing endpoints.
- During active source hours the Worker caches each quote group for approximately 14 seconds. During closed sessions it keeps a longer cache because the source price is not trading.
- The website header reports Build R5.2 and 'Checked', while quote timestamps remain unchanged until new source observations arrive.
- Existing policy pages, Razorpay configuration, branding, AI, reports, stocks and charts remain unchanged.

## Deploy into existing infrastructure
1. Cloudflare Workers & Pages > `mm9-market-proxy` > Edit code. Replace with **`worker/src/index.js` from this package**, then deploy. No new Worker or key needed.
2. Check URLs directly:
   - https://mm9-market-proxy.pranav-gangurde1.workers.dev/api/live-quotes?group=india
   - https://mm9-market-proxy.pranav-gangurde1.workers.dev/api/live-quotes?group=global
   - https://mm9-market-proxy.pranav-gangurde1.workers.dev/api/sector-quotes?part=0
   A healthy source response reports `ok:true` plus quotes with their actual `epoch`. If `ok:false`, do not call it live.
3. GitHub root `moneymantra9-market-intelligence` > upload ONLY **index.html** and **sw.js** from this package. The remaining files may stay unchanged. Commit and check the Pages action.
4. Confirm the header reads **Build R5.2**. Open two browsers; check that a refresh takes place at ~15 seconds and it does not freeze.
5. Check Cloudflare Observability. `/api/market` CPU failures should stop for the new frontend, but direct external callers or older open tabs may still call it.

## Older GitHub files
`README`, `*.md` documentation, and `worker/` as GitHub source do not by themselves conflict with the website. `index.html` is the published root page; `config.js`, `sw.js`, brand image, manifest, icons and the eight policy HTML files remain necessary. A root `index.js` is not loaded by R5.2 because the page does not reference it. Do not delete `worker/` unless certain you will never use GitHub-based Worker deployment.

## Critical commercial-release limitations
- This is **15-second source checking**, NOT a guaranteed 15-second streaming market feed. Public Yahoo/NSE endpoints can deliver delayed, unchanged or blocked prices, and their commercial redistribution permissions must be checked.
- A 15-second per-client interval can generate up to 5,760 polling rounds/day/client when left open continuously; 100,000 requests/day on Workers Free can be exhausted well before large scale. A commercial product needs centralized scheduled collection, durable caching and an authorized market data source, rather than every user querying independently.
- `Build R5.2` still needs real Cloudflare deployment tests; local syntax and simulated endpoint tests are not live data verification.

**Before charging clients:** A public Yahoo Finance source is not a licensed low-latency market-data product. Verify pricing, commercial redistribution rights, concurrency and end-to-end quote delays.

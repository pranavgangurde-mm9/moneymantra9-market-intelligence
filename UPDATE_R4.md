# MoneyMantra 9 — R4: GIFT, Breadth, 12 Sectors, Constituent Watch

## Updated in this build

1. Separate `/api/gift` NSE market-status quote adapter. Checks `giftnifty.LASTPRICE`, `PERCHANGE`, `TIMESTMP`, validates quote timestamp and prevents an old GIFT quote from being shown as live. Retains a timestamped 72-hour last-valid cached observation if official API is temporarily unavailable. GIFT session hours remain independent of Indian cash-equity session hours. **NSE may block requests to the public API from Cloudflare, so retrieval is not guaranteed.**
2. `/api/breadth` now accepts NSE's official summary object when present (adv + dec + unchanged == 50) or all 50 constituent rows. If inaccessible, the frontend can call `/api/breadth-batch?part=0` and `?part=1`, each Worker request fetching 25 Yahoo `.NS` quotes selected from the published NSE Nifty 50 constituent CSV, and will report breadth only when exactly 50 quotes are received and both batches share a quote date. This fallback uses many public requests and may also be rate-limited. It caches successful batches for 15 min, and preserves a dated last-valid result in the browser (max 3 days).
3. Sector Pulse lists **12 monitored sectors only**: IT, Auto, Pharma, FMCG, Metal, Realty, Energy, PSU Bank, Financial Services, Infrastructure, Media and Banking. Missing source values remain unavailable. The user sees a truthful 12-sector count.
4. Each published sector constituent is a keyboard/touch accessible **Watch** button. Tap and it closes the sector modal, navigates to Home, and selects `SYMBOL.NS` in Choose what to watch, automatically requesting the stock's quote/history/pulse.
5. Sector list remains clickable; standard market, AI, Gold, Silver, Singapore and Report features are retained.

## Deploy to existing services

A. Cloudflare > Workers & Pages > `mm9-market-proxy` > Edit code: replace whole script with `worker/src/index.js` and deploy. Keep Workers AI binding `AI` and existing optional environment settings unchanged.

B. Test:
- `https://mm9-market-proxy.pranav-gangurde1.workers.dev/api/gift`
- `https://mm9-market-proxy.pranav-gangurde1.workers.dev/api/breadth`
- if breadth `ok:false`, inspect `/api/breadth-batch?part=0` and `/api/breadth-batch?part=1`
- `https://mm9-market-proxy.pranav-gangurde1.workers.dev/api/sector-constituents?name=Auto`

C. GitHub `pranavgangurde-mm9/moneymantra9-market-intelligence`: replace root `index.html`, `config.js`, `sw.js` (plus assets if needed); commit to `main`. Verify Pages Actions has green success. Refresh Chrome cache/PWA cache once. Do not upload into a nested folder.

D. Open Markets > Sector Pulse > Auto > Ashok Leyland (or another constituent). It must open Home with the company's `.NS` symbol selected. Check that its stock pulse and 20-day history load separately from Nifty.

## Accuracy limits
NSE public APIs or Yahoo Finance can block requests; endpoints surface honest errors and last-verified timestamps. Source quotes may be delayed. The fallback breadth is calculated from constituent stock % changes and labelled as such, not represented as an official live NSE breadth print. Weekend/holiday trading schedules can differ from weekday clocks. A licensed provider is recommended for high-assurance public commercial use.

# MM9 R5.1: Website and Cloudflare market performance fix

## Identified issues
- Cloudflare error `Worker exceeded CPU time limit` for GET `/api/market` (Worker Free has a 10ms CPU limit per request).
- Two ~488KB base64 logos in index.html made the app's HTML unnecessarily large.
- Sticky policy/header and refresh-bar offsets could overlap.
- `/api/market` requested 5-minute charts for 19 indices even though only Nifty needs intraday chart data.
- Every Nifty timeline point created its own expensive Intl.DateTimeFormat.

## Fixes
- Replaced both embedded logos with existing `brand-logo.png`, making the HTML much smaller.
- Removed overlapping sticky policy and refresh bars. All policy HTML is standard same-tab navigation.
- Optimized Worker: single formatter for the Nifty timeline; compact single-session daily quotes for all non-Nifty symbols, preserving day high and low.
- Added per-isolate de-duplication and a 45-second successful market-response cache.
- Closed-market automatic checks are now one minute; Indian open-market checks remain every 15 seconds. A check is not proof a source has published a new quote.
- All policy pages and R5 market controls remain present. This is not a new payment gate.

## Deployment: Two independent steps
1. **Cloudflare**: `Workers & Pages` > `mm9-market-proxy` > `Edit code`. Replace with `worker/src/index.js`, **Deploy**. No API key or binding changes.
2. Test `https://mm9-market-proxy.pranav-gangurde1.workers.dev/api/market`. Look for JSON `ok:true`. Watch `Observability > Events` to confirm CPU-time limit errors reduce/disappear.
3. **GitHub**: upload **only** `index.html` and `sw.js` from this release **plus** `brand-logo.png` if missing. The other existing policy HTML pages do not need replacement. Commit to `main` and wait for Pages deployment success.
4. Verify Build R5.1 and directly open `/policies.html`, `/terms.html`, `/pricing.html`, `/contact.html`.
5. Leave Razorpay scanning as-is. If scanning persists, raise a support ticket with the submitted site URL and submission time; do not regenerate keys or resubmit in a loop.

## Limits
- Source availability and CPU reduction cannot be guaranteed without a real Cloudflare production test. If the Worker still exceeds Free's CPU limit, split `/api/market` into smaller core and sector endpoints or evaluate Workers Paid after profiling; do not mask failures with fabricated quotes.
- Razorpay review status cannot be changed by editing this package.

# MoneyMantra 9 · India bullion + modal stability fix

## What changed
- No more compare-major-cities screen; users retain the city selector and **Check city** button in Gold.
- Gold and silver default to a dated **Indian** bullion benchmark from All India Bullion (`https://allindiabullion.com/benchmark`) with attribution and exact source date. No XAU/USD or XAG/USD conversion is presented as an Indian price.
- Gold 24K is sourced per 10g; 18K/20K/22K/23K are **derived metal-value equivalents** by fineness (750, 833, 916, 958). Rates exclude GST and jewellery-making charges.
- Silver 999 is supplied by the same dated Indian benchmark per kilogram; gram value is a unit conversion.
- The Worker caches national figures for 30 minutes; the underlying benchmark is published daily, **not live every 15 seconds**. A checked timestamp is not a new market quote.
- If the publisher declines a request, rates show unavailable or a *dated* previous successfully loaded Indian reference on the same device, never a silent international fallback.
- Gold, Silver, and Sector screens are protected against in-flight asynchronous responses overwriting another sheet. Opening a new sheet resets the previous one; closing invalidates pending sector responses.

## Deploy to existing infrastructure
1. Cloudflare → Workers & Pages → `mm9-market-proxy` → Edit code. Replace with `worker/src/index.js` and **Deploy**; leave AI binding unchanged.
2. Test `/api/india-metals` first, then `/api/gold` and `/api/silver` on your Workers URL.
3. GitHub repository → replace root `index.html` and `sw.js` (and optional package docs). Keep your existing `config.js` URL.
4. Commit, confirm the latest Pages workflow succeeds, and clear old website/PWA cache once.
5. Open Markets: tap Gold, close, then tap Silver, then tap a sector; after several seconds check that the sheet has not switched contents.

## Source and limits
All India Bullion permits quotation of its daily benchmark with attribution. The implementation parses its public webpage and therefore remains **best effort**; publisher layouts and automated access may change. There is no claim of an official IBJA feed, an authorised MCX tick feed, or a confirmed retail jeweller rate. IBJA benchmark: `https://ibjarates.com/`; MCX licensed feed: `https://www.mcxindia.com/technology/datafeed`.

If `GET /api/india-metals` gives a 502 response, view the `detail` field. Do not update the website until this endpoint is working, or the new UI will correctly show unavailable rates.

# MoneyMantra 9 — city gold rates: reliable integration path

## What caused the blank table
Goodreturns blocks automated Cloudflare requests (HTTP 403). A GitHub redeploy cannot fix this. City-specific shop rates need a permitted upstream supplier.

## What this package changes
- Existing live market, sectors, gold, silver, SGX and Finance AI components preserved.
- City comparisons now load only when a viewer clicks Check for a city (previously opening comparison could make 12 paid API lookups immediately).
- API supports **API Express** as preferred provider (if APIEXPRESS_KEY secret is supplied), then **Nebula Metals** if NEBULA_API_KEY secret is supplied.
- Stores prior successful city readings on the *viewer's current browser*, with source/date; does not re-label historical values as live.
- Shows a national spot-derived baseline separately (same across cities, NOT a quoted city price).
- Invalid/incomplete data returns a transparent failure; no invented prices.
- City-provider results cached for ~6 hours per Cloudflare colo. Cache is not a global credit cap and source access is not free forever.

## Provider options / pricing (check before purchase)
1. API Express (https://www.apiexpress.in/apis/commodity-price): documentation advertises a 1,000-call introductory free tier, 60+ cities, and 22K/24K quotes. The current pricing/renewal, actual response schema, content rights and quote accuracy MUST be verified with an actual registered key first. Its online example appears illustrative and should never be used as a live quote.
2. Nebula Metals (https://metals.nebulaapi.com): starts with 100 prepaid credits, no automatic refill. City API supports 18K/22K/24K. Browser-safe Worker secret only.
3. IBJA (https://indiagoldratesapi.com/): national benchmark only, not city-specific. Requires license for official API and usage.

## Setup
1. Cloudflare Workers & Pages → mm9-market-proxy → Settings → Variables and secrets → Add *encrypted secret* `APIEXPRESS_KEY` (only if choosing API Express) or `NEBULA_API_KEY` (if choosing Nebula). Keep keys OFF GitHub and away from browser code.
2. Deploy `worker/src/index.js` via Cloudflare Edit code.
3. Test `https://mm9-market-proxy.pranav-gangurde1.workers.dev/api/city-gold?city=Mumbai`; check `ok`, source, publishedDate, rates and independent provider validation.
4. If it returns unavailable, **do not deploy based on mocked prices**. Contact the provider to confirm production access, source terms, date semantics and GST.
5. Replace root `index.html` and `sw.js` in existing GitHub Pages repo (config.js unchanged). Commit once. Do not trigger extra GitHub workflows while one deployment is queued.
6. Clear app site storage once, then Markets → Gold Watch → Compare cities. Press Check only on desired cities.

## Data freshness and trust
The worker never claims that an API's supplied rate is a named jeweller's counter quote. 18K is derived when the upstream provides only 22K and 24K. 20K/23K are mathematical purity conversions, *not* publisher rates. Jewellery labour, stones, buyback discount etc. must be checked directly. Live source access is not possible without permission or credentialled provider.

## Next production improvement
For clients at scale, add a Cloudflare KV-backed daily snapshot and schedule 12 city lookups (e.g. twice per trading day), rather than charging credits for each geographic cache miss. This requires a KV binding and a scheduled Worker; this package does not pretend to contain that unconfigured service.

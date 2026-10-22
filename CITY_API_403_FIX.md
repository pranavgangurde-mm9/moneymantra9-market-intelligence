# MoneyMantra 9: Fix city-gold HTTP 403

The current Goodreturns city pages reject automated Worker requests with HTTP 403. This is a restriction at the publisher; changing GitHub, HTTPS, or Workers AI will not fix it. This patch removes automated Goodreturns page fetching.

## Optional city-rate API (Nebula Metals)
1. Review the provider and obtain an API key from https://metals.nebulaapi.com/ . A free starter credit allowance is advertised; additional use may cost money. Confirm commercial display terms before sharing publicly.
2. Cloudflare dashboard > Workers & Pages > mm9-market-proxy > Settings > Variables and secrets > Add variable. Choose Secret/Encrypt, name **NEBULA_API_KEY**, value your private API key. Never put it into GitHub, config.js, index.html, or a chat.
3. Update the existing Worker with worker/src/index.js from this package and Deploy. Existing Workers AI binding **AI** remains in place.
4. Test https://mm9-market-proxy.pranav-gangurde1.workers.dev/api/city-gold?city=Mumbai . With the key enabled, a successful response should contain ok:true, city, rates, publishedDate/quoteTimestamp, and gstIncluded:true.
5. In existing GitHub Pages repo update root index.html and sw.js from this package. Refresh the hosted HTTPS app and open Markets > Gold Watch > City rates.

## Rate types and caveats
- 18K, 22K and 24K are third-party city indicative reference rates, **not specific shop quotes**.
- 20K and 23K are estimated equivalents scaled by metal purity from the provider's 24K pre-tax reference and GST factor.
- Jeweller margins, making charges, gemstones, discounts and BUYBACK deductions are not included.
- Provider rates include GST; do not add 3% GST a second time.
- 1 API lookup uses 1 credit, per the provider's documentation. A 12-city comparison may consume up to 12 credits the first time. Worker caches per city for 60 minutes; geographic edge caches may not be shared globally. No 15-second city API polling.
- Without NEBULA_API_KEY, endpoint responds with a transparent setup-required error and direct public source link. It deliberately does not fabricate city prices.
- IBJA is a national benchmark, **not city-specific**, and public redistribution of its licensed rates may require authorization.

Provider: https://metals.nebulaapi.com/docs/guides/gold-prices
IBJA FAQ: https://indiagoldratesapi.com/Faqs.aspx

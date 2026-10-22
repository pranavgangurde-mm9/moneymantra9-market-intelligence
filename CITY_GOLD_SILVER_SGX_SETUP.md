# MoneyMantra 9 · City Gold, Silver and Singapore Update

## Features

1. Home > Live Market Overview now has compact Gold 24K, Silver 999 and SGX / STI tiles. Tap for details.
2. Markets > Market Session Monitor now displays six independent markets: India, GIFT Nifty, US Markets, Singapore SGX, Gold Spot and Silver Spot. The gold/silver statuses show quote freshness, not a guaranteed exchange-open indicator. SGX securities hours are calculated in Singapore time. Holidays are not verified.
3. Markets > Global & Pre-Market Cues has a new STI entry. Yahoo Finance public ^STI data is requested through the existing Cloudflare Worker and can be delayed/unavailable.
4. Markets > Gold Watch includes 18K, 20K, 22K, 23K, 24K spot-based equivalents, adjustable jewellery premium, and an Indian city retail-rate reference. Select a city or Compare major cities to see its published 18K, 22K and 24K rates when the public publisher permits automated access. 20K and 23K are *estimated by purity scaling of the city's published 24K benchmark*, not confirmed retailer quotes.
5. Markets > Silver Watch shows silver international 999 fine spot-derived INR per gram and per kg, with separate source timestamps.

## Cloudflare Worker update (EXISTING Worker)

Open Workers & Pages → `mm9-market-proxy` → Edit code. Replace the script with `worker/src/index.js` in this package and Deploy. Retain the existing Workers AI binding `AI`. No new API keys are required for the metal spot source.

Check these URLs (use the same known Worker domain):
- `https://mm9-market-proxy.pranav-gangurde1.workers.dev/health`
- `https://mm9-market-proxy.pranav-gangurde1.workers.dev/api/market` — check `quotes.sgx` when Yahoo provides it
- `https://mm9-market-proxy.pranav-gangurde1.workers.dev/api/gold`
- `https://mm9-market-proxy.pranav-gangurde1.workers.dev/api/silver`
- `https://mm9-market-proxy.pranav-gangurde1.workers.dev/api/city-gold?city=Mumbai`

**City-rate caveat:** The retail-rate source can rate-limit, block robots or change HTML layouts. The API returns a documented failure rather than inventing rates. The app always provides the publisher's direct city page for manual verification. This is a pilot, not a licensed jewellery-price feed.

## GitHub Pages update (SAME repo)

Replace the repository root `index.html`, `config.js`, `sw.js` and assets from the ZIP. Commit changes; Pages redeploys. Open your HTTPS site. Hard-refresh or clear old site storage if you still see old UI. Do not upload ZIP itself as the hosted site.

The existing MoneyMantra branding, six app tabs, stock search, 5 pulse timeframes, sector drill-downs, Finance AI and reporting remain.

## Sources and correct distinctions

- Gold spot: `https://api.gold-api.com/price/XAU`
- Silver spot: `https://api.gold-api.com/price/XAG`
- Daily FX: `https://open.er-api.com/v6/latest/USD`
- Indicative India city retail: `https://www.goodreturns.in/gold-rates/` and linked city pages; date and quotation cadence vary
- SGX securities hours: `https://www.sgx.com/securities/trading` (09:00–12:00 and 13:00–17:00 SGT regular hours)
- STI index: `https://sg.finance.yahoo.com/quote/%5ESTI/`
- GIFT Nifty is NOT SGX Nifty: SGX Nifty operations transferred to NSE IX GIFT arrangement in 2023.

Never interpret international spot values as a jeweller's offer to buy back old gold; jewellery making charges, buy/sell spread, purity/hallmark and GST are separate.

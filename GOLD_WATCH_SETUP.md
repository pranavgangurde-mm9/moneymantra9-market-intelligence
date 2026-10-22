# MoneyMantra 9 · Gold Watch Upgrade

## Features

- Compact Gold Watch card under Markets → Global & Pre-Market Cues.
- Tappable bottom sheet for **18K (750), 20K (833), 22K (916), 23K (958), 24K (999)** in INR per gram and per 10 grams.
- Live-source XAU/USD price refreshed via Cloudflare Worker (~45 sec server cache, client requests no more often than once per minute).
- Free USD/INR reference from ExchangeRate-API updates **once daily**, and its exact timestamp is displayed.
- International spot-equivalent gold conversion: XAU/USD per troy ounce × USD/INR ÷ 31.1034768 × purity.
- Separate **Jewellery estimate** with user-adjustable 0–25% premium (defaults to 0%). This is NOT an actual jeweller shop quote. The mark-up is user-selected, not asserted as fact. GST, making charges, stones, local duty and retailer pricing not included.
- External official/published gold rate links: IBJA, Tanishq, Mia by Tanishq and BIS hallmark guide.
- Sources/timestamps always displayed; no invented fallback prices. Last saved quote (less than 24 hours) may appear if internet fails, with age.

## Deploy to your existing sites

1. Open Cloudflare Dashboard → Workers & Pages → `mm9-market-proxy` → Edit code. Replace the Worker contents with `worker/src/index.js` included in this package; deploy. Preserve Workers AI binding `AI`.
2. Test `https://mm9-market-proxy.pranav-gangurde1.workers.dev/api/gold` (should show `ok:true` and `grades`).
3. Upload the updated `index.html`, `sw.js`, `config.js` and static files to the **root** of your existing GitHub Pages repository. Commit. No new repo required.
4. Open the HTTPS GitHub Pages site → Markets → Gold Watch → View 5 rates.
5. To verify rates, compare with the source timestamps and published Indian benchmark/retailer pages. They need not match due to Indian market premia, import duties, tax and jewellery-making charges.

## Data accuracy

Gold-API offers USD-per-troy-ounce international spot; ExchangeRate-API free FX is daily, not intraday. The calculated 18K/20K/22K/23K/24K numbers are live-*derived*, not independent live jewellers' counter quotations. For named jeweller-specific prices a licensed feed/partner API or official published rate integration is needed.

URLs: https://api.gold-api.com/price/XAU ; https://open.er-api.com/v6/latest/USD ; https://www.ibja.co/ ; https://www.tanishq.co.in/gold-rate.html ; https://www.miabytanishq.com/en/gold-rate-today

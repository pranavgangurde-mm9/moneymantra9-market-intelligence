# Deploy MoneyMantra 9 R5.2.7 — F&O participant positioning

## What customers will see

Go to **Markets → F&O Participant Positioning → Explore**, or **Investor → Positional Trading Context → Open**. The panel displays FII, DII, PRO and Retail net open interest in index futures, calls and puts; previous-session net change; Nifty/VIX/Pulse/breadth confirmation; and the official NSE publication date. This is an **end-of-day** analysis.

## Cloudflare update

In **Workers & Pages → mm9-market-proxy → Edit code**, replace the existing Worker script with `worker/src/index.js` from this package and deploy it. Keep your existing Workers AI binding and settings. The endpoint added is:

`GET https://mm9-market-proxy.pranav-gangurde1.workers.dev/api/positions`

The Worker attempts to load the latest available participant-wise open-interest CSV files directly from NSE Archives. A healthy result has `ok:true`, `date`, `previousDate`, `current` and `previous`. A blocked source returns `ok:false`; no sample data is substituted. Quotes are EOD and do not change every 15 seconds.

## GitHub Pages update

In `pranavgangurde-mm9/moneymantra9-market-intelligence`, replace ONLY the root `index.html` and `sw.js` files from the **GitHub 2-file ZIP**. Commit to `main`, confirm Actions deployment and reload the HTTPS website. Keep `config.js`, `manifest.json`, icons, logo and policy pages as they are.

## If the NSE archive is unavailable

1. Open [NSE Derivatives Reports](https://www.nseindia.com/all-reports-derivatives).
2. Download the **F&O-Participant wise Open Interest (csv)** reports for the latest two trading sessions.
3. Keep their original filenames (example pattern: `fao_participant_oi_DDMMYYYY.csv`).
4. In the app's **F&O Participant Positioning** panel, select the latest and previous CSVs and tap **Load reports**. Both files are read on the user's device; they are not uploaded to Cloudflare.
5. Recheck the displayed session dates and contract counts against NSE. With only one file, the app can show current positions but not daily changes.

## Interpretation and risk

Positions are **outstanding open interest, not order execution records**. Net OI = long − short; change = current net − previous net. A higher index futures net may reflect fewer short contracts as well as new longs. Option exposures can include hedging and spread positions. The screen deliberately does not generate a guaranteed combined bullish/bearish call. Cross-referenced Market Pulse, breadth and VIX observations may have different dates. This is market awareness, not individual investment advice.

**Commercial use:** Verify NSE data-redistribution rights before enabling paid access. The Razorpay paywall remains inactive in this build.

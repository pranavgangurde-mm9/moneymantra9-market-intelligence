# MoneyMantra 9 — Participant Positional Intelligence (R5.2.7)

## What has been added
- Markets > F&O Participant Positioning: FII, DII, PRO and Retail (Client).
- Investor > Positional Trading Context shortcut opens the same screen.
- **End-of-day** net open interest in index futures, index calls and index puts, plus daily net change if two distinct trading sessions are available.
- Comparison with the latest Nifty 50 and India VIX quotes, with source dates.
- NSE daily CSV import fallback, using the original dated filenames.

## Important data interpretation
The participant file contains *open interest*, not executed buy/sell transactions. Net OI = Long − Short; delta = Today's Net − Previous Day's Net. Positive net puts may indicate downside hedges or bearish interest, and selling puts can be bullish, but none of these guarantees future price direction. Contracts should not be added across instruments without risk normalization. The app does not issue automatic buy/sell signals.

## Deployment
1. Cloudflare Workers & Pages > mm9-market-proxy > Edit code > replace the existing Worker with `worker/src/index.js` and deploy (keep AI and other bindings).
2. Test `https://mm9-market-proxy.pranav-gangurde1.workers.dev/api/positions`. It may return `ok:false` if NSE restricts public requests. This is an expected, honest unavailable state.
3. GitHub existing repository > root: replace `index.html` and `sw.js` with those in `MM9_R5_2_7_GitHub_2files.zip`; keep icons, brand, `config.js`, and policy pages. Commit to main.
4. Open Markets > F&O Participant Positioning. If the live source is unavailable, download F&O-Participant wise Open Interest CSV files for the latest two trading sessions from the [official NSE derivatives reports](https://www.nseindia.com/all-reports-derivatives), then use the two file pickers in the app. Uploaded files are read locally by your browser, not sent to a server.
5. Verify that date, FII and DII net futures positions, delta, calls and puts are correct, then cross-check the current Nifty and VIX observation dates.

## Data and commercial caveats
NSE may restrict automated retrieval from Cloudflare. Even if publicly downloadable, exchange F&O reports must be reviewed for permission before redistribution in a commercial app. The ₹199 Razorpay gate remains **inactive**. No artificial numbers or default market signals are substituted when source files are unavailable.

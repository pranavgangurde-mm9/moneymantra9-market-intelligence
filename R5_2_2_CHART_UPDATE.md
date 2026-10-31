# MoneyMantra 9 — R5.2.2 chart-spacing and historical price-change fix

## What changed
- Intraday and 20-trading-session charts use responsive, content-filling SVG areas on mobile. The readouts now sit immediately beneath the charts, with no large blank band.
- The 20-session table replaces the repetitive **Historical close** label with **Change (₹)** when watching NSE shares and **Change (pts)** when watching an index such as Nifty.
- The Change column is the absolute difference between the session close and the previous available trading close. The Move % column remains the daily percentage return. Both movements have green/red/neutral shading.
- The latest 20 rows are sourced from up to 21 observations so the oldest displayed row can also calculate the previous-close movement, if the source provides it. If there is no previous close, an em dash is shown.
- Historical line-chart tooltips now include the closing level, absolute change and percentage change. CSV exports include the new price-change field.
- No market-source, 15-second refresh, AI, paid-access, or Worker changes were made.

## Update GitHub only
1. Download `MM9_R5_2_2_GitHub_2files.zip`.
2. Replace the existing GitHub repository root `index.html` and `sw.js` with the two files inside.
3. Commit to `main` and confirm the Pages action finished successfully.
4. Refresh the hosted app and confirm the header says **Build R5.2.2**.
5. On mobile, open Infosys or Reliance, examine its intraday and 20-session charts, and verify the Change column shows rupees. For Nifty, it should show points.

## Data caution
The daily change column is computed from dated closes and is not evidence that the earlier Pulse predicted the market. For the first dated observation, change cannot be calculated without the preceding trading close. Market quotes can still be delayed or unavailable.

## Validation
JavaScript syntax and browser layout checks were performed against simulated source data. This release only needs the GitHub frontend update; it does not require redeploying Cloudflare Worker.

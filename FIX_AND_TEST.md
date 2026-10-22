# MoneyMantra 9 — Market sectors / global quotes repair

## Root cause confirmed
The standalone `index.html` depends on `config.js`, but opening ONLY the HTML file from Android Downloads leaves that external file unavailable. The proxy base URL then becomes blank, and all direct public browser requests can fail. The previous UI also rendered sector rows solely from returned quotes; no returned quotes meant an empty sector directory.

## Corrections
- `index.html` now contains a verified Worker URL as a fallback if `config.js` is absent.
- Sector catalogue is always visible: IT, Auto, Pharma, FMCG, Metal, Realty, Energy, PSU Bank, Financial Services, Infrastructure, Media and Banking.
- Every sector remains tappable and shows What/Why/How/Next step and official NSE sector index directory link even when a quote is unavailable.
- Missing price/change is visibly `—`, never a fabricated number.
- Diagnostics in Markets show partial/unavailable quote coverage and guide users to the hosted app.
- The `/api/market`, `/api/sector`, `/api/sector-insight`, `/api/ask` and `/api/pulse` calls continue using your existing Worker.
- Missing/NULL proxy numbers are not wrongly treated as zero.
- Old other tabs, timeframes and stock picker are retained.

## Recommended deployment
Update the **same** GitHub repository by replacing the files at its root: `index.html`, `config.js`, `manifest.json`, `sw.js`, and icons. Commit to the `main` branch. Wait for GitHub Pages, then reload the public HTTPS URL. The existing Cloudflare Worker **does not need to be redeployed for this frontend-only repair** if its endpoints already work.

## Tests
1. Open the HTTPS GitHub Pages URL (avoid a downloaded `content://` file for real client usage).
2. Under Markets verify **12 sector names** always appear, even with no data.
3. Tap Financial Services: the drawer should show scope and investor interpretation immediately. If the Worker supplies `/api/sector`, detailed quote/chart/5-day/1-month values follow.
4. If quotes are blank, visit the Worker `/api/market` endpoint in your browser; confirm `ok`, `quotes` and `sectors` fields. Some NSE sector symbols can be missing upstream; this is not proof of a UI fault.
5. Check Global values. Only verified returned values populate. GIFT Nifty and Nifty advances/declines can remain `—` because the Worker has no verified dedicated feed for those sources.
6. Check Home > Current / 15 Minute / 30 Minute / 1 Hour / Daily and individual stock modes.

**Important:** Offline HTML still cannot guarantee browser network permissions or a working public upstream quote feed. A successful 15-second timer is not proof of 15-second-fresh exchange prices. Market Pulse is descriptive and should not be used alone for intraday trading decisions.

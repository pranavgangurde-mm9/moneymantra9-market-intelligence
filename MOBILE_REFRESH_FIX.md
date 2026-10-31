# MoneyMantra 9 R5.2.1 — Mobile refresh layout hotfix

## What changed
- Refresh Live Data button stays full width on mobile screens (including smaller Android phones).
- Checked time and Next refresh countdown appear in a compact row underneath.
- The verbose source status is now behind an optional **Data source details** disclosure.
- All dynamic IDs (`refreshBtn`, `lastUpdate`, `nextRefresh`, `sourceMode`) and live refresh behaviour remain unchanged.
- This is only a frontend layout update. No Cloudflare Worker deployment or API changes are necessary.

## Update the existing GitHub repository
1. Unzip `MM9_R5_2_1_GitHub_2files.zip` or use `index.html` and `sw.js` from this release.
2. Upload and overwrite **only `index.html` and `sw.js`** at the root of `pranavgangurde-mm9/moneymantra9-market-intelligence`.
3. Commit to `main`, then confirm GitHub Actions → pages build and deployment succeeds.
4. Open the app on mobile and confirm header says **Build R5.2.1**.
5. Tap **Data source details** to see the full quote-check message; tap **Refresh Live Data** to confirm it still triggers the existing refresh.
6. If the old design remains, hard reload or clear the GitHub Pages website cache for this site.

## Notes
This changes only the button layout. A 15-second source check does not guarantee an exchange-fresh quote every 15 seconds.

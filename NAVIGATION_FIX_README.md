# MoneyMantra 9 — GitHub Pages policy navigation and cache repair

## Why this update
- An older service worker was caching all policy HTML pages, which could serve obsolete copies after new GitHub deployments.
- The existing app continues periodic data refreshes while the tab is hidden.
- This hotfix makes the static policy documents independent of the market data service.

## Minimal GitHub update
Upload only these 3 files to the ROOT of your existing repository, replacing matching files:

1. index.html
2. sw.js
3. policies.html (new)

All eight existing policy pages remain valid; the full ZIP also contains current copies if any were not uploaded.
No Cloudflare Worker or Razorpay account changes are needed.

## After successful GitHub Actions deployment
1. Open https://pranavgangurde-mm9.github.io/moneymantra9-market-intelligence/policies.html in a NEW PRIVATE/INCOGNITO window.
2. Click About, Pricing, Privacy, Refunds, Delivery, Contact and Terms. Every page must open by itself.
3. Open the app's top link "All policies & support" and try the same links.
4. On a previously used browser, hard refresh (Ctrl+Shift+R) or close all older app tabs and reopen. If needed, Chrome Site settings -> View permissions and data stored across sites -> search your github.io site -> clear stored data; this also clears saved watch settings/history. Prefer incognito first.
5. Pages and Markets should work independently: a blocked Cloudflare market data source must not prevent the policy pages from loading.

## Limitations
Remote GitHub Pages/CDN accessibility could not be tested from this environment. This update is based on the latest uploaded code. Local browser navigation and script syntax were validated.
All market features remain unchanged; only navigation, service-worker cache handling and background refresh behaviour were modified.

# MoneyMantra 9 Market Intelligence — 5.3.1 App Info update

## New feature

Under **More → App Info**, the page now shows:

- App version: **5.3.1**
- Release date: **08 Nov 2026**
- Release ID: **2026.11.08-r531-app-info**
- **Check for updates**: compares the loaded HTML with a fresh copy of the GitHub Pages page, bypassing the browser HTTP cache.
- **Reload latest version**: appears only when the published version differs from the one running locally.

The displayed App version is the version of the **HTML running on that device**, not the latest value on GitHub or a backend version. The optional update check compares those two versions; it does not guarantee that all remote data services have been updated.

## Deploy — GitHub only

1. Download **MM9_R5_3_1_GitHub_2files.zip**.
2. In `pranavgangurde-mm9/moneymantra9-market-intelligence`, replace root **index.html** and **sw.js**. Keep all other files unchanged.
3. Commit the two files to `main`. Wait for GitHub Pages deployment to finish successfully.
4. Open the published website (or standalone PWA), go to **More → App Info**, and check version **5.3.1**.
5. Tap **Check for updates**. If a different version is published, tap **Reload latest version**.

No Cloudflare Worker update, API key, new repository, Razorpay account, or special market configuration is needed for this App Info change.

## For future releases

When releasing a new frontend, update the two meta tags in `index.html`:
- `<meta name="mm9-version" content="5.3.2"/>`
- `<meta name="mm9-build" content="YYYY.MM.DD-r532-description"/>`

Also increment `CACHE_NAME` in `sw.js` to help invalidate old static-asset caches. The app reads its displayed version directly from the meta tags.

## Verification

Mobile and desktop tests checked App Info display, update-check responses for same/different versions, graceful offline handling, and the correct update-reload button state. The Worker is unchanged.

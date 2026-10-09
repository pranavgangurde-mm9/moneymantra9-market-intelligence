# Upgrade the existing Cloudflare Worker

You already have `mm9-market-proxy` deployed. Do NOT create a second Worker.

## 1. Update Worker code

Cloudflare Dashboard → Workers & Pages → `mm9-market-proxy` → Edit code.

Replace the entire existing Worker script with:

`worker/src/index.js`

from this package, then Deploy.

## 2. Test market endpoint

Open:

`https://mm9-market-proxy.pranav-gangurde1.workers.dev/api/market`

The JSON should now include:

- `quotes`
- `sectors`
- Nifty `timeline`

The Nifty percentage calculation now prefers the official `previousClose`
metadata instead of `chartPreviousClose`.

## 3. Enable Finance AI

The open-ended Finance AI requires a Workers AI binding.

In the Cloudflare dashboard for `mm9-market-proxy`:

1. Open **Settings**.
2. Find **Bindings**.
3. Choose **Add binding**.
4. Select **Workers AI**.
5. Set the binding / variable name to exactly: `AI`
6. Save / Deploy the binding.

Cloudflare exposes that binding to the Worker as `env.AI`.

This build uses:

`@cf/zai-org/glm-4.7-flash`

Workers AI has a free daily allocation, subject to Cloudflare's current limits.

## 4. Test AI endpoint

Open a REST client or use the app after deploying. The app POSTs to:

`/api/ask`

Example body:

```json
{"question":"What is the difference between SIP and lump-sum investing?"}
```

You can also check `/health`; after the AI binding is active it should return:

`"aiConfigured": true`

## 5. Update GitHub Pages

Replace the root frontend files with this package's files:

- index.html
- config.js
- manifest.json
- sw.js
- brand-logo.png
- icon-192.png
- icon-512.png

Keep `config.js` pointed at your existing Worker:

```js
window.MM9_CONFIG = {
  API_BASE: "https://mm9-market-proxy.pranav-gangurde1.workers.dev"
};
```

Commit changes and wait for GitHub Pages to redeploy.

## 6. Clear old service-worker cache once

After deployment, clear site storage for the GitHub Pages app once, then reopen it.

## What changes in the app

- Market Explanation is calculated from fetched data, not a fixed paragraph.
- Nifty intraday timeline is loaded from the Worker even after the Indian market closes.
- Live sector indices are fetched through the Worker where Yahoo provides them.
- Finance AI supports open-ended finance questions through Workers AI.
- Current Brief and Closing Report are different reports.
- Investor Mode changes its wording based on pulse and volatility.

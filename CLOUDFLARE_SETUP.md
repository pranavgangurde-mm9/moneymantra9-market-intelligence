# MoneyMantra 9 — GitHub Pages + Cloudflare Worker setup

## Repository layout

Keep these files at the ROOT of your existing GitHub Pages repository:

- index.html
- config.js
- manifest.json
- sw.js
- brand-logo.png
- icon-192.png
- icon-512.png
- README.txt

Also upload the new `worker/` folder. GitHub Pages will ignore it for the website; it is simply source control for your Cloudflare Worker.

## Recommended easiest deployment — Cloudflare Dashboard

1. Create/sign in to a free Cloudflare account.
2. Open **Workers & Pages**.
3. Choose **Create application → Create Worker**.
4. Give it the name `mm9-market-proxy`.
5. Deploy the starter Worker once.
6. Open **Edit code**.
7. Replace the starter code with the contents of:
   `worker/src/index.js`
8. Click **Deploy**.
9. Cloudflare will give you an address similar to:
   `https://mm9-market-proxy.<your-subdomain>.workers.dev`
10. Test:
    `https://mm9-market-proxy.<your-subdomain>.workers.dev/health`
    You should see JSON with `"ok": true`.
11. Test:
    `https://mm9-market-proxy.<your-subdomain>.workers.dev/api/market`
    You should see a JSON object containing `quotes`.

## Connect GitHub Pages to the Worker

1. Open `config.js` in your GitHub repository.
2. Click the pencil/edit icon.
3. Change:

   window.MM9_CONFIG = {
     API_BASE: ""
   };

   to:

   window.MM9_CONFIG = {
     API_BASE: "https://mm9-market-proxy.<your-subdomain>.workers.dev"
   };

4. Commit the change.
5. Wait for GitHub Pages to redeploy.
6. Hard-refresh the app or clear the site's storage once.
7. Open **More → Data Source Centre**.
   It should show `Connected: https://...workers.dev`.

## Updating the existing GitHub repository

Upload/replace the new root files and add the `worker/` folder.
Do not create another nested app folder.
`index.html` must remain in the repository root.

## Optional CLI deployment

From the `worker` folder:

npm install
npx wrangler login
npx wrangler deploy

## Important

This proxy removes browser CORS/local-file restrictions, but the upstream quote endpoint is still a public source and may be delayed or changed by its provider. For a commercial product, replace it later with a licensed market-data feed.

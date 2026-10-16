# MoneyMantra 9 — Sector Intelligence Upgrade

This build turns the Sector Pulse drill-down into an investor-intelligence screen.

## New sector drill-down content

Each sector now attempts to show:
- current/latest index level
- today's % change
- performance versus Nifty 50
- 5-day return
- 1-month return
- intraday high/low range
- intraday sector chart
- sector scope
- structural sector drivers
- What
- Why today
- How to interpret
- Next step for investors
- public verification links

The Worker uses public Yahoo Finance chart data for price/trend information and links to Nifty Indices for official index scope/factsheets/constituents.

The “Why today” explanation can use Workers AI web search. If a current catalyst cannot be verified, the app falls back to a transparent relative-performance explanation rather than inventing a reason.

## Update Cloudflare

1. Workers & Pages → mm9-market-proxy → Edit code.
2. Replace the Worker code with `worker/src/index.js`.
3. Deploy.
4. Keep your existing Workers AI binding named `AI`.

## Update GitHub Pages

Replace the root `index.html` with the new one in this package.
Keep `config.js` pointed to your existing Worker URL.

## New endpoints

GET `/api/sector?name=IT`

POST `/api/sector-insight`
Body:
`{"name":"IT"}`

## Important

This is a “licensed-style” information layer, not a licensed exchange feed.
Public market quotes may be delayed. A future paid/authorized feed can replace the Worker data adapter while keeping the same UI.

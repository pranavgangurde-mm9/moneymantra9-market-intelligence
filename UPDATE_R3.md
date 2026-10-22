# MoneyMantra 9 — R3 Update (23 Oct 2026)

## Fixes
- 20 completed sessions: daily change now uses actual source `pct` or computes from previous close; green/red background chips; CSV includes changes.
- Nifty, historical price, and sector chart hover readouts show index/share price along with percentage when the source provides it.
- 34 current NSE sectoral categories from official public directory; unsupported free-source price quotes remain unavailable instead of fabricated.
- Sector detail renders available price and scope immediately; AI explanations and constituent-file lookup load independently.
- Official sector constituent CSV access added for confirmed indices; if publisher blocks download, users get an official link, not an invented stock list.
- Nifty 50 breadth endpoint attempts verified coverage of all 50 constituents. Incomplete/blocked data remains unavailable. It uses one official NSE constituent snapshot (rather than 50+ external lookups, which could exceed Cloudflare Free limits), runs when the Markets tab is visited / first page load and caches good results for 15 minutes. **This is a free-source best effort, not a licensed NSE breadth feed.**
- Report generator separates selected ticker from broad-market indices, removes the raw `d1` code and the open-price indentation; Closing button now shows selected state.
- Period data explains completed candles and leaves the prior timestamped value in place when source access fails.

## Deployment
1. Cloudflare Workers & Pages > existing `mm9-market-proxy` > Edit Code > replace full code with `worker/src/index.js` and deploy. Keep AI binding.
2. Test `/health`, `/api/market`, `/api/pulse?symbol=RELIANCE.NS`, `/api/sector?name=IT`, `/api/sector-constituents?name=IT`, `/api/breadth`.
3. GitHub Pages: upload `index.html`, `config.js`, `sw.js`, and existing assets from this zip into repository root; commit to main.
4. Inspect the Build R3 label, clear service worker/site cache if needed.

## Limitations
- Public upstream chart/CSV endpoints may respond with 403/429, which our app cannot override. Some new sectors will have verified reference pages but no free chart data.
- Nifty breadth may remain blank if all 50 constituents cannot be retrieved for one matching session.
- A Daily Pulse after 15:30 needs a successful historical-source response; pressing the button does not create a price if Yahoo blocks retrieval.
- No feature in this package makes public feeds a licensed real-time service.

- Daily Pulse now has an explicitly labelled closing-quote fallback when its dedicated candle feed is blocked, provided the last quote observation is from 15:25 IST or later.
- Market source requests have an 8.5s timeout to avoid endless sector spinners.

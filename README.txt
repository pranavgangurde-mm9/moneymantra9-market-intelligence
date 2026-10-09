MoneyMantra 9 Market Intelligence — Production Proxy Build

NEW:
- Cloudflare Worker market-data proxy included under /worker
- Frontend config.js added
- One batched /api/market call instead of direct browser requests when proxy is configured
- Global index data routed server-side through the Worker
- India / US Markets session labels cleaned up (no duplicated flag text)
- GIFT Nifty session timing corrected for current NSE IX Index Futures hours
- GIFT status now distinguishes Session 1 / Pre-Close / Session 2 / Inter-session
- Existing GitHub Pages repository can be updated in place

See CLOUDFLARE_SETUP.md for deployment steps.

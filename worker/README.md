# MoneyMantra 9 Market Data Proxy

This Cloudflare Worker exists to remove browser CORS/local-file restrictions from the frontend.

Endpoints:
- GET /health
- GET /api/market

The /api/market endpoint fetches:
- Nifty 50
- Bank Nifty
- Sensex
- India VIX
- Nasdaq Composite
- S&P 500
- Nikkei 225

It returns one batched JSON response and caches it for 10 seconds.

GIFT Nifty:
The frontend currently keeps a separately timestamped last-verified GIFT quote.
Session timing is calculated from official NSE IX trading hours.
A licensed/direct GIFT quote feed can be added later without changing the UI.

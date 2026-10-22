# R4 validation results

## Automated tests completed
- Worker JavaScript syntax: passed (Node.js `--check`)
- Frontend inline JavaScript syntax: passed (Node.js `--check`)
- Mocked NSE `marketStatus.giftnifty` quote, `%`, timestamp, age and source: passed
- Mocked official Nifty 50 breadth response (advance/decline/unchanged 19/30/1): passed
- Mocked 25+25 constituent quote fallback routes: passed
- Mocked official GIFT HTTP 403: explicit unavailable response, not a made-up price: passed
- Headless Chromium mobile viewport 390×844: 12 sectors; a valid GIFT quote appears; verified breadth 27/22; Auto sector constituent list loads; tapping ASHOKLEY navigates to Home; `ASHOKLEY.NS` is selected; no page JS errors: passed
- Headless Chromium fallback case: two quote batches create breadth 25/25; blocked GIFT quote remains explicitly unavailable; no page JS errors: passed

## Not yet live verified
NSE and Yahoo quote providers' access from the *deployed Cloudflare Worker* and success under real public API restrictions must still be tested. An official NSE HTTP 403 or provider rate-limit may prevent current readings. These limitations are deliberately surfaced as unavailable or timestamped last-saved data.

## Security / trading disclaimer
Public quotes may be delayed. Pulse scores are educational context, not forecasts or orders. Do not use these unlicensed public endpoints as an exchange-grade trading feed.

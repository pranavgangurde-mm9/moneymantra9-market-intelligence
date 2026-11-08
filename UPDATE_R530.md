# MoneyMantra 9 Market Intelligence — R5.3.0
## Exchange-aware trading calendar and reliable 15-second checks

### Why this update was necessary

Trading hours cannot be determined by checking only whether today is a weekday. NSE can announce an additional Saturday/Sunday session, a weekday holiday, an early close, or a specially timed session. The prior build recognised only one such date. Also, the frontend's active quote-reuse threshold (14.5 seconds) was close enough to its 15-second cycle that some refresh checks reused a cached response, delaying the next actual source request.

### What the new app does

- Requests an Indian cash-equity **market-session status** from your existing Cloudflare Worker once roughly every minute, separate from the 15-second quote requests.
- The Worker tries the public NSE market-status response and uses it **only if the trading date is today** and the response clearly represents the cash-equity market. It does not mistake the commodity or GIFT Nifty session for the NSE cash market.
- If NSE's live status cannot be read, the Worker uses a published session timetable, the official 2026 equity holiday calendar and configured exchange-circular overrides.
- The frontend and Worker use the **same market-session decision** for session labels and active/closed quote-cache intervals.
- Supports regular sessions, pre-open, weekend sessions, shortened sessions, exchange holidays and full closures. Today, 8 November 2026, remains a published special trading session.
- The Indian-market quote-reuse threshold is reduced from 14.5 seconds to 13 seconds during active sessions. The Worker keeps its 14-second active quote-cache TTL; successful source checks are normally ~15 seconds apart while the app remains foregrounded.
- The *Checked* timestamp remains separate from the actual quote observation timestamp. The intraday timeline will not create a new current-day point using a previous session's quote.
- The UI does not display internal API errors or development instructions. A click on the India session status displays the session time, source and reference link.

### How to update the existing installation

1. **Cloudflare Worker first:** Open **Workers & Pages → mm9-market-proxy → Edit code**. Replace the Worker code with `worker/src/index.js` in the Worker ZIP and deploy. Retain existing AI/KV bindings, secrets and other settings.
2. Test `https://mm9-market-proxy.pranav-gangurde1.workers.dev/api/market-session`. It should return the current IST date, the NSE cash-market state, session hours and `source`.
3. **GitHub Pages second:** Replace only the repository root `index.html` and `sw.js` with the two files from `MM9_R5_3_0_GitHub_2files.zip`. Commit to `main` and verify GitHub Actions deploys the update. Keep config.js, branding, icons, policy pages and manifest unchanged.
4. Reopen the hosted app. In the **Markets → Market Session Monitor**, tap **India** for the source, trading date and hours. Compare timestamps in **Data source details**.

### Future exchange changes — without editing the app code

An announced future special session or early close can be entered in **Cloudflare → mm9-market-proxy → Settings → Variables and Secrets → Add variable**:

- **Name:** `MM9_NSE_SESSIONS`
- **Type:** Text
- **Value:** JSON dictionary of dates and trading hours (all India Standard Time).

Example structure (illustrative dates only; do **not** treat these as announced exchange sessions):

```json
{
  "2026-12-12": {
    "type": "weekend",
    "name": "Example Saturday equity session",
    "preOpen": "09:00",
    "open": "09:15",
    "close": "12:30"
  },
  "2026-12-16": {
    "type": "early-close",
    "name": "Example shortened equity session",
    "preOpen": "09:00",
    "open": "09:15",
    "close": "13:00"
  },
  "2026-12-17": {
    "type": "closed",
    "name": "Example exchange holiday"
  }
}
```

**Do not apply these sample dates.** Add a date only after checking the official NSE circular. Update the same variable with all confirmed exceptions as required. A variable edit may create a new Worker deployment, but no HTML or JavaScript source edit is needed. The live NSE status check can recognise an unplanned market opening or early close when the public endpoint supplies an authoritative, correctly dated status.

### Limitations and important notes

- The public NSE status endpoint can be blocked from Cloudflare. There is no guaranteed automatic way to discover all future exceptional sessions from public data. The configured exchange schedule is the essential fallback.
- The bundled 2026 holiday dates are for **NSE cash equities** only. Other segments (NSE F&O, GIFT Nifty, SGX, US markets, commodity exchanges) may follow different calendars. The 2027 holiday list is **not** asserted as verified until configured or published in a future update.
- A 15-second source request is **not** a 15-second exchange tick or licensed real-time feed. Quotes may be cached or delayed by the publisher, and redistribution rights need separate confirmation before paid access.
- If the phone suspends Chrome in the background, the browser may suspend timers. The app resumes checks on returning to the foreground.
- The planned ₹199 Razorpay payment gate is **not enabled** by this update.

### Technical QA

- Backend tests: 15 calendar/status cases — normal weekdays, weekend special trading, weekend closure, holiday, pre-open, early close, stale exchange response, cross-segment rejection — PASS.
- Frontend mobile browser at 390px: special session shows OPEN · SPECIAL; simulated early close and holiday show CLOSED — PASS, no JavaScript errors in tested flows.
- Foreground refresh timer simulation: initial active quote request and an additional request on the next 15-second cycle — PASS after changing the frontend quote-reuse threshold to 13 seconds.
- JavaScript syntax checks for both frontend and Worker — PASS.
- Live published NSE quotes / hosted Cloudflare environment — **not independently confirmed**. Verification requires deployment.

Sources: [NSE official market hours and holidays](https://www.nseindia.com/resources/exchange-communication-holidays) and official NSE exchange circulars.

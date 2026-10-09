MoneyMantra 9 Market Intelligence — 15-Second Refresh Timing Fix

WHY THE PREVIOUS BUILD COULD APPEAR TO REFRESH IN ABOUT 5 SECONDS
The previous build used a fixed 15-second setInterval. If a network refresh itself took 8–10 seconds,
the next fixed interval could arrive only 5–7 seconds after the previous refresh completed.

FIX
- Fixed setInterval refresh has been removed.
- Automatic refresh now uses a chained setTimeout.
- The next refresh is scheduled only after the current refresh completes.
- There is a full 15-second waiting period between completed automatic refreshes.
- Countdown remains aligned with the actual next refresh.
- Manual refresh remains available independently.
- Indian market close snapshot behavior remains unchanged.

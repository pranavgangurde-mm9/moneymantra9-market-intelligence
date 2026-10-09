const SYMBOLS = {
  nifty: "^NSEI",
  bank: "^NSEBANK",
  sensex: "^BSESN",
  vix: "^INDIAVIX",
  nasdaq: "^IXIC",
  sp: "^GSPC",
  nikkei: "^N225"
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400"
};

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=10, s-maxage=10",
      ...CORS,
      ...extra
    }
  });
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function fetchYahooChart(symbol) {
  const target =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}` +
    `?interval=5m&range=1d&includePrePost=false`;

  const r = await fetch(target, {
    headers: {
      "accept": "application/json,text/plain,*/*",
      "user-agent": "Mozilla/5.0 (compatible; MM9-Market-Intelligence/1.0)"
    },
    cf: { cacheTtl: 10, cacheEverything: true }
  });

  if (!r.ok) throw new Error(`Yahoo ${symbol}: HTTP ${r.status}`);
  const j = await r.json();
  const result = j?.chart?.result?.[0];
  if (!result) throw new Error(`Yahoo ${symbol}: no result`);
  return result;
}

function normalizeChart(result, includeTimeline = false) {
  const meta = result.meta || {};
  const quote = result.indicators?.quote?.[0] || {};
  const price = num(meta.regularMarketPrice);
  const prev = num(meta.chartPreviousClose ?? meta.previousClose);
  const pct =
    price !== null && prev !== null && prev !== 0
      ? ((price - prev) / prev) * 100
      : null;

  const clean = (arr) => (arr || []).map(num).filter((v) => v !== null);
  const opens = clean(quote.open);
  const highs = clean(quote.high);
  const lows = clean(quote.low);

  const out = {
    price,
    pct,
    prev,
    open: opens.length ? opens[0] : null,
    high: highs.length ? Math.max(...highs) : null,
    low: lows.length ? Math.min(...lows) : null,
    epoch: num(meta.regularMarketTime),
    exchangeTimezoneName: meta.exchangeTimezoneName || null,
    marketState: meta.marketState || null,
    timeline: []
  };

  if (includeTimeline) {
    const ts = result.timestamp || [];
    const close = quote.close || [];
    const tz = "Asia/Kolkata";

    for (let i = 0; i < ts.length; i++) {
      const c = num(close[i]);
      if (c === null || prev === null || prev === 0) continue;

      const time = new Intl.DateTimeFormat("en-GB", {
        timeZone: tz,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).format(new Date(ts[i] * 1000));

      const [h, m] = time.split(":").map(Number);
      const mins = h * 60 + m;
      if (mins >= 555 && mins <= 930) {
        out.timeline.push({
          time,
          pct: ((c - prev) / prev) * 100
        });
      }
    }
  }

  return out;
}

async function buildMarketPayload() {
  const entries = await Promise.all(
    Object.entries(SYMBOLS).map(async ([key, symbol]) => {
      try {
        const raw = await fetchYahooChart(symbol);
        return [key, normalizeChart(raw, key === "nifty"), null];
      } catch (error) {
        return [key, null, error instanceof Error ? error.message : String(error)];
      }
    })
  );

  const quotes = {};
  const errors = {};

  for (const [key, value, error] of entries) {
    if (value) quotes[key] = value;
    if (error) errors[key] = error;
  }

  return {
    ok: Object.keys(quotes).length > 0,
    generatedAt: new Date().toISOString(),
    source: "Cloudflare Worker → Yahoo Finance public chart endpoint",
    quotes,
    errors
  };
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);

    if (url.pathname === "/" || url.pathname === "/health") {
      return json({
        ok: true,
        service: "MoneyMantra 9 Market Data Proxy",
        now: new Date().toISOString()
      }, 200, { "cache-control": "no-store" });
    }

    if (url.pathname === "/api/market") {
      const cache = caches.default;
      const cacheKey = new Request(`${url.origin}/api/market?v=1`, request);
      const cached = await cache.match(cacheKey);
      if (cached) return cached;

      const payload = await buildMarketPayload();
      const response = json(payload, payload.ok ? 200 : 502);

      if (payload.ok) {
        ctx.waitUntil(cache.put(cacheKey, response.clone()));
      }
      return response;
    }

    return json({ ok: false, error: "Not found" }, 404, {
      "cache-control": "no-store"
    });
  }
};

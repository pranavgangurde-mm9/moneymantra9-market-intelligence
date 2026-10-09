const CORE_SYMBOLS = {
  nifty: "^NSEI",
  bank: "^NSEBANK",
  sensex: "^BSESN",
  vix: "^INDIAVIX",
  nasdaq: "^IXIC",
  sp: "^GSPC",
  nikkei: "^N225"
};

const SECTOR_SYMBOLS = {
  "IT": "^CNXIT",
  "Auto": "^CNXAUTO",
  "Pharma": "^CNXPHARMA",
  "FMCG": "^CNXFMCG",
  "Metal": "^CNXMETAL",
  "Realty": "^CNXREALTY",
  "Energy": "^CNXENERGY",
  "PSU Bank": "^CNXPSUBANK",
  "Financial Services": "^CNXFIN",
  "Infrastructure": "^CNXINFRA",
  "Media": "^CNXMEDIA"
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
      "user-agent": "Mozilla/5.0 (compatible; MM9-Market-Intelligence/2.0)"
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

  // Prefer official previousClose where available; chartPreviousClose can differ
  // around session boundaries and produced incorrect percentage changes earlier.
  const prev = num(meta.previousClose ?? meta.chartPreviousClose);
  const metaPct = num(meta.regularMarketChangePercent);
  const pct =
    metaPct !== null
      ? metaPct
      : (price !== null && prev !== null && prev !== 0
          ? ((price - prev) / prev) * 100
          : null);

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
  const coreEntries = await Promise.all(
    Object.entries(CORE_SYMBOLS).map(async ([key, symbol]) => {
      try {
        const raw = await fetchYahooChart(symbol);
        return [key, normalizeChart(raw, key === "nifty"), null];
      } catch (error) {
        return [key, null, error instanceof Error ? error.message : String(error)];
      }
    })
  );

  const sectorEntries = await Promise.all(
    Object.entries(SECTOR_SYMBOLS).map(async ([name, symbol]) => {
      try {
        const raw = await fetchYahooChart(symbol);
        const q = normalizeChart(raw, false);
        return [{ name, symbol, ...q }, null];
      } catch (error) {
        return [null, `${name}: ${error instanceof Error ? error.message : String(error)}`];
      }
    })
  );

  const quotes = {};
  const errors = {};
  for (const [key, value, error] of coreEntries) {
    if (value) quotes[key] = value;
    if (error) errors[key] = error;
  }

  const sectors = [];
  for (const [value, error] of sectorEntries) {
    if (value && value.price !== null && value.pct !== null) sectors.push(value);
    if (error) (errors.sectors ||= []).push(error);
  }

  // Banking is already a core quote but is useful in the sector view.
  if (quotes.bank?.price !== null && quotes.bank?.pct !== null) {
    sectors.push({ name: "Banking", symbol: "^NSEBANK", ...quotes.bank });
  }

  return {
    ok: Object.keys(quotes).length > 0,
    generatedAt: new Date().toISOString(),
    source: "Cloudflare Worker → Yahoo Finance public chart endpoint",
    quotes,
    sectors,
    errors
  };
}

async function fetchWebContext(question) {
  const sources = [];
  const snippets = [];
  try {
    const u = `https://api.duckduckgo.com/?q=${encodeURIComponent(question)}&format=json&no_html=1&skip_disambig=1`;
    const r = await fetch(u, { headers: { "accept": "application/json" } });
    if (r.ok) {
      const j = await r.json();
      if (j.AbstractText) {
        snippets.push(j.AbstractText);
        if (j.AbstractURL) sources.push({ title: j.Heading || "DuckDuckGo source", url: j.AbstractURL });
      }
      const topics = Array.isArray(j.RelatedTopics) ? j.RelatedTopics : [];
      for (const t of topics) {
        if (snippets.length >= 3) break;
        if (t?.Text) {
          snippets.push(t.Text);
          if (t.FirstURL) sources.push({ title: t.Text.slice(0, 70), url: t.FirstURL });
        }
      }
    }
  } catch (_) {}

  return {
    text: snippets.slice(0, 3).join("\n"),
    sources: sources.slice(0, 3)
  };
}

function compactMarketContext(p) {
  const q = p?.quotes || {};
  const sectors = (p?.sectors || []).map(s => ({
    name: s.name, price: s.price, pct: s.pct
  }));
  return {
    generatedAt: p?.generatedAt,
    nifty: q.nifty,
    bank: q.bank,
    sensex: q.sensex,
    vix: q.vix,
    nasdaq: q.nasdaq,
    sp500: q.sp,
    nikkei: q.nikkei,
    sectors
  };
}

async function answerFinanceQuestion(question, env) {
  if (!env.AI) {
    return {
      ok: false,
      status: 503,
      error: "Workers AI binding is not configured. Add a Workers AI binding named AI to this Worker."
    };
  }

  const [market, web] = await Promise.all([
    buildMarketPayload(),
    fetchWebContext(question)
  ]);

  const marketContext = compactMarketContext(market);

  const system = `You are MoneyMantra 9 Finance AI, an educational finance assistant for an Indian user.
Answer clearly and practically. You may answer finance, mutual funds, insurance, personal finance,
market concepts, asset allocation, risk, taxation basics and current market questions.
For current market claims, use ONLY the supplied live/delayed market context and explicitly state
when data is delayed or unavailable. Do not invent live prices, news or regulations.
If public web context is supplied, use it cautiously and distinguish it from live market data.
Do not promise returns or present any investment as guaranteed. If a question seeks a personalized
buy/sell/security recommendation, provide educational factors and risk considerations instead.
Reply in the user's language when obvious (English, Hindi or Marathi); otherwise use English.
Be concise but useful.`;

  const user = `QUESTION:
${question}

CURRENT MARKET CONTEXT:
${JSON.stringify(marketContext)}

PUBLIC WEB CONTEXT (may be incomplete):
${web.text || "No relevant public context retrieved."}`;

  const result = await env.AI.run("@cf/zai-org/glm-4.7-flash", {
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    max_completion_tokens: 900,
    temperature: 0.25
  });

  return {
    ok: true,
    answer: result?.response || result?.result?.response || String(result || ""),
    model: "@cf/zai-org/glm-4.7-flash",
    marketGeneratedAt: market.generatedAt,
    sources: web.sources
  };
}

async function marketResponse(request, ctx) {
  const url = new URL(request.url);
  const cache = caches.default;
  const cacheKey = new Request(`${url.origin}/api/market?v=3`, { method: "GET" });
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const payload = await buildMarketPayload();
  const response = json(payload, payload.ok ? 200 : 502);
  if (payload.ok) ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
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
        service: "MoneyMantra 9 Market Data + Finance AI Proxy",
        aiConfigured: Boolean(env.AI),
        now: new Date().toISOString()
      }, 200, { "cache-control": "no-store" });
    }

    if (url.pathname === "/api/market" && request.method === "GET") {
      return marketResponse(request, ctx);
    }

    if (url.pathname === "/api/ask" && request.method === "POST") {
      try {
        const body = await request.json();
        const question = String(body?.question || "").trim();
        if (!question) return json({ ok: false, error: "Question is required." }, 400, { "cache-control": "no-store" });
        if (question.length > 2000) return json({ ok: false, error: "Question is too long." }, 400, { "cache-control": "no-store" });

        const answer = await answerFinanceQuestion(question, env);
        return json(answer, answer.ok ? 200 : (answer.status || 500), { "cache-control": "no-store" });
      } catch (error) {
        return json({
          ok: false,
          error: error instanceof Error ? error.message : String(error)
        }, 500, { "cache-control": "no-store" });
      }
    }

    return json({ ok: false, error: "Not found" }, 404, { "cache-control": "no-store" });
  }
};

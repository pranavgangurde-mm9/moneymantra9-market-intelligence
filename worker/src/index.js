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


function extractText(value, depth = 0, keyHint = "") {
  if (depth > 10 || value == null) return "";

  if (typeof value === "string") {
    const t = value.trim();
    // Do not surface hidden reasoning fields as the final answer.
    if (/reasoning|thinking|analysis/i.test(keyHint)) return "";
    return t;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const t = extractText(item, depth + 1, keyHint);
      if (t) return t;
    }
    return "";
  }

  if (typeof value !== "object") return "";

  // Standard Workers AI / OpenAI-compatible response.
  const standard = value?.choices?.[0]?.message?.content;
  if (standard != null) {
    const t = extractText(standard, depth + 1, "content");
    if (t) return t;
  }

  // Common response containers.
  for (const key of ["answer", "output_text", "response", "content", "text", "final", "result", "output", "message"]) {
    if (value[key] != null) {
      const t = extractText(value[key], depth + 1, key);
      if (t) return t;
    }
  }

  // Generic fallback: walk non-reasoning fields, prioritizing useful text-bearing keys.
  const entries = Object.entries(value).filter(([k]) => !/reasoning|thinking|analysis|usage|id|model|created|fingerprint/i.test(k));
  const priority = ["value", "body", "data", "choices", "messages"];
  entries.sort(([a],[b]) => priority.indexOf(b) - priority.indexOf(a));

  for (const [k, v] of entries) {
    const t = extractText(v, depth + 1, k);
    if (t && t.length > 2) return t;
  }

  return "";
}

function collectSources(value, out = [], seen = new Set(), depth = 0) {
  if (depth > 8 || value == null || typeof value !== "object") return out;
  if (seen.has(value)) return out;
  seen.add(value);

  if (Array.isArray(value)) {
    for (const item of value) collectSources(item, out, seen, depth + 1);
    return out;
  }

  const citation = value.url_citation || value.citation;
  if (citation && typeof citation === "object" && citation.url) {
    out.push({
      title: citation.title || citation.url,
      url: citation.url
    });
  }

  if (typeof value.url === "string" && /^https?:\/\//i.test(value.url)) {
    out.push({
      title: value.title || value.name || value.url,
      url: value.url
    });
  }

  for (const v of Object.values(value)) {
    if (v && typeof v === "object") collectSources(v, out, seen, depth + 1);
  }

  const deduped = [];
  const urls = new Set();
  for (const s of out) {
    if (!s?.url || urls.has(s.url)) continue;
    urls.add(s.url);
    deduped.push(s);
  }
  out.splice(0, out.length, ...deduped.slice(0, 6));
  return out;
}

function needsWebSearch(question) {
  return /\b(today|latest|current|currently|now|news|recent|this week|this month|market|nifty|sensex|bank nifty|gift nifty|nav|price|yield|repo|inflation|rbi|sebi|rule|regulation|tax|taxation|budget|rate|interest rate|ipo|nfo|fund performance|return)\b/i.test(question);
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

async function runFinanceModel(env, model, messages, useWeb) {
  const params = {
    messages,
    stream: false,
    max_completion_tokens: 1200,
    temperature: 0.2,
    // Disable hidden thinking so the model reliably produces final answer content.
    chat_template_kwargs: {
      enable_thinking: false
    }
  };

  if (useWeb) {
    params.web_search_options = {};
  }

  return env.AI.run(model, params);
}

async function answerFinanceQuestion(question, env) {
  if (!env.AI) {
    return {
      ok: false,
      status: 503,
      error: "Workers AI binding is not configured. Add a Workers AI binding named AI to this Worker."
    };
  }

  const market = await buildMarketPayload();
  const marketContext = compactMarketContext(market);
  const wantsWeb = needsWebSearch(question);

  const system = `You are MoneyMantra 9 Finance AI, an educational finance assistant focused on Indian users.

You can answer:
- personal finance and budgeting
- emergency funds
- insurance
- mutual funds, SIP, SWP, STP and ETFs
- retirement and goal planning
- asset allocation and risk
- banking, interest rates and inflation
- RBI / SEBI / tax concepts and regulations
- Indian and global market concepts
- current market questions

Rules:
1. For live/current index values, use the supplied MARKET CONTEXT.
2. For latest RBI, SEBI, tax, regulation, news or changing factual information, use web search when available.
3. If a current fact cannot be verified, say so instead of guessing.
4. Do not guarantee returns or issue personalized buy/sell/options calls.
5. Explain suitability, risks and alternatives.
6. Reply in the user's language when obvious (English, Hindi or Marathi).
7. Keep answers practical and readable.
8. When web sources are available, mention the source names or URLs naturally.`;

  const user = `QUESTION:
${question}

MARKET CONTEXT:
${JSON.stringify(marketContext)}`;

  const messages = [
    { role: "system", content: system },
    { role: "user", content: user }
  ];

  const attempts = [];

  // Primary: Gemma 4 with thinking disabled. Cloudflare's own Workers AI
  // getting-started guide uses this model with enable_thinking:false.
  attempts.push({
    model: "@cf/google/gemma-4-26b-a4b-it",
    web: wantsWeb
  });

  // Retry same model without web search in case the web-search path fails.
  if (wantsWeb) {
    attempts.push({
      model: "@cf/google/gemma-4-26b-a4b-it",
      web: false
    });
  }

  // Final model fallback.
  attempts.push({
    model: "@cf/zai-org/glm-4.7-flash",
    web: false
  });

  let lastError = null;

  for (const attempt of attempts) {
    try {
      const result = await runFinanceModel(env, attempt.model, messages, attempt.web);
      const answer = extractText(result);
      const sources = collectSources(result);

      if (answer) {
        return {
          ok: true,
          answer,
          model: attempt.model,
          marketGeneratedAt: market.generatedAt,
          webSearchUsed: attempt.web,
          sources
        };
      }

      lastError = `No final text returned by ${attempt.model}`;
      console.log("AI response had no extractable final text:", JSON.stringify({
        model: attempt.model,
        web: attempt.web,
        keys: result && typeof result === "object" ? Object.keys(result) : typeof result,
        choiceKeys: result?.choices?.[0] ? Object.keys(result.choices[0]) : [],
        messageKeys: result?.choices?.[0]?.message ? Object.keys(result.choices[0].message) : []
      }));
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.log("AI attempt failed:", attempt.model, attempt.web, lastError);
    }
  }

  return {
    ok: false,
    status: 502,
    error: `Finance AI could not produce a final answer after multiple attempts. ${lastError || ""}`.trim()
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

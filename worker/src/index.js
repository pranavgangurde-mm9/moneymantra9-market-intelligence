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
  const q = String(question || "").toLowerCase();

  // Current market/index questions should use the MoneyMantra market payload,
  // not internet search, unless the user explicitly asks for news/reasons/events.
  const marketQuestion = /(market|nifty|sensex|bank nifty|india vix|vix|gift nifty|nasdaq|s&p|sp500|nikkei)/i.test(q);
  const asksNews = /(news|why did|reason|reasons|event|events|announcement|headline|headlines)/i.test(q);

  if (marketQuestion && !asksNews) return false;

  // Search the web only when freshness materially matters.
  const fresh = /(latest|current|currently|today|now|recent|this week|this month|updated|newest)/i.test(q);
  const changingTopic = /(rbi|repo rate|sebi|tax|taxation|budget|regulation|rule|circular|inflation|gdp|interest rate|policy rate|ipo|nfo|nav|expense ratio|aum|fund performance|scheme performance)/i.test(q);

  return asksNews || (fresh && changingTopic);
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


function makeConciseAnswer(text) {
  let t = String(text || "").trim();
  if (!t) return "";

  // Remove Markdown tables entirely.
  t = t
    .split("\n")
    .filter(line => !/^\s*\|.*\|\s*$/.test(line) && !/^\s*\|?[-: ]+\|[-|: ]+\s*$/.test(line))
    .join(" ");

  // Strip common Markdown formatting and list markers.
  t = t
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/^\s*[-*•]\s+/gm, "")
    .replace(/^\s*\d+[.)]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();

  // Enforce a maximum of three sentences, even if the model ignores the prompt.
  try {
    const segmenter = new Intl.Segmenter(undefined, { granularity: "sentence" });
    const sentences = [...segmenter.segment(t)]
      .map(x => x.segment.trim())
      .filter(Boolean);
    if (sentences.length) t = sentences.slice(0, 3).join(" ");
  } catch (_) {
    const sentences = t.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [t];
    t = sentences.slice(0, 3).join(" ").trim();
  }

  // Final safety cap for unusually long sentences.
  if (t.length > 650) t = t.slice(0, 647).trimEnd() + "...";
  return t;
}

async function runFinanceModel(env, model, messages, useWeb) {
  const params = {
    messages,
    stream: false,
    max_completion_tokens: 260,
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
1. Answer ONLY what the user asked.
2. Maximum 3 short sentences. Prefer 1–2 sentences when enough.
3. Use simple conversational language. No tables, no headings, no long lists, no Markdown formatting.
4. For live/current index values, use the supplied MARKET CONTEXT.
5. Use web search only when the question genuinely needs a fresh external fact such as the latest RBI/SEBI/tax/regulatory/news information.
6. If a current fact cannot be verified, say so briefly instead of guessing.
7. Do not guarantee returns or issue personalized buy/sell/options calls.
8. Reply in the user's language when obvious (English, Hindi or Marathi).
9. Do not repeat the question and do not add unrelated background information.
10. Sources are shown separately by the app, so do not append a bibliography or URLs unless the user explicitly asks for them.`;

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
        const conciseAnswer = makeConciseAnswer(answer);
        if (conciseAnswer) {
          return {
            ok: true,
            answer: conciseAnswer,
            model: attempt.model,
            marketGeneratedAt: market.generatedAt,
            webSearchUsed: attempt.web,
            sources
          };
        }
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

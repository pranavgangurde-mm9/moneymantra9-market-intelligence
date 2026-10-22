const CORE_SYMBOLS = {
  nifty: "^NSEI",
  bank: "^NSEBANK",
  sensex: "^BSESN",
  vix: "^INDIAVIX",
  nasdaq: "^IXIC",
  sp: "^GSPC",
  nikkei: "^N225",
  sgx: "^STI" // Singapore Straits Times Index (SGX-listed equities benchmark)
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


const SECTOR_META = {
  "IT": {
    slug: "nifty-it",
    scope: "Nifty IT captures the performance of Indian information-technology companies and serves as a benchmark for the domestic IT segment.",
    drivers: "Global technology spending, US/Europe demand, large deal wins, INR/USD, attrition and employee costs."
  },
  "Auto": {
    slug: "nifty-auto",
    scope: "Nifty Auto reflects the behaviour and performance of listed Indian automobile-sector companies.",
    drivers: "Vehicle demand, interest rates, rural/urban consumption, fuel prices and commodity input costs."
  },
  "Pharma": {
    slug: "nifty-pharma",
    scope: "Nifty Pharma tracks listed Indian pharmaceutical companies and is used as a benchmark for the domestic pharma segment.",
    drivers: "USFDA developments, drug approvals, product launches, export demand, pricing and currency movement."
  },
  "FMCG": {
    slug: "nifty-fmcg",
    scope: "Nifty FMCG tracks Indian fast-moving consumer-goods companies selling frequently purchased consumer products.",
    drivers: "Rural/urban demand, food and commodity inflation, input costs, pricing power and consumer sentiment."
  },
  "Metal": {
    slug: "nifty-metal",
    scope: "Nifty Metal represents Indian companies involved in metals and mining-related businesses.",
    drivers: "Steel/non-ferrous prices, China demand, domestic infrastructure demand, energy costs and currency."
  },
  "Realty": {
    slug: "nifty-realty",
    scope: "Nifty Realty represents listed Indian companies linked to real-estate development.",
    drivers: "Home-loan rates, housing demand, project launches, liquidity, urban demand and regulation."
  },
  "Energy": {
    slug: "",
    scope: "The Energy signal represents listed Indian companies linked to the energy value chain.",
    drivers: "Crude oil, gas and power prices, refining margins, demand, regulation and global energy markets."
  },
  "PSU Bank": {
    slug: "nifty-psu-bank",
    scope: "Nifty PSU Bank tracks listed Indian public-sector banks.",
    drivers: "Credit growth, deposits, bond yields, asset quality, policy rates and government actions."
  },
  "Financial Services": {
    slug: "nifty-financial-services",
    scope: "Nifty Financial Services represents listed Indian financial-services companies across lending and related activities.",
    drivers: "Interest rates, liquidity, credit growth, asset quality, market activity and regulation."
  },
  "Infrastructure": {
    slug: "",
    scope: "The Infrastructure signal represents listed Indian companies exposed to infrastructure and capital-expenditure activity.",
    drivers: "Government/private capex, order books, project awards, financing costs and execution."
  },
  "Media": {
    slug: "nifty-media",
    scope: "Nifty Media represents Indian media and entertainment companies.",
    drivers: "Advertising demand, subscriptions, content economics, consumer spending and regulation."
  },
  "Banking": {
    slug: "nifty-bank",
    scope: "Nifty Bank tracks major liquid Indian banking stocks and is a key gauge of the domestic banking sector.",
    drivers: "Credit growth, deposits, net interest margins, asset quality, policy rates and liquidity."
  }
};

function sectorSymbol(name) {
  if (name === "Banking") return "^NSEBANK";
  return SECTOR_SYMBOLS[name] || null;
}

function officialSectorLink(name) {
  const slug = SECTOR_META[name]?.slug;
  return slug
    ? `https://www.niftyindices.com/indices/equity/sectoral-indices/${slug}`
    : "https://www.niftyindices.com/indices/equity/sectoral-indices";
}

function quoteLink(symbol) {
  return `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}/`;
}

function rangeReturn(result) {
  const closes = (result?.indicators?.quote?.[0]?.close || []).map(num).filter(v => v !== null);
  if (closes.length < 2 || closes[0] === 0) return null;
  return ((closes[closes.length - 1] - closes[0]) / closes[0]) * 100;
}

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
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function fetchYahooChart(symbol, interval = "5m", range = "1d") {
  const target =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}` +
    `?interval=${encodeURIComponent(interval)}&range=${encodeURIComponent(range)}&includePrePost=false`;

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


async function buildSectorPayload(name) {
  const symbol = sectorSymbol(name);
  if (!symbol) return { ok: false, error: "Unknown sector." };

  const [dayR, fiveR, monthR] = await Promise.allSettled([
    fetchYahooChart(symbol, "5m", "1d"),
    fetchYahooChart(symbol, "15m", "5d"),
    fetchYahooChart(symbol, "1d", "1mo")
  ]);

  if (dayR.status !== "fulfilled") {
    return { ok: false, error: dayR.reason?.message || "Sector quote unavailable." };
  }

  const sector = normalizeChart(dayR.value, true);
  sector.name = name;
  sector.symbol = symbol;

  const meta = SECTOR_META[name] || {};
  let dataAsOf = null;
  if (sector.epoch) {
    dataAsOf = new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: false
    }).format(new Date(sector.epoch * 1000)) + " IST";
  }

  return {
    ok: true,
    sector,
    return5d: fiveR.status === "fulfilled" ? rangeReturn(fiveR.value) : null,
    return1m: monthR.status === "fulfilled" ? rangeReturn(monthR.value) : null,
    scope: meta.scope || `${name} is an Indian NSE-linked sector index.`,
    drivers: meta.drivers || "Sector-specific demand, earnings, policy and macro conditions.",
    officialLink: officialSectorLink(name),
    quoteLink: quoteLink(symbol),
    dataAsOf
  };
}

function parseJsonObject(text) {
  if (!text) return null;
  let t = String(text).trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try { return JSON.parse(t); } catch (_) {}

  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try { return JSON.parse(t.slice(start, end + 1)); } catch (_) {}
  }
  return null;
}

function deterministicSectorInsight(name, sector, market) {
  const meta = SECTOR_META[name] || {};
  const pct = num(sector?.pct);
  const nifty = num(market?.quotes?.nifty?.pct);
  const gap = pct !== null && nifty !== null ? pct - nifty : null;
  const relative = gap === null
    ? "Relative performance versus Nifty 50 is unavailable."
    : `The sector is ${gap >= 0 ? "outperforming" : "underperforming"} Nifty 50 by ${Math.abs(gap).toFixed(2)} percentage points.`;

  return {
    what: meta.scope || `${name} is an Indian NSE-linked sector signal.`,
    why: `The latest sector move is ${pct === null ? "mixed" : pct > 0 ? "positive" : pct < 0 ? "negative" : "flat"}. ${relative} A specific catalyst should be verified from current news before attributing the move to one reason.`,
    how: `Compare ${name} with Nifty 50, its intraday trend and short-term momentum to judge whether the move is broad, persistent or only a one-day divergence.`,
    nextStep: `Review your existing ${name} exposure and portfolio concentration; avoid chasing a one-day move and keep any allocation decision aligned with your goal, horizon and risk profile.`
  };
}

async function buildSectorInsight(name, env) {
  const [sectorPayload, market] = await Promise.all([
    buildSectorPayload(name),
    buildMarketPayload()
  ]);

  if (!sectorPayload.ok) return { ok: false, error: sectorPayload.error };

  const fallback = deterministicSectorInsight(name, sectorPayload.sector, market);
  if (!env.AI) {
    return { ok: true, insight: fallback, sources: [
      { title: "Nifty Indices", url: sectorPayload.officialLink },
      { title: "Public quote", url: sectorPayload.quoteLink }
    ]};
  }

  const prompt = `You are a concise Indian market sector analyst.
Return JSON only with exactly these keys: what, why, how, nextStep.
Each value must be ONE short sentence, plain text, no markdown.

Sector: ${name}
Sector data: ${JSON.stringify({
    price: sectorPayload.sector.price,
    pct: sectorPayload.sector.pct,
    open: sectorPayload.sector.open,
    high: sectorPayload.sector.high,
    low: sectorPayload.sector.low,
    return5d: sectorPayload.return5d,
    return1m: sectorPayload.return1m
  })}
Nifty 50: ${JSON.stringify(market.quotes?.nifty || {})}
Scope: ${sectorPayload.scope}
Known structural drivers: ${sectorPayload.drivers}

Instructions:
- what: explain what this sector index represents.
- why: explain the most likely CURRENT reason(s) for today's move using web search when available; do not invent a catalyst.
- how: tell an investor how to interpret today's reading versus Nifty and the short-term trend.
- nextStep: give a non-personalized investor action such as review allocation/concentration, watch confirmation, or avoid chasing.
- No buy/sell calls, no return promises.`;

  let result = null;
  try {
    result = await env.AI.run("@cf/google/gemma-4-26b-a4b-it", {
      messages: [{ role: "user", content: prompt }],
      stream: false,
      max_completion_tokens: 420,
      temperature: 0.15,
      chat_template_kwargs: { enable_thinking: false },
      web_search_options: {}
    });
  } catch (_) {
    try {
      result = await env.AI.run("@cf/google/gemma-4-26b-a4b-it", {
        messages: [{ role: "user", content: prompt }],
        stream: false,
        max_completion_tokens: 420,
        temperature: 0.15,
        chat_template_kwargs: { enable_thinking: false }
      });
    } catch (_) {}
  }

  const text = extractText(result);
  const parsed = parseJsonObject(text);
  const sources = collectSources(result || {});
  const insight = {
    what: parsed?.what || fallback.what,
    why: parsed?.why || fallback.why,
    how: parsed?.how || fallback.how,
    nextStep: parsed?.nextStep || fallback.nextStep
  };

  if (!sources.length) {
    sources.push(
      { title: "Nifty Indices", url: sectorPayload.officialLink },
      { title: "Public quote", url: sectorPayload.quoteLink }
    );
  }

  return { ok: true, insight, sources: sources.slice(0, 5) };
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
  const cacheKey = new Request(`${url.origin}/api/market?v=sgx-city-silver-1`, { method: "GET" });
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const payload = await buildMarketPayload();
  const response = json(payload, payload.ok ? 200 : 502);
  if (payload.ok) ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

// === Multi-timeframe Pulse Engine (Indian cash market, timezone IST) ===
const PULSE_FRAMES = Object.freeze({m15:15, m30:30, h1:60});
const PULSE_SYMBOLS = {
  'RELIANCE.NS':'Reliance Industries', 'INFY.NS':'Infosys',
  'TCS.NS':'Tata Consultancy Services', 'HDFCBANK.NS':'HDFC Bank',
  'ICICIBANK.NS':'ICICI Bank', 'SBIN.NS':'State Bank of India',
  'BHARTIARTL.NS':'Bharti Airtel', 'ITC.NS':'ITC',
  'WIPRO.NS':'Wipro', 'HINDUNILVR.NS':'Hindustan Unilever',
  'LT.NS':'Larsen & Toubro', 'AXISBANK.NS':'Axis Bank',
  'KOTAKBANK.NS':'Kotak Mahindra Bank', 'BAJFINANCE.NS':'Bajaj Finance',
  'MARUTI.NS':'Maruti Suzuki', 'TATAMOTORS.NS':'Tata Motors',
  'SUNPHARMA.NS':'Sun Pharma', 'NTPC.NS':'NTPC',
  'TATASTEEL.NS':'Tata Steel', 'ONGC.NS':'ONGC'
};
const TZ = 'Asia/Kolkata';
function pulseParts(epochMs) {
  const fields = new Intl.DateTimeFormat('en-GB',{timeZone:TZ, year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date(epochMs));
  const p = Object.fromEntries(fields.map(x=>[x.type,x.value]));
  return {date:`${p.year}-${p.month}-${p.day}`, mins:Number(p.hour)*60+Number(p.minute), time:`${p.hour}:${p.minute}`};
}
function pulsePct(x,y){return Number.isFinite(x)&&Number.isFinite(y)&&y!==0 ? (x-y)*100/y : null}
function pulseClamp(v,a,b){return Math.min(b,Math.max(a,v))}
function pulseTrend(score){return score>=65?'STRONG BULLISH':score>=35?'BULLISH':score>=15?'MILD BULLISH':score<=-65?'STRONG BEARISH':score<=-35?'BEARISH':score<=-15?'MILD BEARISH':'NEUTRAL'}
function chartFiveMinuteBars(r){
 const timestamps=r.timestamp||[], q=r.indicators?.quote?.[0]||{}, bars=[];
 for(let i=0;i<timestamps.length;i++){
  const at=Number(timestamps[i])*1000, close=num(q.close?.[i]), open=num(q.open?.[i]);
  if(!Number.isFinite(at)||close===null)continue;
  const t=pulseParts(at);
  if(t.mins<555||t.mins>=930||((t.mins-555)%5))continue;
  bars.push({date:t.date,mins:t.mins,time:t.time,epoch:Number(timestamps[i]),open:open??close,close,high:num(q.high?.[i]),low:num(q.low?.[i]),volume:num(q.volume?.[i])});
 }
 return bars;
}
function completedPulseBars(bars,period,asOfMs=Date.now()){
 const groups=new Map(), now=pulseParts(asOfMs);
 for(const bar of bars){
  const sessionIdx=Math.floor((bar.mins-555)/period), start=555+sessionIdx*period, end=start+period;
  if(end>930)continue; // no pretend-complete 60-minute candle at 15:30 (last hour is partial)
  const key=`${bar.date}/${start}`;
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push(bar);
 }
 const completed=[];
 for(const [key,vals] of groups){
  const [date,startTxt]=key.split('/'),start=Number(startTxt),end=start+period;
  if(date>now.date || (date===now.date&&end>now.mins))continue;
  vals.sort((a,b)=>a.mins-b.mins);
  const expected=period/5;
  const slots=new Set(vals.map(v=>v.mins));
  if(slots.size!==expected || vals[0].mins!==start || vals[vals.length-1].mins!==end-5)continue;
  let valid=true;for(let t=start;t<end;t+=5){if(!slots.has(t)){valid=false;break}}
  if(!valid)continue;
  completed.push({date, start, end, time:`${String(Math.floor(end/60)).padStart(2,'0')}:${String(end%60).padStart(2,'0')}`,open:vals[0].open,close:vals[vals.length-1].close,high:Math.max(...vals.map(v=>v.high??v.close)),low:Math.min(...vals.map(v=>v.low??v.close)),volume:vals.every(v=>v.volume!==null)?vals.reduce((a,v)=>a+v.volume,0):null});
 }
 completed.sort((a,b)=>a.date.localeCompare(b.date)||a.start-b.start);
 return completed;
}
function intradayObservation(bars,period,asOfMs){
 const completed=completedPulseBars(bars,period,asOfMs);
 if(!completed.length)return null;
 const last=completed[completed.length-1];
 // The observation measures the move within the last fully completed period.
 return {pct:pulsePct(last.close,last.open),close:last.close,previousClose:last.open,open:last.open,high:last.high,low:last.low,volume:last.volume,sessionDate:last.date,asOf:`${last.date} ${last.time} IST`,barEnd:last.time,barCount:completed.filter(x=>x.date===last.date).length,periodMinutes:period,complete:true};
}
function dailyObservations(r,asOfMs=Date.now()){
 const ts=r.timestamp||[],q=r.indicators?.quote?.[0]||{}, now=pulseParts(asOfMs),metaEpoch=Number(r.meta?.regularMarketTime||0)*1000;
 const map=new Map();
 for(let i=0;i<ts.length;i++){
  const close=num(q.close?.[i]),epoch=Number(ts[i])*1000;
  if(close===null||!Number.isFinite(epoch))continue;
  const p=pulseParts(epoch);
  const currentDay=p.date===now.date;
  // Current day counts ONLY after cash close and source's latest update is after close.
  if(p.date>now.date || (currentDay && (now.mins<930||pulseParts(metaEpoch).date!==p.date||pulseParts(metaEpoch).mins<930)))continue;
  map.set(p.date,{date:p.date,close});
 }
 const days=[...map.values()].sort((a,b)=>a.date.localeCompare(b.date));
 const rows=days.slice(1).map((x,i)=>({...x,pct:pulsePct(x.close,days[i].close)}));
 return {latest:rows.length?{pct:rows[rows.length-1].pct,close:rows[rows.length-1].close,previousClose:days[days.length-2].close,sessionDate:rows[rows.length-1].date,asOf:`${rows[rows.length-1].date} 15:30 IST`,complete:true}:null,history:rows.slice(-35)};
}
function pulseScore(observation,peers=[],stockMode=false,frame='m15'){
 if(!observation||!Number.isFinite(observation.pct))return null;
 const scales=stockMode?{m15:1,m30:1.5,h1:2.2,d1:3.5}:{m15:0.45,m30:0.65,h1:0.95,d1:1.5};
 const basis=pulseClamp(observation.pct/scales[frame]*75,-100,100);
 const aligned=peers.filter(p=>p&&p.sessionDate===observation.sessionDate&&Number.isFinite(p.pct));
 const peerMean=aligned.length ? aligned.reduce((a,p)=>a+pulseClamp(p.pct/scales[frame]*75,-100,100),0)/aligned.length : 0;
 const score=Math.round(basis*(stockMode?1:aligned.length?0.7:1)+peerMean*(stockMode?0:aligned.length?0.3:0));
 const agreement=aligned.filter(p=>Math.sign(p.pct)===Math.sign(observation.pct)).length;
 const coverage=stockMode?'Single-stock price momentum':`${1+aligned.length}/3 index signals`;
 const confidence=pulseClamp(Math.round((stockMode?50:54)+Math.min(2,aligned.length)*7+(stockMode?0:agreement*5)+Math.min(Math.abs(observation.pct/scales[frame]),1)*8),40,84);
 return {...observation,score,signal:pulseTrend(score),confidence,coverage,relative:stockMode&&aligned[0]?observation.pct-aligned[0].pct:null,method:stockMode?'Stock-only price momentum (not market breadth)':'Index momentum with available Bank Nifty/Sensex confirmation',predictive:false};
}
function validPulseSymbol(input){
 const s=String(input||'^NSEI').trim().toUpperCase();
 if(s==='^NSEI')return s;
 return /^[A-Z0-9&-]{1,20}\.(NS|BO)$/.test(s)?s:null;
}
async function buildPulsePayload(symbol){
 const stockMode=symbol!=='^NSEI';
 const symbols=stockMode?[symbol,'^NSEI']:[symbol,'^NSEBANK','^BSESN'];
 const data=await Promise.all(symbols.map(async key=>{
  const [five,daily]=await Promise.allSettled([fetchYahooChart(key,'5m','5d'),fetchYahooChart(key,'1d','2mo')]);
  return {key,five:five.status==='fulfilled'?five.value:null,daily:daily.status==='fulfilled'?daily.value:null,error:five.status==='rejected'&&daily.status==='rejected'?String(five.reason):null};
 }));
 const primary=data[0],now=Date.now();
 if(!primary.five&&!primary.daily)return {ok:false,error:primary.error||'This symbol is not available from the public quote source.'};
 const observations={};
 for(const datum of data){
  const o={};
  if(datum.five){
   const bars=chartFiveMinuteBars(datum.five);
   for(const [name,minutes] of Object.entries(PULSE_FRAMES))o[name]=intradayObservation(bars,minutes,now);
  }
  if(datum.daily)o.d1=dailyObservations(datum.daily,now).latest;
  observations[datum.key]=o;
 }
 const p=observations[symbol];const peers=stockMode?[observations['^NSEI']]:data.slice(1).map(d=>observations[d.key]);
 const periods={};
 for(const frame of ['m15','m30','h1','d1'])periods[frame]=pulseScore(p[frame],peers.map(x=>x?.[frame]),stockMode,frame);
 const latestRaw=primary.five||primary.daily;
 const quote=normalizeChart(latestRaw,false);
 const session=pulseParts((quote.epoch||0)*1000);
 const history=primary.daily?dailyObservations(primary.daily,now).history:[];
 return {ok:true,symbol,name:stockMode?(PULSE_SYMBOLS[symbol]||latestRaw.meta?.longName||latestRaw.meta?.shortName||symbol):'Nifty 50 Market',kind:stockMode?'stock':'market',quote,quoteDate:session.date,quoteTime:session.time,periods,history,source:'Public chart feed (may be delayed)',generatedAt:new Date().toISOString(),notes:'Timeframe readings use completed bars only; daily reading uses completed trading days. Scores describe past momentum, not forecast success.'};
}


// Gold Watch: publicly documented no-key sources. Gold spot and FX are separate ages.
const GOLD_PURITY=Object.freeze({"18K":750,"20K":833,"22K":916,"23K":958,"24K":999});
const TROY_OUNCE_GRAMS=31.1034768;
function finitePositive(v){const n=Number(v);return Number.isFinite(n)&&n>0?n:null}
async function fetchGoldJson(url, ttlSecs){
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),7500);
 try{
  const response=await fetch(url,{
   method:'GET',signal:controller.signal,
   headers:{accept:'application/json'},
   cf:{cacheTtl:ttlSecs,cacheEverything:true}
  });
  if(!response.ok)throw new Error('Upstream HTTP '+response.status);
  return await response.json();
 }finally{clearTimeout(timer)}
}
function constructGoldPayload(gold,fx){
 const price=finitePositive(gold?.price),rate=finitePositive(fx?.rates?.INR);
 const updated=Date.parse(gold?.updatedAt||'');
 const fxUpdated=Number(fx?.time_last_update_unix)*1000;
 if((gold?.currency&&gold.currency!=='USD')||!price||!rate||!Number.isFinite(updated))throw new Error('Gold or FX source supplied invalid value or timestamp');
 if(!Number.isFinite(fxUpdated)||fxUpdated<=0)throw new Error('FX update time invalid');
 const spot24=price*rate/TROY_OUNCE_GRAMS*0.999;
 const grades=Object.entries(GOLD_PURITY).map(([karat,fineness])=>({
   karat, fineness, perGram:spot24*fineness/999,per10Gram:spot24*fineness/999*10
 }));
 return {
   ok:true, type:'spot-derived-indicative', checkedAt:new Date().toISOString(),
   spotUsdPerOunce:price,usdInr:rate,spot24kInrPerGram:spot24,
   spotUpdatedAt:new Date(updated).toISOString(),fxUpdatedAt:new Date(fxUpdated).toISOString(),
   grades,
   source:{gold:'Gold-API XAU/USD spot',fx:'ExchangeRate-API USD/INR daily reference'},
   message:'Indicative international spot-derived INR rates, not verified Indian jewellery shop selling prices. GST, making charges and local margins excluded.'
 };
}
async function buildGoldPayload(){
 const [gold,fx]=await Promise.all([
   fetchGoldJson('https://api.gold-api.com/price/XAU',30),
   fetchGoldJson('https://open.er-api.com/v6/latest/USD',43200)
 ]);
 return constructGoldPayload(gold,fx);
}
async function goldEndpoint(request,ctx){
 const cache=caches.default;
 const origin=new URL(request.url).origin;
 const key=new Request(origin+'/api/gold?cache=20261022a');
 const cached=await cache.match(key);
 if(cached)return cached;
 try{
  const payload=await buildGoldPayload();
  const response=json(payload,200,{'cache-control':'public,max-age=45,s-maxage=45'});
  ctx.waitUntil(cache.put(key,response.clone()));
  return response;
 }catch(e){
  return json({ok:false,error:'Gold source temporarily unavailable',detail:String(e?.message||e)},502,{'cache-control':'no-store'});
 }
}


// === Silver international spot equivalent. Distinct from an Indian jeweller's retail rate. ===
async function buildSilverPayload(){
 const [silver,fx]=await Promise.all([
  fetchGoldJson('https://api.gold-api.com/price/XAG',30),
  fetchGoldJson('https://open.er-api.com/v6/latest/USD',43200)
 ]);
 const usd=finitePositive(silver?.price),inr=finitePositive(fx?.rates?.INR);
 const updated=Date.parse(silver?.updatedAt||'');
 const fxDate=Number(fx?.time_last_update_unix)*1000;
 if(!usd||!inr||!Number.isFinite(updated)||!Number.isFinite(fxDate)||silver?.currency&&silver.currency!=='USD') throw Error('Silver or foreign exchange source invalid');
 // 999 fine is a scaled fine-metal equivalent, NOT a jeweller's silver sell quote.
 const gram=usd*inr/TROY_OUNCE_GRAMS*0.999;
 return {ok:true,kind:'international-spot-indicative',metal:'Silver',purity:'999',
  priceInrPerGram:gram,priceInrPer10g:gram*10,priceInrPerKg:gram*1000,
  spotUsdPerOunce:usd,usdInr:inr,spotUpdatedAt:new Date(updated).toISOString(),
  fxUpdatedAt:new Date(fxDate).toISOString(),checkedAt:new Date().toISOString(),
  source:'Gold-API XAG/USD + ExchangeRate-API USD/INR',
  note:'International 999 fine spot-equivalent conversion; not a verified Indian city or jewellery shop silver selling price. Taxes and premiums excluded.'};
}
async function silverEndpoint(request,ctx){
 const cache=caches.default,origin=new URL(request.url).origin;
 const key=new Request(origin+'/api/silver?v=1');
 const cached=await cache.match(key);if(cached)return cached;
 try{const data=await buildSilverPayload();const r=json(data,200,{'cache-control':'public,max-age=45,s-maxage=45'});ctx.waitUntil(cache.put(key,r.clone()));return r}
 catch(e){return json({ok:false,error:'Silver spot source unavailable',detail:String(e?.message||e)},502,{'cache-control':'no-store'})}
}

// === Published city-specific retail benchmark: sourced, not calculated from foreign spot. ===
const CITY_GOLD=Object.freeze({
 'Mumbai':'mumbai','Thane':'thane','Delhi':'delhi','Chennai':'chennai',
 'Bengaluru':'bangalore','Kolkata':'kolkata','Hyderabad':'hyderabad',
 'Pune':'pune','Ahmedabad':'ahmedabad','Surat':'surat','Jaipur':'jaipur',
 'Lucknow':'lucknow','Kochi':'kochi','Indore':'indore','Nagpur':'nagpur',
 'Vadodara':'vadodara','Chandigarh':'chandigarh','Patna':'patna'
});
function cityGoldUrl(city){return `https://www.goodreturns.in/gold-rates/${CITY_GOLD[city]}.html`}
function parseCityGoldHtml(html,city){
 // The public publisher may change the HTML format or block automated fetching.
 // Scrape only explicitly published 18K / 22K / 24K city rates.
 const decoded=html.replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&')
  .replace(/&#8377;|&rupee;/gi,'₹').replace(/&quot;/gi,'"')
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
  .replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');
 let plain=decoded;
 // Content may be entirely in a meta description, so inspect the full response as well.
 if(!/Today's gold price in/i.test(plain)){
  const match=html.match(/<meta[^>]+content=["']([^"']*gold price[^"']*)["']/i);
  if(match)plain+=' '+match[1];
 }
 const pattern=/Today['’]s gold price in\s+.{2,60}?\s+stands at\s*₹\s*([\d,]+(?:\.\d+)?)\s*per gram for 24 karat gold[\s\S]{0,220}?₹\s*([\d,]+(?:\.\d+)?)\s*per gram for 22 karat gold[\s\S]{0,220}?₹\s*([\d,]+(?:\.\d+)?)\s*per gram for 18 karat gold/i;
 const found=plain.match(pattern);
 if(!found)return {ok:false,error:'Publisher retail rates could not be extracted from this city page',sourceUrl:cityGoldUrl(city)};
 const n=s=>Number(String(s).replace(/,/g,''));
 const v24=n(found[1]),v22=n(found[2]),v18=n(found[3]);
 if(![v18,v22,v24].every(v=>Number.isFinite(v)&&v>1000&&v<100000))return {ok:false,error:'Unverified published city rate range',sourceUrl:cityGoldUrl(city)};
 // Published trading date can come from the main visible gold-rate date, not Worker check time.
 let day=null;
 const datePattern=/\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d\d)\b/i;
 const dateMatch=plain.match(datePattern) || html.match(datePattern);
 if(dateMatch){
  const iso=new Date(`${dateMatch[2]} ${dateMatch[1]}, ${dateMatch[3]} 12:00:00 GMT+0530`);
  if(Number.isFinite(iso.getTime()))day=iso.toISOString().slice(0,10);
 }
 return {ok:true,city,source:'Goodreturns · published city indicative retail rates',sourceUrl:cityGoldUrl(city),
   publishedDate:day,checkedAt:new Date().toISOString(),
   rates:{'18K':v18,'22K':v22,'24K':v24,
    '20K':v24*833/999,'23K':v24*958/999},
   publishedKarat:['18K','22K','24K'],estimatedKarat:['20K','23K'],
   note:'18K, 22K and 24K are published city indicative jewellery-market rates. 20K/23K are purity-scaled estimates from that city’s published 24K benchmark, not published jeweller quotes. Prices exclude taxes, making charges and store premiums; verify directly with a jeweller.'};
}
async function cityGoldEndpoint(request,ctx){
 const url=new URL(request.url),city=String(url.searchParams.get('city')||'Mumbai');
 if(!Object.hasOwn(CITY_GOLD,city))return json({ok:false,error:'Unsupported city',supportedCities:Object.keys(CITY_GOLD)},400,{'cache-control':'no-store'});
 const cache=caches.default,key=new Request(url.origin+'/api/city-gold?city='+encodeURIComponent(city)+'&v=1');
 const hit=await cache.match(key);if(hit)return hit;
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),7500);
 try{
  const r=await fetch(cityGoldUrl(city),{signal:controller.signal,headers:{accept:'text/html'},cf:{cacheTtl:900,cacheEverything:true}});
  if(!r.ok)throw new Error('Publisher blocked quote retrieval: HTTP '+r.status);
  const txt=await r.text();
  if(txt.length>3_000_000)throw new Error('Publisher page too large');
  const data=parseCityGoldHtml(txt,city);
  const result=json(data,data.ok?200:502,{'cache-control':data.ok?'public,max-age=900,s-maxage=900':'no-store'});
  if(data.ok)ctx.waitUntil(cache.put(key,result.clone()));return result;
 }catch(e){return json({ok:false,city,error:'City retail source temporarily unavailable',sourceUrl:cityGoldUrl(city),detail:String(e?.message||e)},502,{'cache-control':'no-store'})}
 finally{clearTimeout(timer)}
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

    if ((url.pathname === "/api/gold" || url.pathname === "/api/gold/") && request.method === "GET") {
      return goldEndpoint(request,ctx);
    }

    if ((url.pathname === "/api/silver" || url.pathname === "/api/silver/") && request.method === "GET") {
      return silverEndpoint(request,ctx);
    }
    if ((url.pathname === "/api/city-gold" || url.pathname === "/api/city-gold/") && request.method === "GET") {
      return cityGoldEndpoint(request,ctx);
    }
    if (url.pathname === "/api/market" && request.method === "GET") {
      return marketResponse(request, ctx);
    }

    if (url.pathname === "/api/pulse" && request.method === "GET") {
      const symbol = validPulseSymbol(url.searchParams.get("symbol") || "^NSEI");
      if (!symbol) return json({ok:false,error:"Use a valid NSE ticker ending .NS, BSE ticker ending .BO, or the Indian Market option."},400,{"cache-control":"no-store"});
      try {
        const cache = caches.default;
        const cacheKey = new Request(`${url.origin}/api/pulse?symbol=${encodeURIComponent(symbol)}&v=1`);
        const cached = await cache.match(cacheKey);
        if (cached) return cached;
        const payload = await buildPulsePayload(symbol);
        const response = json(payload,payload.ok?200:502,{"cache-control":"public, max-age=12, s-maxage=12"});
        if(payload.ok) ctx.waitUntil(cache.put(cacheKey,response.clone()));
        return response;
      }catch(e){return json({ok:false,error:e?.message||"Pulse service temporarily unavailable"},502,{"cache-control":"no-store"});}
    }

    if (url.pathname === "/api/sector" && request.method === "GET") {
      const name = String(url.searchParams.get("name") || "").trim();
      if (!name) return json({ ok: false, error: "Sector name is required." }, 400, { "cache-control": "no-store" });
      try {
        const payload = await buildSectorPayload(name);
        return json(payload, payload.ok ? 200 : 404, { "cache-control": "public, max-age=15, s-maxage=15" });
      } catch (error) {
        return json({ ok: false, error: error instanceof Error ? error.message : String(error) }, 500, { "cache-control": "no-store" });
      }
    }

    if (url.pathname === "/api/sector-insight" && request.method === "POST") {
      try {
        const body = await request.json();
        const name = String(body?.name || "").trim();
        if (!name) return json({ ok: false, error: "Sector name is required." }, 400, { "cache-control": "no-store" });
        const payload = await buildSectorInsight(name, env);
        return json(payload, payload.ok ? 200 : 500, { "cache-control": "no-store" });
      } catch (error) {
        return json({ ok: false, error: error instanceof Error ? error.message : String(error) }, 500, { "cache-control": "no-store" });
      }
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

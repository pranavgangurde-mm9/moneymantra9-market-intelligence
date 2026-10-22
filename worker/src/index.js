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


const FULL_SECTOR_INDEX_NAMES = ["IT", "Auto", "Pharma", "FMCG", "Metal", "Realty", "Energy", "PSU Bank", "Financial Services", "Infrastructure", "Media", "Banking"];
const OFFICIAL_SECTOR_CONSTITUENT_FILES = {"IT": "ind_niftyitlist.csv", "Auto": "ind_niftyautolist.csv", "Banking": "ind_niftybanklist.csv", "Pharma": "ind_niftypharmalist.csv", "FMCG": "ind_niftyfmcglist.csv", "Metal": "ind_niftymetallist.csv", "Realty": "ind_niftyrealtylist.csv", "PSU Bank": "ind_niftypsubanklist.csv", "Financial Services": "ind_niftyfinancelist.csv", "Media": "ind_niftymedialist.csv", "Healthcare": "ind_niftyhealthcarelist.csv", "Private Bank": "ind_niftyprivatebanklist.csv", "Consumer Durables": "ind_niftyconsumerdurableslist.csv", "Oil and Gas": "ind_niftyoilgaslist.csv"};

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

  const abort=new AbortController();
  const timer=setTimeout(()=>abort.abort(),8500);
  let j;
  try{
    const r = await fetch(target, {
      signal:abort.signal,
      headers: {
        "accept": "application/json,text/plain,*/*",
        "user-agent": "Mozilla/5.0 (compatible; MM9-Market-Intelligence/2.0)"
      },
      cf: { cacheTtl: 10, cacheEverything: true }
    });
    if (!r.ok) throw new Error(`Yahoo ${symbol}: HTTP ${r.status}`);
    j = await r.json();
  }finally{clearTimeout(timer)}
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
          price:c,
          pct: ((c - prev) / prev) * 100
        });
      }
    }
  }

  return out;
}


async function buildSectorPayload(name) {
  const symbol=sectorSymbol(name),known=FULL_SECTOR_INDEX_NAMES.includes(name)||['Energy','Infrastructure'].includes(name);
  if(!known)return {ok:false,error:'Unknown index name'};
  const meta=SECTOR_META[name]||{},base={ok:true,name,scope:meta.scope||`Nifty ${name} is an NSE sectoral index. View the official index page for current definitions and methodology.`,drivers:meta.drivers||'Earnings, industry demand, macroeconomic conditions and policy.',officialLink:officialSectorLink(name),quoteLink:symbol?quoteLink(symbol):null,source:'NSE Indices documentation',sector:{name,symbol,price:null,pct:null,timeline:[]},return5d:null,return1m:null,dataAsOf:null,priceAvailable:false};
  if(!symbol)return {...base,note:'No verified free public quote adapter mapped for this newer NSE index.'};
  const [dayR,fiveR,monthR]=await Promise.allSettled([fetchYahooChart(symbol,'5m','1d'),fetchYahooChart(symbol,'1d','5d'),fetchYahooChart(symbol,'1d','1mo')]);
  if(dayR.status==='fulfilled'){
    const sector=normalizeChart(dayR.value,true);
    if(sector.price!==null&&sector.pct!==null){
      const epoch=sector.epoch;
      base.sector={...sector,name,symbol};base.priceAvailable=true;base.source='Yahoo Finance public chart (delayed)';
      if(epoch)base.dataAsOf=new Intl.DateTimeFormat('en-IN',{timeZone:'Asia/Kolkata',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(epoch*1000))+' IST';
    }
  }
  if(fiveR.status==='fulfilled')base.return5d=rangeReturn(fiveR.value);
  if(monthR.status==='fulfilled')base.return1m=rangeReturn(monthR.value);
  if(!base.priceAvailable)base.note='No currently accessible chart quote; official index scope/constituents are still available.';
  return base;
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

async function sectorConstituents(name,ctx){
 if(!(['IT','Auto','Pharma','FMCG','Metal','Realty','Energy','PSU Bank','Financial Services','Infrastructure','Media','Banking'].includes(name)))return {ok:false,error:'Sector not part of the 12 monitored sectors'};
 const file=OFFICIAL_SECTOR_CONSTITUENT_FILES[name];
 const base='https://www.niftyindices.com/IndexConstituent/';
 if(!file)return {ok:false,error:'Public CSV mapping not confirmed for this index. Use the NSE Indices download link.',sourceUrl:officialSectorLink(name)};
 const link=base+file;
 try{
  const r=await fetch(link,{headers:{accept:'text/csv,application/octet-stream,text/plain'},cf:{cacheTtl:21600,cacheEverything:true}});
  if(!r.ok)return {ok:false,error:`NSE constituent download returned HTTP ${r.status}`,sourceUrl:link};
  const t=await r.text();if(t.length>1500000)throw Error('CSV size too large');
  const lines=t.replace(/^\uFEFF/,'').split(/\r?\n/).filter(Boolean);
  if(lines.length<3)throw Error('No constituent rows returned');
  const header=readCsvLine(lines.shift()).map(x=>x.trim().toLowerCase());
  const si=header.findIndex(x=>/symbol/.test(x)),ni=header.findIndex(x=>/company|name/.test(x));
  if(si<0)throw Error('Unexpected CSV header');
  const items=lines.map(line=>readCsvLine(line)).map(cols=>({symbol:(cols[si]||'').trim(),name:(cols[ni]||'').trim()})).filter(x=>/^[A-Z0-9&-]{1,25}$/.test(x.symbol)).slice(0,80);
  if(!items.length)throw Error('No valid stock symbols in constituent file');
  return {ok:true,items,sourceUrl:link,sourceDate:'Published file; review NSE methodology for reconstitution date',source:'NSE Indices constituent CSV'};
 }catch(e){return {ok:false,error:e.message||String(e),sourceUrl:link}}
}

async function computeNiftyBreadth(){
 // Prefer a single official exchange response. Do not use 51 external requests
 // (Free Workers currently permit 50 external subrequests per invocation).
 const url='https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%2050';
 try{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8500);
  let data;
  try{
   const r=await fetch(url,{signal:controller.signal,headers:{accept:'application/json','user-agent':'Mozilla/5.0 (compatible; MM9 MarketWatch/1.0)','referer':'https://www.nseindia.com/market-data/live-market-indices'},cf:{cacheTtl:900,cacheEverything:true}});
   if(!r.ok)throw Error('Exchange API returned HTTP '+r.status);
   data=await r.json();
  }finally{clearTimeout(timer)}
  const summary=data.advance||data.advances||null;
  if(summary&&typeof summary==='object'){
    const adv=num(summary.advances),dec=num(summary.declines),unchanged=num(summary.unchanged);
    if([adv,dec,unchanged].every(Number.isInteger)&&adv+dec+unchanged===50){
      return {ok:true,adv,dec,unchanged,coverage:50,asOf:data.timestamp||'Exchange timestamp unavailable',source:'NSE official Nifty 50 advances/declines',sourceUrl:url};
    }
  }
  const rows=Array.isArray(data.data)?data.data:[];
  const constituents=rows.filter(x=>x?.symbol&&x.symbol!=='NIFTY 50'&&x.symbol!=='NIFTY50'&&num(x.pChange)!==null);
  if(constituents.length!==50)throw Error(`Received ${constituents.length} valid constituent changes instead of 50`);
  const changes=constituents.map(x=>num(x.pChange));
  return {ok:true,adv:changes.filter(x=>x>0).length,dec:changes.filter(x=>x<0).length,unchanged:changes.filter(x=>x===0).length,coverage:50,asOf:data.timestamp||'Exchange timestamp unavailable',source:'NSE 50 constituent change snapshot',sourceUrl:'https://www.nseindia.com/market-data/live-market-indices'};
 }catch(error){
  return {ok:false,error:'NSE 50-constituent source unavailable: '+(error?.message||String(error)),sourceUrl:'https://www.nseindia.com/market-data/live-market-indices'};
 }
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

async function answerFinanceQuestion(question, env, history=[],appContext={}) {
  const query=String(question||'').trim();
  const context=appContext&&typeof appContext==='object'?appContext:{};
  const asksGold=/\b(gold|22\s*k|24\s*k|18\s*k|sone|sona)\b/i.test(query);
  const asksSilver=/\b(silver|chandi)\b/i.test(query);
  const followupMetal=Array.isArray(history)&&history.slice(-4).some(x=>x?.role==='user'&&/\b(gold|silver|22\s*k|24\s*k|sone|sona|chandi)\b/i.test(String(x.content||'')));
  const asksPrice=/\b(price|rate|today|current|latest|value|kitna|kitne|how much)\b/i.test(query)||((asksGold||asksSilver)&&followupMetal);
  // The authoritative branch never asks an LLM to invent a commodity price.
  if((asksGold||asksSilver)&&asksPrice){
    const p=await fetchIndiaBenchmark().catch(()=>null);
    if(!p||!p.ok){return {ok:true,answer:`I could not verify a current Indian ${asksGold?'gold':'silver'} benchmark. Please use Markets → ${asksGold?'Gold':'Silver'} Watch and check the publisher date before using a price.`,model:'India benchmark availability check',dataDate:null,sources:[]}}
    const isGold=asksGold&&!asksSilver;
    const rate=isGold?Number(p.gold24kPer10g)/10:Number(p.silver999PerKg)/1000;
    if(!Number.isFinite(rate)||rate<=0)return {ok:true,answer:'The Indian benchmark publisher did not provide a verified rate for this metal; no value is displayed.',model:'India rate validator',sources:[]};
    const grade=(query.match(/(18|20|22|23|24)\s*k/i)||[])[1]||'24';
    const fineness={'18':750,'20':833,'22':916,'23':958,'24':999}[grade];
    const weightMatch=query.match(/(\d+(?:\.\d+)?)\s*(?:grams?|gm|g)\b/i);
    const grams=weightMatch?Number(weightMatch[1]):1;
    const unit=Number.isFinite(grams)&&grams>0&&grams<=100000?grams:1;
    const estimate=rate*(fineness/999)*unit;
    const text=isGold?`India ${grade}K gold benchmark equivalent: ₹${(rate*fineness/999).toLocaleString('en-IN',{maximumFractionDigits:2})}/g, dated ${p.publishedDate}. ${unit!==1?`${unit} g metal-value estimate: ₹${estimate.toLocaleString('en-IN',{maximumFractionDigits:2})}. `:''}This is a published India reference; GST and jeweller making charges can change the final price.`:`India 999 silver benchmark: ₹${rate.toLocaleString('en-IN',{maximumFractionDigits:2})}/g, dated ${p.publishedDate}. ${unit!==1?`${unit} g metal-value estimate: ₹${(rate*unit).toLocaleString('en-IN',{maximumFractionDigits:2})}. `:''}This is not a live MCX quote or jeweller selling price.`;
    return {ok:true,answer:text,model:'India bullion benchmark',dataDate:p.publishedDate,sources:[{title:'India bullion benchmark',url:'https://allindiabullion.com/benchmark'}]};
  }
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

  const safeHistory=Array.isArray(history)?history.slice(-8).filter(x=>['user','assistant'].includes(x?.role)).map(x=>({role:x.role,content:String(x.content||'').slice(0,700)})):[];
  const clientAppContext={selectedSymbol:context.selectedSymbol,selectedName:context.selectedName,timeframe:context.timeframe,quote:context.quote,recentCloses:context.recentCloses,marketSession:context.marketSession,gold:context.gold,silver:context.silver};
  const user = `QUESTION:
${question}

LIVE/RECENT MARKET DATA WITH SOURCE TIMESTAMPS:
${JSON.stringify(marketContext)}

APP SCREEN CONTEXT (MAY BE CACHED; CHECK DATES):
${JSON.stringify(clientAppContext)}

PRIOR CONVERSATION TURNS (USE TO RESOLVE FOLLOW-UP QUESTIONS):
${JSON.stringify(safeHistory)}`;

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

const NSE_DIRECTORY_URL='https://archives.nseindia.com/content/equities/EQUITY_L.csv';
function readCsvLine(line){
 const vals=[];let value='',quoted=false;
 for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'){if(quoted&&line[i+1]==='"'){value+='"';i++}else quoted=!quoted}else if(ch===','&&!quoted){vals.push(value.trim());value=''}else value+=ch}
 vals.push(value.trim());return vals;
}
async function symbolsEndpoint(request,ctx,env={},force=false){
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 let stored=null;
 if(env.SYMBOLS_KV){try{stored=await env.SYMBOLS_KV.get('nse-mainboard-equity-list','json')}catch(e){console.log('KV read unavailable',String(e))}}
 if(!force&&stored?.ok&&stored?.items?.length>1000&&stored.cachedDate===today)return json({...stored,fromCache:true},200,{'cache-control':'public, max-age=1800'});
 const origin=new URL(request.url).origin,cache=caches.default,key=new Request(origin+'/api/symbols?v=20261022-2');
 const cached=!force?await cache.match(key):null;if(cached)return cached;
 const urls=[NSE_DIRECTORY_URL,'https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv'];
 let last='NSE directory not reachable';
 for(const url of urls){try{
    const r=await fetch(url,{headers:{'user-agent':'Mozilla/5.0','accept':'text/csv,text/plain,*/*','referer':'https://www.nseindia.com/'},cf:{cacheEverything:true,cacheTtl:86400}});
    if(!r.ok){last=`NSE CSV HTTP ${r.status}`;continue}
    const txt=await r.text();if(!/^SYMBOL\s*,/im.test(txt.slice(0,500))){last='Unexpected NSE format';continue}
    const lines=txt.replace(/^\uFEFF/,'').split(/\r?\n/).filter(Boolean),head=readCsvLine(lines.shift()).map(x=>x.toUpperCase());
    const id=head.indexOf('SYMBOL'),nm=head.indexOf('NAME OF COMPANY'),series=head.indexOf('SERIES');if(id<0||nm<0)throw Error('NSE columns unavailable');
    const seen=new Set(),items=[];
    for(const line of lines){const parts=readCsvLine(line);const sym=parts[id]?.toUpperCase(),name=parts[nm];if(series>=0&&parts[series]?.toUpperCase()!=='EQ')continue;
      if(!sym||!name||!/^[A-Z0-9&-]{1,20}$/.test(sym)||seen.has(sym))continue;seen.add(sym);items.push([sym+'.NS',name]);}
    if(items.length<1000)throw Error('NSE directory incomplete');
    const data={ok:true,items,count:items.length,asOf:new Date().toISOString(),cachedDate:today,source:'NSE securities available for equity trading',sourceUrl:url,refresh:env.SYMBOLS_KV?'Scheduled daily when Cron/KV configured':'daily on first request'};
    if(env.SYMBOLS_KV)ctx.waitUntil(env.SYMBOLS_KV.put('nse-mainboard-equity-list',JSON.stringify(data)));
    const response=json(data,200,{'cache-control':'public, max-age=3600, s-maxage=86400'});ctx.waitUntil(cache.put(key,response.clone()));return response;
 }catch(e){last=e.message}}
 if(stored?.ok&&stored?.items?.length>1000)return json({...stored,fromCache:true,note:'NSE refresh failed; last saved directory used',error:null},200,{'cache-control':'public, max-age=600'});
 return json({ok:false,error:'NSE equity directory temporarily unavailable: '+last,sourceUrl:NSE_DIRECTORY_URL},503,{'cache-control':'no-store'});
}

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
  if(p.date>now.date || (currentDay && (now.mins<945||pulseParts(metaEpoch).date!==p.date||pulseParts(metaEpoch).mins<925)))continue;
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


// India-benchmark replacement for international XAU/XAG conversion.
const GOLD_PURITY=Object.freeze({"18K":750,"20K":833,"22K":916,"23K":958,"24K":999});
// INDIAN BULLION BENCHMARK — published domestic reference, NOT XAU/USD conversion.
// All India Bullion explicitly permits quoting its daily fix with attribution.
// Rate is a dated reference, NOT a real-time MCX tick or a jeweller's final price.
const INDIA_BENCHMARK_URL = 'https://allindiabullion.com/benchmark';
const INDIA_BENCHMARK_CACHE_VERSION = 'india-metals-20261022-v1';
const INDIA_MONTHS = Object.freeze({january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,september:9,october:10,november:11,december:12});
function decodeBenchmarkHtml(markup){
  return String(markup||'')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
    .replace(/<!--[\s\S]*?-->/g,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/&(?:nbsp|#160);/gi,' ')
    .replace(/&#x20b9;|&#8377;|&rupee;/gi,'₹')
    .replace(/&amp;/gi,'&').replace(/\s+/g,' ').trim();
}
function parseIndiaBenchmark(html){
  const all=decodeBenchmarkHtml(html);
  const start=all.search(/Latest\s+fix/i);
  if(start<0)throw Error('No latest daily fix found on publisher page');
  const limit=all.slice(start,start+2500);
  const untilCitation=limit.search(/How to cite it/i);
  const block=untilCitation>0?limit.slice(0,untilCitation):limit;
  const dateMatch=block.match(/\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})\b/i);
  const goldMatch=block.match(/Gold\s*999\s*\(?24K\)?[\s\S]{0,180}?₹\s*([\d,]+)/i);
  const silverMatch=block.match(/Silver\s*999[\s\S]{0,180}?₹\s*([\d,]+)/i);
  if(!dateMatch || !goldMatch || !silverMatch)throw Error('Publisher changed daily benchmark layout');
  const gold=Number(goldMatch[1].replace(/,/g,''));
  const silver=Number(silverMatch[1].replace(/,/g,''));
  if(!(gold>=20000 && gold<=500000 && silver>=20000 && silver<=1000000))throw Error('Benchmark values failed India-rate plausibility check');
  const day=Number(dateMatch[1]),month=INDIA_MONTHS[dateMatch[2].toLowerCase()],year=Number(dateMatch[3]);
  const stamp=`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  const dateObj=new Date(`${stamp}T03:00:00+05:30`);
  if(!Number.isFinite(dateObj.getTime())||new Date(Date.UTC(year,month-1,day)).getUTCDate()!==day)throw Error('Benchmark date invalid');
  const age=Date.now()-dateObj.getTime();
  if(age < -12*3600000 || age>9*86400000)throw Error('Indian benchmark too old or future-dated');
  return {
    ok:true,kind:'india-daily-benchmark',country:'India',
    gold24kPer10g:gold,silver999PerKg:silver,
    publishedDate:stamp,priceAsOf:dateObj.toISOString(),checkedAt:new Date().toISOString(),
    sourceName:'All India Bullion — daily India benchmark',sourceUrl:INDIA_BENCHMARK_URL,
    attribution:`All India Bullion benchmark, ${dateMatch[1]} ${dateMatch[2]} ${dateMatch[3]}, 03:00 IST`,
    notRealtime:true,
    note:'Published India-wide reference, recorded at 03:00 IST. Not a streaming exchange price, not a shop quote; GST and making charges excluded.'
  };
}
async function fetchIndiaBenchmark(){
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),11000);
  try{
    const res=await fetch(INDIA_BENCHMARK_URL,{
      method:'GET',signal:ctrl.signal,
      headers:{accept:'text/html'},cf:{cacheTtl:1800,cacheEverything:true}
    });
    if(!res.ok)throw Error(`Publisher HTTP ${res.status}`);
    return parseIndiaBenchmark(await res.text());
  }finally{clearTimeout(timer)}
}
async function indiaBenchmarkEndpoint(request,ctx){
  const origin=new URL(request.url).origin;
  const cacheKey=new Request(origin+'/api/india-metals?version='+INDIA_BENCHMARK_CACHE_VERSION);
  const cache=caches.default;
  const hit=await cache.match(cacheKey);
  if(hit)return hit;
  try{
    const payload=await fetchIndiaBenchmark();
    const response=json(payload,200,{'cache-control':'public,max-age=1800,s-maxage=1800'});
    ctx.waitUntil(cache.put(cacheKey,response.clone()));
    return response;
  }catch(e){
    return json({ok:false,kind:'india-daily-benchmark',error:'Published Indian metal benchmark unavailable',detail:String(e?.message||e),sourceUrl:INDIA_BENCHMARK_URL},502,{'cache-control':'no-store'});
  }
}
async function goldEndpoint(request,ctx){
  const base=await indiaBenchmarkEndpoint(request,ctx),j=await base.json();
  if(!j.ok)return json(j,502,{'cache-control':'no-store'});
  return json({...j,metal:'Gold',spot24kInrPerGram:j.gold24kPer10g/10,grades:Object.entries(GOLD_PURITY).map(([karat,p])=>({karat,fineness:p,perGram:j.gold24kPer10g/10*p/999}))},200,{'cache-control':'public,max-age=1800,s-maxage=1800'});
}
async function silverEndpoint(request,ctx){
  const base=await indiaBenchmarkEndpoint(request,ctx),j=await base.json();
  if(!j.ok)return json(j,502,{'cache-control':'no-store'});
  return json({...j,metal:'Silver',purity:'999',priceInrPerKg:j.silver999PerKg,priceInrPerGram:j.silver999PerKg/1000,priceInrPer10g:j.silver999PerKg/100},200,{'cache-control':'public,max-age=1800,s-maxage=1800'});
}

// === City gold rates: credentialed providers only; no automated publisher scraping. ===
// Priority: API Express (monthly trial allowance advertised), then Nebula (prepaid credits).
const CITY_GOLD=Object.freeze({
 'Mumbai':'mumbai','Thane':'thane','Delhi':'delhi','Chennai':'chennai',
 'Bengaluru':'bangalore','Kolkata':'kolkata','Hyderabad':'hyderabad',
 'Pune':'pune','Ahmedabad':'ahmedabad','Surat':'surat','Jaipur':'jaipur',
 'Lucknow':'lucknow','Kochi':'kochi','Indore':'indore','Nagpur':'nagpur',
 'Vadodara':'vadodara','Chandigarh':'chandigarh','Patna':'patna'
});
function cityGoldUrl(city){return `https://www.goodreturns.in/gold-rates/${CITY_GOLD[city]}.html`}
function amount(x){
 const n=Number(x);
 return x!==null&&x!==undefined&&x!==''&&Number.isFinite(n)&&n>1000&&n<1000000?n:null;
}
function entryPrice(x){
 if(typeof x==='number'||typeof x==='string')return amount(x);
 if(x&&typeof x==='object')return amount(x.pricePerGram??x.finalPricePerGram??x.rate??x.price);
 return null;
}
function dateFromSource(x){
 if(typeof x==='string'&&/^20\d{2}-\d{2}-\d{2}$/.test(x))return x;
 const ms=Date.parse(x||'');return Number.isFinite(ms)?new Date(ms).toISOString().slice(0,10):null;
}
function dateForTodayInIndia(){
 return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()).replace(/(\d{2})\/(\d{2})\/(\d{4})/,'$3-$2-$1');
}
function cityPayload(city, provider, url, p18,p22,p24, hasGST, date, updatedAt, metadata={}){
 if(![p22,p24].every(x=>x!==null))throw new Error('Missing 22K or 24K provider prices');
 // Basic cross-purity validation; do not forward untrusted or outdated samples as confirmed market data.
 const ratio=p22/p24;
 if(ratio<0.83||ratio>0.98)throw new Error('Inconsistent 22K/24K rate ratio');
 const rates={ '18K':p18??p24*(750/999), '20K':p24*(833/999), '22K':p22, '23K':p24*(958/999), '24K':p24 };
 return {
   ok:true,city,source:provider,sourceType:'Third-party city indicative retail reference; not a jeweller counter quote',
   sourceUrl:url,verifyUrl:cityGoldUrl(city),publishedDate:date,quoteTimestamp:updatedAt||null,
   checkedAt:new Date().toISOString(),rates,
   publishedKarat:p18?['18K','22K','24K']:['22K','24K'],
   estimatedKarat:p18?['20K','23K']:['18K','20K','23K'],
   gstIncluded:hasGST===true,makingChargesIncluded:false,
   providerConfidence:metadata.confidence||null,
   note:'Rates are per gram in INR. Provider-supplied purities and calculated equivalents are identified separately. Local jewellery margins, making charges, stones and buyback deductions may differ.'
 };
}
async function apiExpressCity(city,key){
 const url='https://api.apiexpress.in/v1/commodity/gold?city='+encodeURIComponent(city);
 const ctrl=new AbortController(),tm=setTimeout(()=>ctrl.abort(),9500);
 try{
   const r=await fetch(url,{signal:ctrl.signal,headers:{Authorization:'Bearer '+key,Accept:'application/json'}});
   if(!r.ok)throw Error('API Express HTTP '+r.status);
   const raw=await r.json(),data=raw?.data||raw;
   const p24=entryPrice(data.gold_24k??data.gold24k??data.rates?.gold24k),
         p22=entryPrice(data.gold_22k??data.gold22k??data.rates?.gold22k),
         p18=entryPrice(data.gold_18k??data.gold18k??data.rates?.gold18k);
   if(raw?.status==='error'||raw?.success===false)throw Error('Provider reported error');
   const date=dateFromSource(data.updated||data.timestamp||data.date);
   if(!date)throw Error('API Express response lacks a verifiable date');
   return cityPayload(city,'API Express · city quote API', 'https://www.apiexpress.in/apis/commodity-price',p18,p22,p24,data.gst_included??null,date,data.updated||data.timestamp||null);
 }finally{clearTimeout(tm)}
}
async function nebulaCity(city,key){
 const url='https://workspace.nebulaapi.com/gold_price?city='+encodeURIComponent(city);
 const ctrl=new AbortController(),tm=setTimeout(()=>ctrl.abort(),9500);
 try{
   const r=await fetch(url,{signal:ctrl.signal,headers:{'x-api-key':key,Accept:'application/json'}});
   if(!r.ok)throw Error('Nebula HTTP '+r.status);
   const raw=await r.json();if(raw?.success===false)throw Error('Provider reported error');
   const data=raw?.prices||{};
   const p24=entryPrice(data.gold24k),p22=entryPrice(data.gold22k),p18=entryPrice(data.gold18k);
   const date=dateFromSource(raw.date||raw.timestamp);
   if(!date)throw Error('Nebula response lacks a verifiable date');
   return cityPayload(city,'Nebula Metals · city quote API','https://metals.nebulaapi.com/docs/guides/gold-prices',p18,p22,p24,true,date,raw.timestamp||null,raw.metadata||{});
 }finally{clearTimeout(tm)}
}
async function crossCheckGoldCity(p){
 // Validate against the independent gold spot feed when reachable.
 // Do not confuse international spot equivalence with local shop reference prices.
 try{
   const q=await buildGoldPayload(); const base=q?.spot24kInrPerGram;
   if(!Number.isFinite(base)||base<=0)return p;
   const ratio=p.rates['24K']/base;
   if(ratio<0.73||ratio>1.75)throw Error('Provider rate is implausible versus independent international spot benchmark');
   p.spotCrossCheck='within broad sanity range';
   return p;
 }catch(e){
   if(String(e?.message||'').includes('implausible'))throw e;
   p.spotCrossCheck='not available';return p;
 }
}
async function cityGoldEndpoint(request,env,ctx){
 const url=new URL(request.url),city=String(url.searchParams.get('city')||'Mumbai').trim();
 if(!Object.hasOwn(CITY_GOLD,city))return json({ok:false,error:'Unsupported city',supportedCities:Object.keys(CITY_GOLD)},400,{'cache-control':'no-store'});
 const configured=Boolean(env.APIEXPRESS_KEY||env.NEBULA_API_KEY);
 if(!configured)return json({ok:false,city,error:'City rate feed not configured',detail:'Set APIEXPRESS_KEY or NEBULA_API_KEY as a Cloudflare Worker secret. City rates cannot be sourced reliably from blocked publisher pages.',setupRequired:true,sourceUrl:cityGoldUrl(city),providerOptions:['API Express','Nebula Metals']},503,{'cache-control':'no-store'});
 // Cache longer than the 15-second market refresh: city rates generally publish daily.
 // Cloudflare Cache API may be per-colo and is not a global quota guarantee.
 const cache=caches.default,provider=env.APIEXPRESS_KEY?'apiexpress':'nebula';
 const cacheKey=new Request(url.origin+'/api/city-gold?city='+encodeURIComponent(city)+'&provider='+provider+'&v=4');
 const cached=await cache.match(cacheKey);if(cached)return cached;
 const errors=[];
 for(const [name,key,fn] of [['API Express',env.APIEXPRESS_KEY,apiExpressCity],['Nebula Metals',env.NEBULA_API_KEY,nebulaCity]]){
   if(!key)continue;
   try{
     const payload=await crossCheckGoldCity(await fn(city,key));
     const response=json(payload,200,{'cache-control':'public,max-age=21600,s-maxage=21600'});
     ctx.waitUntil(cache.put(cacheKey,response.clone()));return response;
   }catch(e){errors.push(`${name}: ${String(e?.message||e)}`)}
 }
 return json({ok:false,city,error:'Configured city providers unavailable',detail:errors.join('; ').slice(0,240),sourceUrl:cityGoldUrl(city),retryLater:true},502,{'cache-control':'no-store'});
}


const GIFT_OFFICIAL_STATUS_URL='https://www.nseindia.com/api/marketStatus';
function parseGiftNiftyMarketStatus(payload,now=Date.now()){
 const row=payload?.giftnifty;
 if(!row || String(row.SYMBOL||'').toUpperCase()!=='NIFTY')throw Error('Official market status has no GIFT Nifty future');
 const price=num(row.LASTPRICE),pct=num(row.PERCHANGE);
 if(price===null||price<5000||price>100000||pct===null||Math.abs(pct)>30)throw Error('GIFT quote price/change invalid');
 const stamp=String(row.TIMESTMP||'').trim();
 const match=stamp.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})\s+(\d{1,2}):(\d{2})$/);
 if(!match)throw Error('GIFT quote timestamp missing/unrecognized');
 const months={jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};
 const month=months[match[2].toLowerCase()];if(month===undefined)throw Error('Invalid month');
 const epoch=Date.UTC(+match[3],month,+match[1],+match[4],+match[5])-330*60000;
 const ageMinutes=Math.round((now-epoch)/60000);
 if(!Number.isFinite(epoch)||ageMinutes < -10||ageMinutes>72*60)throw Error('GIFT quote older than 72 hours or future-dated');
 return {price,pct,epoch:Math.floor(epoch/1000),asOf:stamp+' IST',expiry:row.EXPIRYDATE||null,ageMinutes,
  source:'NSE India market-status GIFT Nifty future (NSE IX)',isLive:ageMinutes<=5};
}
async function giftEndpoint(request,ctx){
 const u=new URL(request.url),cache=caches.default,key=new Request(u.origin+'/api/gift?rev=r4');
 const hit=await cache.match(key);if(hit)return hit;
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),9000);
 try{
  const r=await fetch(GIFT_OFFICIAL_STATUS_URL,{signal:ctrl.signal,headers:{accept:'application/json',referer:'https://www.nseindia.com/', 'user-agent':'Mozilla/5.0 (compatible; MoneyMantra9/1.0)'},cf:{cacheTtl:30,cacheEverything:true}});
  if(!r.ok)throw Error('Official quote endpoint HTTP '+r.status);
  const quote=parseGiftNiftyMarketStatus(await r.json());
  const response=json({ok:true,quote,checkedAt:new Date().toISOString(),sourceUrl:'https://www.nseindia.com/api/marketStatus'},200,{'cache-control':'public, max-age=30, s-maxage=30'});
  ctx.waitUntil(cache.put(key,response.clone()));return response;
 }catch(e){return json({ok:false,error:'GIFT Nifty official source unavailable: '+String(e?.message||e),sourceUrl:'https://www.nseix.com/',checkedAt:new Date().toISOString()},503,{'cache-control':'no-store'})}
 finally{clearTimeout(timer)}
}
const BREADTH_LIST_CSV='https://www.niftyindices.com/IndexConstituent/ind_nifty50list.csv';
async function breadthConstituentSymbols(){
 const r=await fetch(BREADTH_LIST_CSV,{headers:{accept:'text/csv,text/plain,application/octet-stream'},cf:{cacheTtl:21600,cacheEverything:true}});
 if(!r.ok)throw Error('Nifty 50 official constituent file HTTP '+r.status);
 const body=await r.text();if(body.length>150000)throw Error('Unexpected constituent file size');
 const lines=body.replace(/^\uFEFF/,'').split(/\r?\n/).filter(Boolean);
 const head=readCsvLine(lines.shift()||'').map(x=>x.trim().toLowerCase());
 const si=head.findIndex(x=>x==='symbol'||x==='symbol '||x.includes('symbol'));
 if(si<0)throw Error('NSE file missing Symbol header');
 const names=lines.map(l=>readCsvLine(l)[si]?.trim()).filter(x=>/^[A-Z0-9&-]{1,20}$/.test(x||''));
 if(names.length!==50||new Set(names).size!==50)throw Error(`Official constituent file has ${names.length} valid symbols, expected 50`);
 return names;
}
function quoteDateIST(epochSecs){
 return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(epochSecs*1000));
}
async function breadthBatchEndpoint(request,ctx){
 const u=new URL(request.url),part=Number(u.searchParams.get('part'));
 if(!Number.isInteger(part)||part<0||part>1)return json({ok:false,error:'part must be 0 or 1'},400,{'cache-control':'no-store'});
 const cache=caches.default,key=new Request(u.origin+`/api/breadth-batch?part=${part}&rev=r4`),cached=await cache.match(key);
 if(cached)return cached;
 try{
  const names=(await breadthConstituentSymbols()).slice(part*25,part*25+25);
  const items=[],errors=[];
  // Small bounded concurrency reduces burst rate limits while remaining under Free Worker's 50 subrequest cap.
  for(let offset=0;offset<25;offset+=5){
   const results=await Promise.allSettled(names.slice(offset,offset+5).map(async symbol=>{
     const q=normalizeChart(await fetchYahooChart(symbol+'.NS','1d','2d'));
     if(q.epoch===null||q.pct===null||q.price===null)throw Error('Quote has no price or timestamp');
     return {symbol,pct:q.pct,epoch:q.epoch,quoteDate:quoteDateIST(q.epoch)};
   }));
   results.forEach((r,i)=>{if(r.status==='fulfilled')items.push(r.value);else errors.push(String(r.reason?.message||r.reason))});
  }
  const dates=[...new Set(items.map(x=>x.quoteDate))];
  if(items.length!==25||dates.length!==1)return json({ok:false,part,coverage:items.length,error:`Only ${items.length}/25 valid prices or dates disagree`,note:errors[0]||'Check provider limits'},503,{'cache-control':'no-store'});
  const body={ok:true,part,snapshotDate:dates[0],items,source:'Yahoo Finance delayed NSE constituent chart quotes'};
  const res=json(body,200,{'cache-control':'public, max-age=900, s-maxage=900'});ctx.waitUntil(cache.put(key,res.clone()));return res;
 }catch(e){return json({ok:false,part,error:String(e?.message||e),sourceUrl:BREADTH_LIST_CSV},503,{'cache-control':'no-store'})}
}

export default {
  // Optional daily Cron at 07:15 IST; requires SYMBOLS_KV binding for durable cross-client storage.
  async scheduled(controller,env,ctx){
    try{const r=await symbolsEndpoint(new Request('https://mm9-market-proxy.pranav-gangurde1.workers.dev/api/symbols'),ctx,env,true);
      if(!r.ok)console.log('Scheduled NSE refresh unavailable',r.status);
    }catch(e){console.log('Scheduled NSE refresh failed',String(e))}
  },
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

    if ((url.pathname === "/api/india-metals" || url.pathname === "/api/india-metals/") && request.method === "GET") {
      return indiaBenchmarkEndpoint(request,ctx);
    }
    if ((url.pathname === "/api/gold" || url.pathname === "/api/gold/") && request.method === "GET") {
      return goldEndpoint(request,ctx);
    }

    if ((url.pathname === "/api/silver" || url.pathname === "/api/silver/") && request.method === "GET") {
      return silverEndpoint(request,ctx);
    }
    if ((url.pathname === "/api/city-gold" || url.pathname === "/api/city-gold/") && request.method === "GET") {
      return cityGoldEndpoint(request,env,ctx);
    }
    if (url.pathname === "/api/market" && request.method === "GET") {
      return marketResponse(request, ctx);
    }

    if (url.pathname === "/api/symbols" && request.method === "GET") return symbolsEndpoint(request,ctx,env);

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

    if(url.pathname==='/api/sector-constituents'&&request.method==='GET'){
      const name=String(url.searchParams.get('name')||'').trim();
      const payload=await sectorConstituents(name,ctx);
      return json(payload,payload.ok?200:503,{'cache-control':payload.ok?'public, max-age=3600, s-maxage=21600':'no-store'});
    }
    if(url.pathname==='/api/gift'&&request.method==='GET')return giftEndpoint(request,ctx);
    if(url.pathname==='/api/breadth-batch'&&request.method==='GET')return breadthBatchEndpoint(request,ctx);
    if(url.pathname==='/api/breadth'&&request.method==='GET'){
      const cache=caches.default,key=new Request(`${url.origin}/api/breadth?v=r3`);
      const saved=await cache.match(key);if(saved)return saved;
      try{const result=await computeNiftyBreadth();const r=json(result,result.ok?200:503,{'cache-control':result.ok?'public, max-age=900, s-maxage=900':'no-store'});
       if(result.ok)ctx.waitUntil(cache.put(key,r.clone()));return r;}
      catch(e){return json({ok:false,error:String(e)},503,{'cache-control':'no-store'})}
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

        const answer = await answerFinanceQuestion(question, env, body?.history, body?.appContext);
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

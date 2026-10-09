# MoneyMantra 9 Finance AI — Reliability Fix

## Why the previous AI failed

The Workers AI binding was connected correctly. The model sometimes returned no final answer content because reasoning/thinking consumed the response, or the response was nested differently.

## What changed

Primary model:
@cf/google/gemma-4-26b-a4b-it

The Worker now sends:
chat_template_kwargs: { enable_thinking: false }

Cloudflare's own Workers AI getting-started guide uses this approach to disable thinking and produce a normal answer response.

For freshness-sensitive questions, built-in web search is requested.

Fallback chain:
1. Gemma 4 + web search (for current/latest questions)
2. Gemma 4 without web search
3. GLM-4.7-Flash without web search

The response parser now supports standard choices[0].message.content and recursively handles nested text containers while deliberately ignoring hidden reasoning fields.

## Update steps

1. Cloudflare → Workers & Pages → mm9-market-proxy → Edit code.
2. Replace the entire Worker code with:
   worker/src/index.js
3. Deploy.
4. Keep your existing Workers AI binding named AI.

Then replace the GitHub Pages root index.html with the one in this package.

config.js remains:
window.MM9_CONFIG = {
  API_BASE: "https://mm9-market-proxy.pranav-gangurde1.workers.dev"
};

## Tests

Try:
- What is SIP?
- What is the latest RBI repo rate?
- How is the Indian market today?
- Explain India VIX using today's market.
- What is term insurance?

For a latest/current question, the status line should show “+ web search” if the model used the built-in web-search path.

# MoneyMantra 9 Finance AI — [object Object] Fix

## What caused the bug

Workers AI GLM-4.7-Flash can return an OpenAI-style response object containing:

choices[0].message.content

The previous Worker attempted to use String(result), which displays JavaScript objects as:

[object Object]

This build includes a response extractor that supports:
- choices[0].message.content
- response strings
- nested response/result/output/message objects
- array content parts

## Internet/web search change

The old DuckDuckGo Instant Answer / RelatedTopics lookup has been removed because it is not a general web-search API and could return irrelevant context.

For current/fresh questions, this Worker now asks GLM-4.7-Flash to use its built-in `web_search_options` capability.
If web search is unavailable for that request, the Worker automatically retries the AI answer without web search.

The MoneyMantra market payload is always supplied separately for current index/sector context.

## Update your existing Cloudflare Worker

1. Cloudflare → Workers & Pages → mm9-market-proxy → Edit code.
2. Replace the entire Worker code with:
   worker/src/index.js
3. Deploy.
4. Keep the existing Workers AI binding named AI.

## Test

Health:
https://mm9-market-proxy.pranav-gangurde1.workers.dev/health

Then test the app with:
- What is SIP?
- How is the Indian market today?
- What is the latest RBI repo rate?
- Explain India VIX and relate it to today's market.

## GitHub update

Replace the GitHub Pages root `index.html` with the one in this package.
Keep your existing config.js pointing to:
https://mm9-market-proxy.pranav-gangurde1.workers.dev

Then commit, let Pages redeploy, and clear the site's cache/storage once.

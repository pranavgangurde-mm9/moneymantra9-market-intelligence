# MoneyMantra 9 Finance AI — Concise Answer Update

This build changes the Finance AI behavior to:

- maximum 3 sentences
- usually 1–2 sentences
- simple conversational wording
- no tables
- no headings
- no long lists
- no Markdown formatting
- answer only what was asked

Web search is now selective.

Examples:
- "Explain VIX" → no web search; explain the concept and use current MoneyMantra market context if relevant.
- "How is Nifty today?" → use MoneyMantra market proxy, no general web search.
- "What is the latest RBI repo rate?" → web search because the value can change.
- "Latest SEBI circular on..." → web search.
- "What is SIP?" → no web search.

A hard post-processing function also limits the final answer to three sentences even if the AI model tries to answer at length.

Update steps:
1. Cloudflare → mm9-market-proxy → Edit code.
2. Replace the Worker code with worker/src/index.js from this package.
3. Deploy.
4. Replace GitHub Pages index.html with the new index.html.
5. Commit and clear the site cache once.

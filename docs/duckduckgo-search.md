---
summary: "DuckDuckGo search setup for web_search"
read_when:
  - You want to use DuckDuckGo for web_search
  - You need a free, no-API-key search option
---

# DuckDuckGo Search

OpenClaw can use DuckDuckGo as a search provider for the `web_search` tool. DuckDuckGo is completely free, requires no API key, and is privacy-friendly.

## Why DuckDuckGo?

- ✅ **Free**: No API key or account required
- ✅ **Privacy-friendly**: DuckDuckGo doesn't track users
- ✅ **Default**: Automatically used when no API key is configured
- ✅ **Open source**: Uses the `duck-duck-scrape` package

## How it works

DuckDuckGo is automatically selected as the default provider when:
- No `tools.web.search.provider` is set AND
- No `BRAVE_API_KEY` is configured

You can also explicitly set it:

```json5
{
  tools: {
    web: {
      search: {
        provider: "duckduckgo"
        // 不需要 apiKey
      }
    }
  }
}
```

## Config example

```json5
{
  tools: {
    web: {
      search: {
        provider: "duckduckgo",
        maxResults: 10,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15
      }
    }
  }
}
```

## Limitations

- **Rate limits**: DuckDuckGo may rate-limit requests (this is an unofficial API)
- **No freshness filter**: Unlike Brave, DuckDuckGo doesn't support filtering by date
- **Unofficial API**: Uses web scraping, so may break if DuckDuckGo changes their HTML structure

## Comparison with other providers

| Feature | DuckDuckGo | Brave | Perplexity |
|---------|-----------|-------|------------|
| Cost | Free | Free tier | Paid |
| API Key | Not needed | Required | Required |
| Privacy | High | Medium | Medium |
| Freshness filter | ❌ | ✅ | ❌ |
| AI synthesis | ❌ | ❌ | ✅ |

## When to use DuckDuckGo

- **Testing/Development**: Quick setup without API keys
- **Privacy-conscious users**: Want to avoid tracking
- **Low-volume usage**: Occasional searches won't hit rate limits
- **Budget constraints**: No budget for API keys

## When to use other providers

- **High-volume usage**: Use Brave or Perplexity for better reliability
- **Need freshness filters**: Use Brave
- **Need AI-synthesized answers**: Use Perplexity

## Testing DuckDuckGo via the Dashboard (UI)

Follow these steps to test DuckDuckGo search from the OpenClaw web interface:

### 1. Ensure DuckDuckGo is the active provider

- **Default**: If you have not set `BRAVE_API_KEY` and have not set `tools.web.search.provider`, DuckDuckGo is already the default. No config change needed.
- **Explicit**: To force DuckDuckGo, set in `~/.openclaw/openclaw.json`:
  ```json5
  {
    "tools": {
      "web": {
        "search": {
          "provider": "duckduckgo"
        }
      }
    }
  }
  ```

### 2. Start the gateway and open the dashboard

```bash
# 若网关未运行，先启动
pnpm openclaw gateway run --port 18789

# 在另一终端获取带 token 的 Dashboard 链接并打开浏览器
pnpm openclaw dashboard
```

Or open directly: `http://127.0.0.1:18789/` (if you see "unauthorized", run `pnpm openclaw dashboard` and use the printed URL with `?token=...`).

### 3. Open the Chat tab

In the dashboard sidebar, click **Chat** (聊天). You should see the chat input at the bottom.

### 4. Send a message that triggers web search

Ask something that clearly needs web search so the agent uses the `web_search` tool, for example:

- **English**: "Search the web for: latest news about open source AI 2026"
- **中文**: "请搜索：A股大盘成交量 2026年2月最新走势"
- **Simple**: "What is the weather in Beijing today? Search the web."

The agent will call `web_search`; with DuckDuckGo configured, results will come from DuckDuckGo.

### 5. Verify it used DuckDuckGo

- In the chat, look for a **Web Search** (or `web_search`) tool card in the reply. It should show search results (titles, URLs, snippets).
- If the gateway logs are visible (e.g. `tail -f /tmp/openclaw/openclaw-*.log`), you may see search-related activity when you send the message.
- The reply content should be based on real web results (from DuckDuckGo).

### Troubleshooting

- **No search results / tool not used**: Ensure `tools.web.search.enabled` is not `false`. Try a more explicit request: "Use web search to find ...".
- **Still using Brave**: Unset `BRAVE_API_KEY` and set `tools.web.search.provider` to `"duckduckgo"`, then restart the gateway.
- **Dashboard disconnected**: Run `pnpm openclaw dashboard` and open the URL it prints (with token).

See [Dashboard](/web/dashboard) and [Web tools](/tools/web) for more.

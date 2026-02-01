# DuckDuckGo Search Plugin

开源、免费的互联网搜索插件，使用 DuckDuckGo 作为搜索提供商，无需 API key。

## 安装

1. 安装依赖：
```bash
cd extensions/duckduckgo-search
pnpm install
```

2. 启用插件：
```json5
{
  plugins: {
    entries: {
      "duckduckgo-search": { enabled: true }
    }
  }
}
```

## 配置

```json5
{
  plugins: {
    entries: {
      "duckduckgo-search": {
        enabled: true,
        config: {
          // 可选：设置默认结果数量（1-20）
          maxResults: 10,
          // 可选：超时时间（秒）
          timeoutSeconds: 30
        }
      }
    }
  }
}
```

## 使用

插件会注册一个 `duckduckgo_search` 工具，使用方法与 `web_search` 相同：

```javascript
await duckduckgo_search({
  query: "A股大盘成交量 2026年2月最新走势",
  count: 10
});
```

## 特点

- ✅ 完全免费，无需 API key
- ✅ 开源实现
- ✅ 隐私友好（DuckDuckGo 不追踪用户）
- ✅ 支持中文搜索
- ✅ 支持地区特定搜索

## 注意事项

- 这是非官方 API，通过网页抓取实现
- 可能受到 DuckDuckGo 的速率限制
- 结果格式可能与官方 API 不同

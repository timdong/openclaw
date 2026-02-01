# DuckDuckGo 集成计划

## 概述

将 DuckDuckGo 作为第三个搜索提供商集成到 OpenClaw 的 `web_search` 工具中。DuckDuckGo 是完全免费、开源、隐私友好的搜索引擎，无需 API key。

## 目标

- ✅ 添加 DuckDuckGo 作为 `web_search` 的提供商选项
- ✅ 保持与现有 Brave/Perplexity 提供商的兼容性
- ✅ 无需 API key 即可使用（默认提供商）
- ✅ 支持中文和地区特定搜索
- ✅ 完整的类型安全和配置验证

## 技术方案

### 依赖选择

使用 `duck-duck-scrape` npm 包（19k+ 周下载量，TypeScript 支持）：
- 包名：`duck-duck-scrape`
- 版本：`^2.3.0`
- 特点：TypeScript 支持、活跃维护、支持多种搜索类型

### 架构设计

1. **扩展 SEARCH_PROVIDERS 常量**：添加 "duckduckgo"
2. **修改类型定义**：更新所有相关的 TypeScript 类型
3. **实现搜索逻辑**：添加 DuckDuckGo 搜索函数
4. **更新配置解析**：支持 duckduckgo 提供商配置
5. **设置默认提供商**：当没有 API key 时，默认使用 DuckDuckGo

## 详细实施计划

### 阶段 1：依赖管理

**文件：`package.json`**

```json
{
  "dependencies": {
    "duck-duck-scrape": "^2.3.0"
  }
}
```

**操作：**
1. 运行 `pnpm add duck-duck-scrape`
2. 验证依赖安装成功

---

### 阶段 2：核心搜索工具实现

**文件：`src/agents/tools/web-search.ts`**

#### 2.1 导入依赖

**位置：** 文件顶部（第 1-18 行之后）

```typescript
import { search as duckDuckGoSearch } from "duck-duck-scrape";
```

#### 2.2 更新 SEARCH_PROVIDERS 常量

**位置：** 第 20 行

**修改前：**
```typescript
const SEARCH_PROVIDERS = ["brave", "perplexity"] as const;
```

**修改后：**
```typescript
const SEARCH_PROVIDERS = ["brave", "perplexity", "duckduckgo"] as const;
```

#### 2.3 添加 DuckDuckGo 结果类型

**位置：** 第 85 行之后（BraveSearchResponse 类型之后）

```typescript
type DuckDuckGoSearchResult = {
  title?: string;
  url?: string;
  description?: string;
  icon?: string;
};

type DuckDuckGoSearchResponse = {
  results: DuckDuckGoSearchResult[];
  noResults?: boolean;
  vqd?: string;
};
```

#### 2.4 更新 missingSearchKeyPayload 函数

**位置：** 第 131-145 行

**修改：**
```typescript
function missingSearchKeyPayload(provider: (typeof SEARCH_PROVIDERS)[number]) {
  if (provider === "perplexity") {
    return {
      error: "missing_perplexity_api_key",
      message:
        "web_search (perplexity) needs an API key. Set PERPLEXITY_API_KEY or OPENROUTER_API_KEY in the Gateway environment, or configure tools.web.search.perplexity.apiKey.",
      docs: "https://docs.openclaw.ai/tools/web",
    };
  }
  if (provider === "duckduckgo") {
    return {
      error: "duckduckgo_no_key_needed",
      message: "DuckDuckGo search does not require an API key.",
      docs: "https://docs.openclaw.ai/tools/web",
    };
  }
  return {
    error: "missing_brave_api_key",
    message: `web_search needs a Brave Search API key. Run \`${formatCliCommand("openclaw configure --section web")}\` to store it, or set BRAVE_API_KEY in the Gateway environment.`,
    docs: "https://docs.openclaw.ai/tools/web",
  };
}
```

#### 2.5 更新 resolveSearchProvider 函数

**位置：** 第 147-159 行

**修改：**
```typescript
function resolveSearchProvider(search?: WebSearchConfig): (typeof SEARCH_PROVIDERS)[number] {
  const raw =
    search && "provider" in search && typeof search.provider === "string"
      ? search.provider.trim().toLowerCase()
      : "";
  if (raw === "perplexity") {
    return "perplexity";
  }
  if (raw === "duckduckgo") {
    return "duckduckgo";
  }
  if (raw === "brave") {
    return "brave";
  }
  // 默认：如果没有配置 API key，使用 DuckDuckGo（免费）
  const hasBraveKey = Boolean(resolveSearchApiKey(search));
  return hasBraveKey ? "brave" : "duckduckgo";
}
```

#### 2.6 添加 DuckDuckGo 搜索函数

**位置：** 第 351 行之后（runPerplexitySearch 函数之后）

```typescript
async function runDuckDuckGoSearch(params: {
  query: string;
  count: number;
  timeoutSeconds: number;
  country?: string;
  search_lang?: string;
}): Promise<DuckDuckGoSearchResponse> {
  // 映射国家代码（DuckDuckGo 使用小写，如 "us", "cn", "hk"）
  const region = params.country?.toLowerCase() || "us";
  
  // DuckDuckGo 不支持 freshness 参数，但支持 region
  const results = await duckDuckGoSearch(params.query, {
    safeSearch: "moderate",
    region: region,
  });

  return {
    results: results.results || [],
    noResults: results.results?.length === 0,
  };
}
```

#### 2.7 更新 runWebSearch 函数

**位置：** 第 353-453 行

**修改缓存键生成（第 367-371 行）：**
```typescript
const cacheKey = normalizeCacheKey(
  params.provider === "brave"
    ? `${params.provider}:${params.query}:${params.count}:${params.country || "default"}:${params.search_lang || "default"}:${params.ui_lang || "default"}:${params.freshness || "default"}`
    : params.provider === "perplexity"
      ? `${params.provider}:${params.query}:${params.count}:${params.country || "default"}:${params.search_lang || "default"}:${params.ui_lang || "default"}`
      : `${params.provider}:${params.query}:${params.count}:${params.country || "default"}:${params.search_lang || "default"}`,
);
```

**在 Perplexity 处理之后添加 DuckDuckGo 处理（第 398 行之后）：**
```typescript
if (params.provider === "duckduckgo") {
  const ddgResults = await runDuckDuckGoSearch({
    query: params.query,
    count: params.count,
    timeoutSeconds: params.timeoutSeconds,
    country: params.country,
    search_lang: params.search_lang,
  });

  const mapped = ddgResults.results.slice(0, params.count).map((entry) => ({
    title: entry.title ?? "",
    url: entry.url ?? "",
    description: entry.description ?? "",
    icon: entry.icon ?? undefined,
    siteName: resolveSiteName(entry.url ?? ""),
  }));

  const payload = {
    query: params.query,
    provider: params.provider,
    count: mapped.length,
    tookMs: Date.now() - start,
    results: mapped,
  };
  writeCache(SEARCH_CACHE, cacheKey, payload, params.cacheTtlMs);
  return payload;
}
```

**更新错误检查（第 400 行）：**
```typescript
if (params.provider !== "brave" && params.provider !== "duckduckgo") {
  throw new Error("Unsupported web search provider.");
}
```

#### 2.8 更新 createWebSearchTool 函数

**位置：** 第 467-470 行（描述部分）

**修改：**
```typescript
const description =
  provider === "perplexity"
    ? "Search the web using Perplexity Sonar (direct or via OpenRouter). Returns AI-synthesized answers with citations from real-time web search."
    : provider === "duckduckgo"
      ? "Search the web using DuckDuckGo (free, no API key required). Returns search results with titles, URLs, and snippets. Privacy-friendly alternative to other search providers."
      : "Search the web using Brave Search API. Supports region-specific and localized search via country and language parameters. Returns titles, URLs, and snippets for fast research.";
```

**位置：** 第 477-485 行（API key 检查）

**修改：**
```typescript
const perplexityAuth =
  provider === "perplexity" ? resolvePerplexityApiKey(perplexityConfig) : undefined;
const apiKey =
  provider === "perplexity"
    ? perplexityAuth?.apiKey
    : provider === "duckduckgo"
      ? "" // DuckDuckGo 不需要 API key
      : resolveSearchApiKey(search);

// DuckDuckGo 不需要 API key，跳过检查
if (provider !== "duckduckgo" && !apiKey) {
  return jsonResult(missingSearchKeyPayload(provider));
}
```

**位置：** 第 494 行（freshness 检查）

**修改：**
```typescript
if (rawFreshness && provider !== "brave") {
  return jsonResult({
    error: "unsupported_freshness",
    message: "freshness is only supported by the Brave web_search provider.",
    docs: "https://docs.openclaw.ai/tools/web",
  });
}
```

---

### 阶段 3：类型定义更新

**文件：`src/config/types.tools.ts`**

**位置：** 第 339-340 行

**修改前：**
```typescript
/** Search provider ("brave" or "perplexity"). */
provider?: "brave" | "perplexity";
```

**修改后：**
```typescript
/** Search provider ("brave", "perplexity", or "duckduckgo"). */
provider?: "brave" | "perplexity" | "duckduckgo";
```

---

### 阶段 4：配置验证更新

**文件：`src/config/zod-schema.agent-runtime.ts`**

**位置：** 第 174 行

**修改前：**
```typescript
provider: z.union([z.literal("brave"), z.literal("perplexity")]).optional(),
```

**修改后：**
```typescript
provider: z.union([z.literal("brave"), z.literal("perplexity"), z.literal("duckduckgo")]).optional(),
```

---

### 阶段 5：配置文档更新

**文件：`src/config/schema.ts`**

**位置：** 第 438 行（需要查找确切位置）

**修改：**
```typescript
"tools.web.search.provider": 'Search provider ("brave", "perplexity", or "duckduckgo").',
```

---

### 阶段 6：文档更新

#### 6.1 更新 Web 工具文档

**文件：`docs/tools/web.md`**

**位置：** 第 29-35 行（提供商对比表）

**添加：**
```markdown
| **DuckDuckGo** | Free, no API key, privacy-friendly | Rate limits possible | No API key |
```

**位置：** 第 38-49 行（提供商配置示例）

**添加：**
```markdown
Example: switch to DuckDuckGo (free, no API key):

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
```

#### 6.2 创建 DuckDuckGo 专用文档

**文件：`docs/duckduckgo-search.md`**

创建新文件，内容参考 `docs/brave-search.md` 的结构。

---

### 阶段 7：测试

#### 7.1 单元测试

**文件：`src/agents/tools/web-search.test.ts`**

添加测试用例：
1. DuckDuckGo 提供商解析
2. DuckDuckGo 搜索执行
3. 无 API key 时默认使用 DuckDuckGo
4. DuckDuckGo 结果格式验证

#### 7.2 集成测试

**文件：`src/agents/tools/web-tools.enabled-defaults.test.ts`**

添加 DuckDuckGo 相关测试用例。

---

### 阶段 8：配置向导更新

**文件：`src/commands/configure.wizard.ts`**

**位置：** `promptWebToolsConfig` 函数

更新提示信息，提及 DuckDuckGo 作为免费选项。

---

## 实施检查清单

### 代码修改
- [ ] 安装 `duck-duck-scrape` 依赖
- [ ] 更新 `SEARCH_PROVIDERS` 常量
- [ ] 添加 DuckDuckGo 类型定义
- [ ] 实现 `runDuckDuckGoSearch` 函数
- [ ] 更新 `runWebSearch` 函数
- [ ] 更新 `resolveSearchProvider` 函数
- [ ] 更新 `missingSearchKeyPayload` 函数
- [ ] 更新 `createWebSearchTool` 函数
- [ ] 更新类型定义文件
- [ ] 更新 Zod schema
- [ ] 更新配置 schema

### 测试
- [ ] 编写单元测试
- [ ] 编写集成测试
- [ ] 测试无 API key 场景
- [ ] 测试中文搜索
- [ ] 测试地区特定搜索
- [ ] 测试错误处理

### 文档
- [ ] 更新 `docs/tools/web.md`
- [ ] 创建 `docs/duckduckgo-search.md`
- [ ] 更新配置向导提示
- [ ] 更新 CHANGELOG.md

### 验证
- [ ] 运行 `pnpm lint`
- [ ] 运行 `pnpm build`
- [ ] 运行 `pnpm test`
- [ ] 手动测试搜索功能
- [ ] 验证默认提供商逻辑

## 实施步骤

### Step 1: 准备阶段（5 分钟）
1. 创建功能分支：`git checkout -b feat/duckduckgo-search`
2. 安装依赖：`pnpm add duck-duck-scrape`

### Step 2: 核心实现（30 分钟）
1. 修改 `src/agents/tools/web-search.ts`
2. 按照阶段 2 的详细说明逐步修改

### Step 3: 类型和配置（15 分钟）
1. 更新 `src/config/types.tools.ts`
2. 更新 `src/config/zod-schema.agent-runtime.ts`
3. 更新 `src/config/schema.ts`

### Step 4: 测试（20 分钟）
1. 编写单元测试
2. 运行测试确保通过

### Step 5: 文档（15 分钟）
1. 更新现有文档
2. 创建新文档

### Step 6: 验证（10 分钟）
1. 运行 lint 和 build
2. 手动测试功能

### Step 7: 提交（5 分钟）
1. 提交代码
2. 创建 PR

**总预计时间：约 100 分钟（1.5-2 小时）**

## 风险评估

### 低风险
- ✅ DuckDuckGo 是成熟的搜索引擎
- ✅ `duck-duck-scrape` 包稳定且活跃维护
- ✅ 不影响现有 Brave/Perplexity 功能

### 中风险
- ⚠️ DuckDuckGo 可能对爬虫有速率限制
- ⚠️ 非官方 API，可能在未来失效

### 缓解措施
- 添加错误处理和重试逻辑
- 在文档中说明限制
- 保持 Brave/Perplexity 作为备选方案

## 后续优化

1. **速率限制处理**：添加请求间隔和重试逻辑
2. **结果缓存优化**：针对 DuckDuckGo 优化缓存策略
3. **地区支持**：完善国家代码映射
4. **性能监控**：添加搜索性能指标

## 参考资源

- [duck-duck-scrape npm 包](https://www.npmjs.com/package/duck-duck-scrape)
- [DuckDuckGo 官方网站](https://duckduckgo.com/)
- [OpenClaw 工具文档](https://docs.openclaw.ai/tools/web)

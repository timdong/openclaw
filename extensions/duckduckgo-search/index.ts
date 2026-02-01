import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { search } from "duck-duck-scrape";

const DuckDuckGoSearchSchema = Type.Object({
  query: Type.String({ description: "Search query string." }),
  count: Type.Optional(
    Type.Number({
      description: "Number of results to return (1-20).",
      minimum: 1,
      maximum: 20,
    }),
  ),
  region: Type.Optional(
    Type.String({
      description: "Region code for localized results (e.g., 'us', 'cn', 'hk'). Default: 'us'.",
    }),
  ),
});

export default function (api: OpenClawPluginApi) {
  api.registerTool(
    {
      name: "duckduckgo_search",
      label: "DuckDuckGo Search",
      description:
        "Search the web using DuckDuckGo (free, no API key required). Returns search results with titles, URLs, and snippets. Privacy-friendly alternative to web_search.",
      parameters: DuckDuckGoSearchSchema,
      async execute(_toolCallId, args) {
        const params = args as Record<string, unknown>;
        const query = typeof params.query === "string" ? params.query : "";
        const count = typeof params.count === "number" ? Math.min(Math.max(1, params.count), 20) : 10;
        const region = typeof params.region === "string" ? params.region : "us";

        if (!query) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    error: "missing_query",
                    message: "Query parameter is required.",
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }

        try {
          const results = await search(query, {
            safeSearch: "moderate",
            region: region.toLowerCase(),
          });

          const mapped = results.results.slice(0, count).map((result: any) => ({
            title: result.title || "",
            url: result.url || "",
            description: result.description || "",
            icon: result.icon || undefined,
          }));

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    query,
                    provider: "duckduckgo",
                    count: mapped.length,
                    results: mapped,
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    error: "search_failed",
                    message: `DuckDuckGo search failed: ${errorMessage}`,
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }
      },
    },
    { optional: true },
  );
}

"use client";

import { useCallback, useRef } from "react";
import type { ToolMeta } from "@/types/tool";
import { TOOLS } from "@/tools/registry";

/** Lazy-loaded FlexSearch document index */
let searchIndex: ReturnType<typeof createSearchIndex> | null = null;

function createSearchIndex() {
  // Dynamic require to avoid SSR issues with FlexSearch
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const FlexSearch = require("flexsearch");
  const index = new FlexSearch.Document({
    document: {
      id: "slug",
      index: [
        { field: "name", tokenize: "forward", resolution: 9 },
        { field: "description", tokenize: "forward", resolution: 5 },
        { field: "tags", tokenize: "forward", resolution: 7 },
      ],
    },
    tokenize: "forward",
    resolution: 9,
    cache: 100,
  });

  for (const tool of TOOLS) {
    index.add({
      slug: tool.slug,
      name: tool.name,
      description: tool.description,
      tags: tool.tags.join(" "),
    });
  }

  return index;
}

/** Ensure search index is initialized (lazy loaded, client-only) */
function ensureIndex() {
  if (!searchIndex) {
    searchIndex = createSearchIndex();
  }
  return searchIndex;
}

/** Search tools by query string */
export function searchTools(query: string): ToolMeta[] {
  if (!query.trim()) return [];

  const index = ensureIndex();
  const results = index.search(query, { limit: 20, enrich: true });

  // Merge results from different fields, deduplicate by slug
  const slugSet = new Set<string>();
  const slugs: string[] = [];

  for (const fieldResults of results) {
    for (const result of fieldResults.result as Array<string | { slug: string }>) {
      const slug = typeof result === "string" ? result : result.slug;
      if (!slugSet.has(slug)) {
        slugSet.add(slug);
        slugs.push(slug);
      }
    }
  }

  // Map back to ToolMeta, preserving search rank order
  return slugs
    .map((slug) => TOOLS.find((t) => t.slug === slug))
    .filter((t): t is ToolMeta => t !== undefined);
}

/** Hook for search functionality */
export function useSearch() {
  const indexRef = useRef<boolean>(false);

  const search = useCallback((query: string): ToolMeta[] => {
    if (!indexRef.current) {
      ensureIndex();
      indexRef.current = true;
    }
    return searchTools(query);
  }, []);

  return { search };
}

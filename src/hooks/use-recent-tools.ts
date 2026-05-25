"use client";

import { useCallback } from "react";
import { useLocalStorage } from "./use-local-storage";

const MAX_RECENT_TOOLS = 10;

/**
 * Hook for tracking recently used tools.
 * Stores up to 10 recent tool slugs in localStorage.
 */
export function useRecentTools() {
  const [recentTools, setRecentTools] = useLocalStorage<string[]>(
    "toolbox-recent-tools",
    []
  );

  const addRecentTool = useCallback((slug: string) => {
    setRecentTools((prev) => {
      const filtered = prev.filter((s) => s !== slug);
      return [slug, ...filtered].slice(0, MAX_RECENT_TOOLS);
    });
  }, [setRecentTools]);

  const clearRecentTools = useCallback(() => {
    setRecentTools([]);
  }, [setRecentTools]);

  return { recentTools, addRecentTool, clearRecentTools };
}

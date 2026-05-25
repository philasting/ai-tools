"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Command } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchTools } from "@/lib/search";
import { getToolBySlug } from "@/tools/registry";
import { getCategoryInfo } from "@/types/tool";
import type { ToolMeta } from "@/types/tool";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function ToolSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ToolMeta[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Search on query change
  useEffect(() => {
    if (query.trim()) {
      const found = searchTools(query);
      setResults(found);
      setOpen(true);
      setSelectedIndex(-1);
    } else {
      setResults([]);
      setOpen(false);
    }
  }, [query]);

  // Keyboard shortcut: Alt+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Keyboard navigation in results
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      const tool = results[selectedIndex];
      if (tool) {
        window.location.href = `/tools/${tool.slug}`;
        setOpen(false);
        setQuery("");
      }
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="搜索工具... (Alt+K)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          onKeyDown={handleKeyDown}
          className="pl-9 pr-12 h-9 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </div>

      {/* Search results dropdown */}
      {open && results.length > 0 && (
        <div
          ref={resultsRef}
          className="absolute top-full mt-1 w-full rounded-xl border border-border bg-popover shadow-lg z-50 overflow-hidden"
        >
          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            {results.map((tool, index) => {
              const catInfo = getCategoryInfo(tool.category);
              return (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                  }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-accent",
                    index === selectedIndex && "bg-accent"
                  )}
                >
                  <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {catInfo.labelZh}
                  </span>
                  <span className="font-medium">{tool.name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {tool.description}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* No results */}
      {open && query.trim() && results.length === 0 && (
        <div className="absolute top-full mt-1 w-full rounded-xl border border-border bg-popover shadow-lg z-50 p-4 text-center text-sm text-muted-foreground">
          未找到匹配的工具
        </div>
      )}
    </div>
  );
}

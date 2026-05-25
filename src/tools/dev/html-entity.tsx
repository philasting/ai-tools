"use client";

import { useState, useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useCopyState } from "@/components/tool/ToolLayout";

/** Named HTML entities map */
const NAMED_ENTITIES: Record<string, string> = {
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  "©": "&copy;", "®": "&reg;", "¥": "&yen;", "€": "&euro;", "£": "&pound;", "¢": "&cent;",
  "§": "&sect;", "¶": "&para;", "°": "&deg;", "±": "&plusmn;", "×": "&times;", "÷": "&divide;",
  "←": "&larr;", "→": "&rarr;", "↑": "&uarr;", "↓": "&darr;",
  "♠": "&spades;", "♣": "&clubs;", "♥": "&hearts;", "♦": "&diams;",
  " ": "&nbsp;", "—": "&mdash;", "–": "&ndash;",
  "«": "&laquo;", "»": "&raquo;", "‹": "&lsaquo;", "›": "&rsaquo;",
  "„": "&bdquo;", "‚": "&sbquo;", "…": "&hellip;", "•": "&bull;",
  "‰": "&permil;",
};

/** Reverse named entities map */
const REVERSE_NAMED: Record<string, string> = {};
for (const [char, entity] of Object.entries(NAMED_ENTITIES)) {
  REVERSE_NAMED[entity] = char;
  // Also map the semicolon-less version for some common ones
  if (entity.endsWith(";")) {
    REVERSE_NAMED[entity.slice(0, -1)] = char;
  }
}

/** Encode HTML entities */
function encodeHtml(text: string, useNamed: boolean): string {
  return text.replace(/[&<>"'©®™¥€£¢§¶°±×÷←→↑↓♠♣♥♦—–«»…•\u00A0]/g, (ch) => {
    if (useNamed && NAMED_ENTITIES[ch]) {
      return NAMED_ENTITIES[ch];
    }
    // Always encode the essential 5
    if (ch === "&") return "&amp;";
    if (ch === "<") return "&lt;";
    if (ch === ">") return "&gt;";
    if (ch === '"') return "&quot;";
    if (ch === "'") return "&#39;";
    // Numeric entity for others
    return `&#${ch.charCodeAt(0)};`;
  });
}

/** Decode HTML entities */
function decodeHtml(text: string): string {
  // Decode named entities
  let result = text.replace(/&[a-zA-Z]+;?/g, (entity) => {
    return REVERSE_NAMED[entity] || entity;
  });
  // Decode numeric entities (decimal)
  result = result.replace(/&#(\d+);?/g, (_, code) => {
    return String.fromCharCode(parseInt(code, 10));
  });
  // Decode numeric entities (hex)
  result = result.replace(/&#x([0-9a-fA-F]+);?/g, (_, code) => {
    return String.fromCharCode(parseInt(code, 16));
  });
  return result;
}

type HtmlEntityMode = "encode" | "decode";

export function HtmlEntityTool() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<HtmlEntityMode>("encode");
  const [useNamed, setUseNamed] = useState(true);
  const { copied, handleCopy } = useCopyState();

  const output = useMemo(() => {
    if (!input) return "";
    if (mode === "encode") return encodeHtml(input, useNamed);
    return decodeHtml(input);
  }, [input, mode, useNamed]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <Label className="text-sm">模式</Label>
          <div className="flex gap-1">
            <Button
              variant={mode === "encode" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("encode")}
            >
              编码
            </Button>
            <Button
              variant={mode === "decode" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("decode")}
            >
              解码
            </Button>
          </div>
        </div>
        {mode === "encode" && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="use-named"
              checked={useNamed}
              onChange={(e) => setUseNamed(e.target.checked)}
              className="rounded border-border"
            />
            <Label htmlFor="use-named" className="text-sm cursor-pointer">
              使用命名实体（&amp;copy; 等）
            </Label>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{mode === "encode" ? "原始文本" : "HTML 实体"}</Label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === "encode" ? "输入需要编码的文本..." : "输入 HTML 实体..."}
            className="min-h-[250px] text-sm font-mono"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{mode === "encode" ? "编码结果" : "解码结果"}</Label>
            <Button variant="ghost" size="sm" onClick={() => handleCopy(output)} disabled={!output}>
              {copied ? "已复制" : "复制"}
            </Button>
          </div>
          <Textarea value={output} readOnly className="min-h-[250px] text-sm font-mono" />
        </div>
      </div>

      {/* Entity reference table */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3">常用 HTML 实体对照表</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-sm">
            {Object.entries(NAMED_ENTITIES).slice(0, 24).map(([char, entity]) => (
              <div key={entity} className="flex items-center gap-2 p-1.5 rounded bg-muted/50">
                <span className="font-mono text-base w-6 text-center">{char === " " ? "␣" : char}</span>
                <span className="font-mono text-xs text-muted-foreground">{entity}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useCopyState } from "@/components/tool/ToolLayout";

type UnicodeMode = "toUnicode" | "toChinese" | "toHex" | "toHtmlEntity";

/** Convert text to \uXXXX Unicode escapes */
function textToUnicode(text: string): string {
  return text
    .split("")
    .map((ch) => {
      const code = ch.charCodeAt(0);
      if (code > 127) {
        return `\\u${code.toString(16).padStart(4, "0")}`;
      }
      return ch;
    })
    .join("");
}

/** Convert \uXXXX escapes back to text */
function unicodeToText(text: string): string {
  return text.replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => {
    return String.fromCharCode(parseInt(code, 16));
  });
}

/** Convert text to hex representation */
function textToHex(text: string): string {
  return text
    .split("")
    .map((ch) => ch.charCodeAt(0).toString(16).padStart(4, "0"))
    .join(" ");
}

/** Convert text to HTML numeric entities */
function textToHtmlEntity(text: string): string {
  return text
    .split("")
    .map((ch) => {
      const code = ch.charCodeAt(0);
      if (code > 127) {
        return `&#${code};`;
      }
      return ch;
    })
    .join("");
}

export function UnicodeConvertTool() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<UnicodeMode>("toUnicode");
  const { copied, handleCopy } = useCopyState();

  const output = useMemo(() => {
    if (!input) return "";
    switch (mode) {
      case "toUnicode": return textToUnicode(input);
      case "toChinese": return unicodeToText(input);
      case "toHex": return textToHex(input);
      case "toHtmlEntity": return textToHtmlEntity(input);
    }
  }, [input, mode]);

  const modeLabels: Record<UnicodeMode, string> = {
    toUnicode: "中文 → \\uXXXX",
    toChinese: "\\uXXXX → 中文",
    toHex: "中文 → Hex",
    toHtmlEntity: "中文 → &#NNN;",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1">
        {(Object.keys(modeLabels) as UnicodeMode[]).map((m) => (
          <Button
            key={m}
            variant={mode === m ? "default" : "outline"}
            size="sm"
            onClick={() => setMode(m)}
          >
            {modeLabels[m]}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>输入</Label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === "toChinese"
                ? "输入 \\uXXXX 编码..."
                : "输入中文文本..."
            }
            className="min-h-[200px] text-sm font-mono"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>输出</Label>
            <Button variant="ghost" size="sm" onClick={() => handleCopy(output)} disabled={!output}>
              {copied ? "已复制" : "复制"}
            </Button>
          </div>
          <Textarea value={output} readOnly className="min-h-[200px] text-sm font-mono" />
        </div>
      </div>
    </div>
  );
}

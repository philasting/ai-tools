"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Copy, Check } from "lucide-react";
import { copyToClipboard } from "@/components/tool/ToolLayout";

type CaseType = "upper" | "lower" | "title" | "camel" | "pascal" | "snake" | "kebab" | "constant";

const CASE_OPTIONS: { value: CaseType; label: string; example: string }[] = [
  { value: "upper", label: "UPPERCASE", example: "HELLO WORLD" },
  { value: "lower", label: "lowercase", example: "hello world" },
  { value: "title", label: "Title Case", example: "Hello World" },
  { value: "camel", label: "camelCase", example: "helloWorld" },
  { value: "pascal", label: "PascalCase", example: "HelloWorld" },
  { value: "snake", label: "snake_case", example: "hello_world" },
  { value: "kebab", label: "kebab-case", example: "hello-world" },
  { value: "constant", label: "CONSTANT_CASE", example: "HELLO_WORLD" },
];

function toWords(text: string): string[] {
  return text
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/[_\-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function convertCase(text: string, caseType: CaseType): string {
  const words = toWords(text);
  if (words.length === 0) return "";
  switch (caseType) {
    case "upper": return text.toUpperCase();
    case "lower": return text.toLowerCase();
    case "title": return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
    case "camel": return words.map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join("");
    case "pascal": return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join("");
    case "snake": return words.map((w) => w.toLowerCase()).join("_");
    case "kebab": return words.map((w) => w.toLowerCase()).join("-");
    case "constant": return words.map((w) => w.toUpperCase()).join("_");
    default: return text;
  }
}

export function CaseConverterTool() {
  const [input, setInput] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = async (text: string, key: string) => {
    await copyToClipboard(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>输入文本</Label>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入要转换大小写的文本..."
          className="min-h-[100px] text-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {CASE_OPTIONS.map((option) => {
          const result = input ? convertCase(input, option.value) : "";
          return (
            <Card key={option.value} className="overflow-hidden">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-muted-foreground">{option.label}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleCopy(result, option.value)}
                    disabled={!result}
                  >
                    {copiedKey === option.value ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
                <p className="text-sm font-mono break-all min-h-[1.5em]">
                  {result || <span className="text-muted-foreground italic">{option.example}</span>}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, Check } from "lucide-react";
import { copyToClipboard } from "@/components/tool/ToolLayout";

const REGEX_LIBRARY = [
  { name: "邮箱", pattern: "[\\w.-]+@[\\w.-]+\\.\\w+" },
  { name: "手机号(中国)", pattern: "1[3-9]\\d{9}" },
  { name: "URL", pattern: "https?://[\\w\\-]+(\\.[\\w\\-]+)+[/#?]?.*?" },
  { name: "IP 地址", pattern: "\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}" },
  { name: "日期(yyyy-mm-dd)", pattern: "\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])" },
  { name: "中文", pattern: "[\\u4e00-\\u9fa5]+" },
  { name: "身份证", pattern: "\\d{17}[\\dXx]" },
  { name: "HTML 标签", pattern: "<[^>]+>" },
  { name: "整数", pattern: "-?\\d+" },
  { name: "浮点数", pattern: "-?\\d+\\.\\d+" },
];

export function RegexTesterTool() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("g");
  const [testString, setTestString] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const matches = useMemo(() => {
    if (!pattern || !testString) return { result: [], error: "" };
    try {
      const regex = new RegExp(pattern, flags);
      const result: RegExpMatchArray[] = [];
      let match: RegExpMatchArray | null;

      if (flags.includes("g")) {
        while ((match = regex.exec(testString)) !== null) {
          result.push(match);
          if (match[0] === "") regex.lastIndex++;
        }
      } else {
        match = regex.exec(testString);
        if (match) result.push(match);
      }

      return { result, error: "" };
    } catch (e) {
      return { result: [], error: (e as Error).message };
    }
  }, [pattern, flags, testString]);

  const highlightParts = useMemo(() => {
    if (!pattern || !testString || matches.error) return null;
    const parts: { text: string; isMatch: boolean }[] = [];
    let lastIndex = 0;

    for (const match of matches.result) {
      const idx = match.index ?? 0;
      if (idx > lastIndex) {
        parts.push({ text: testString.slice(lastIndex, idx), isMatch: false });
      }
      parts.push({ text: match[0], isMatch: true });
      lastIndex = idx + match[0].length;
    }

    if (lastIndex < testString.length) {
      parts.push({ text: testString.slice(lastIndex), isMatch: false });
    }

    return parts;
  }, [pattern, testString, matches]);

  const handleCopy = async (text: string, key: string) => {
    await copyToClipboard(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>正则表达式</Label>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-1">
            <span className="text-muted-foreground font-mono text-lg">/</span>
            <Input
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="输入正则表达式..."
              className="font-mono flex-1"
            />
            <span className="text-muted-foreground font-mono text-lg">/</span>
            <Input
              value={flags}
              onChange={(e) => setFlags(e.target.value)}
              className="w-20 font-mono"
              placeholder="gim"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm">常用正则</Label>
        <div className="flex gap-2 flex-wrap">
          {REGEX_LIBRARY.map((item) => (
            <Badge
              key={item.name}
              variant="secondary"
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => setPattern(item.pattern)}
            >
              {item.name}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>测试文本</Label>
        <Textarea
          value={testString}
          onChange={(e) => setTestString(e.target.value)}
          placeholder="输入要测试的文本..."
          className="min-h-[120px] font-mono text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label>匹配结果</Label>
        {matches.error ? (
          <Card>
            <CardContent className="p-3">
              <p className="text-destructive text-sm">{matches.error}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="p-3">
                <div className="text-sm font-mono whitespace-pre-wrap break-all">
                  {highlightParts ? (
                    highlightParts.map((part, i) =>
                      part.isMatch ? (
                        <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">
                          {part.text}
                        </mark>
                      ) : (
                        <span key={i}>{part.text}</span>
                      )
                    )
                  ) : (
                    <span>{testString}</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {matches.result.length > 0 && (
              <Card>
                <CardContent className="p-3 space-y-1">
                  <p className="text-sm font-medium mb-2">共 {matches.result.length} 个匹配</p>
                  {matches.result.map((match, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-mono">
                      <Badge variant="outline" className="shrink-0">#{i + 1}</Badge>
                      <span className="truncate">{match[0]}</span>
                      <span className="text-muted-foreground shrink-0">@ {match.index}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => handleCopy(match[0], `match-${i}`)}
                      >
                        {copiedKey === `match-${i}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {matches.result.length === 0 && pattern && testString && (
              <p className="text-sm text-muted-foreground">没有匹配结果</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

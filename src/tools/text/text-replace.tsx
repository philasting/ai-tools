"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Replace } from "lucide-react";
import { useCopyState } from "@/components/tool/ToolLayout";

export function TextReplaceTool() {
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [replace, setReplace] = useState("");
  const [useRegex, setUseRegex] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(true);
  const [result, setResult] = useState("");
  const [matchCount, setMatchCount] = useState(0);
  const { copied, handleCopy } = useCopyState();

  const doReplace = (all: boolean) => {
    if (!search) return;
    try {
      let count = 0;
      let newResult: string;

      if (useRegex) {
        const flags = `g${caseSensitive ? "" : "i"}`;
        const regex = new RegExp(search, flags);
        if (all) {
          newResult = text.replace(regex, (match) => {
            count++;
            return replace.replace(/\$&/g, match);
          });
        } else {
          let replaced = false;
          newResult = text.replace(regex, (match) => {
            if (!replaced) {
              replaced = true;
              count++;
              return replace.replace(/\$&/g, match);
            }
            return match;
          });
        }
      } else {
        const flags = caseSensitive ? "" : "i";
        if (all) {
          if (caseSensitive) {
            const parts = text.split(search);
            count = parts.length - 1;
            newResult = parts.join(replace);
          } else {
            const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
            newResult = text.replace(regex, () => {
              count++;
              return replace;
            });
          }
        } else {
          if (caseSensitive) {
            const index = text.indexOf(search);
            if (index !== -1) {
              newResult = text.slice(0, index) + replace + text.slice(index + search.length);
              count = 1;
            } else {
              newResult = text;
            }
          } else {
            const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
            let replaced = false;
            newResult = text.replace(regex, (match) => {
              if (!replaced) {
                replaced = true;
                count++;
                return replace;
              }
              return match;
            });
          }
        }
      }

      setResult(newResult);
      setMatchCount(count);
    } catch (e) {
      setResult(`正则表达式错误: ${(e as Error).message}`);
      setMatchCount(0);
    }
  };

  const replaceAll = () => doReplace(true);
  const replaceOne = () => doReplace(false);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>输入文本</Label>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="输入要替换的文本..."
          className="min-h-[150px] text-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>查找</Label>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="查找内容..." className="font-mono" />
        </div>
        <div className="space-y-2">
          <Label>替换为</Label>
          <Input value={replace} onChange={(e) => setReplace(e.target.value)} placeholder="替换内容..." className="font-mono" />
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Switch id="use-regex" checked={useRegex} onCheckedChange={setUseRegex} />
          <Label htmlFor="use-regex" className="text-sm">正则模式</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="case-sensitive" checked={caseSensitive} onCheckedChange={setCaseSensitive} />
          <Label htmlFor="case-sensitive" className="text-sm">区分大小写</Label>
        </div>
        <Button onClick={replaceOne} size="sm" variant="outline" disabled={!search}>
          替换下一个
        </Button>
        <Button onClick={replaceAll} size="sm" disabled={!search}>
          <Replace className="h-4 w-4 mr-1" /> 全部替换
        </Button>
      </div>

      {result && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label>替换结果</Label>
              {matchCount > 0 && (
                <Badge variant="secondary">{matchCount} 处替换</Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => handleCopy(result)}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "已复制" : "复制"}
            </Button>
          </div>
          <Textarea value={result} readOnly className="min-h-[150px] text-sm" />
        </div>
      )}
    </div>
  );
}

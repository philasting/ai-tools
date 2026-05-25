"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Check, ListFilter } from "lucide-react";
import { useCopyState } from "@/components/tool/ToolLayout";

type SortOption = "none" | "asc" | "desc" | "length-asc" | "length-desc";

export function TextDedupTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [trimLines, setTrimLines] = useState(true);
  const [removeEmpty, setRemoveEmpty] = useState(true);
  const [sortOption, setSortOption] = useState<SortOption>("none");
  const { copied, handleCopy } = useCopyState();

  const stats = useMemo(() => {
    const lines = input.split("\n");
    const inputCount = lines.length;
    const processed = processLines(lines);
    const outputCount = processed.length;
    return { inputCount, outputCount, removed: inputCount - outputCount };
  }, [input, ignoreCase, trimLines, removeEmpty, sortOption]);

  function processLines(lines: string[]): string[] {
    let processed = [...lines];
    if (trimLines) processed = processed.map((l) => l.trim());
    if (removeEmpty) processed = processed.filter((l) => l.length > 0);

    const seen = new Set<string>();
    const result: string[] = [];
    for (const line of processed) {
      const key = ignoreCase ? line.toLowerCase() : line;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(line);
      }
    }

    switch (sortOption) {
      case "asc": result.sort((a, b) => a.localeCompare(b, "zh-CN")); break;
      case "desc": result.sort((a, b) => b.localeCompare(a, "zh-CN")); break;
      case "length-asc": result.sort((a, b) => a.length - b.length); break;
      case "length-desc": result.sort((a, b) => b.length - a.length); break;
    }

    return result;
  }

  const handleDedup = () => {
    const lines = input.split("\n");
    setOutput(processLines(lines).join("\n"));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Switch id="ignore-case" checked={ignoreCase} onCheckedChange={setIgnoreCase} />
          <Label htmlFor="ignore-case" className="text-sm">忽略大小写</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="trim-lines" checked={trimLines} onCheckedChange={setTrimLines} />
          <Label htmlFor="trim-lines" className="text-sm">去除首尾空格</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="remove-empty" checked={removeEmpty} onCheckedChange={setRemoveEmpty} />
          <Label htmlFor="remove-empty" className="text-sm">移除空行</Label>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm shrink-0">排序</Label>
          <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
            <SelectTrigger className="w-36 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">不排序</SelectItem>
              <SelectItem value="asc">升序 (A→Z)</SelectItem>
              <SelectItem value="desc">降序 (Z→A)</SelectItem>
              <SelectItem value="length-asc">长度升序</SelectItem>
              <SelectItem value="length-desc">长度降序</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>输入文本（每行一条）</Label>
            <span className="text-xs text-muted-foreground">{stats.inputCount} 行</span>
          </div>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="每行一条文本，重复的行将被去除..."
            className="min-h-[200px] text-sm"
          />
          <Button onClick={handleDedup} size="sm">
            <ListFilter className="h-4 w-4 mr-1" /> 去重
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label>输出</Label>
              <span className="text-xs text-muted-foreground">
                {stats.outputCount} 行 (去除 {stats.removed} 行)
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => handleCopy(output)} disabled={!output}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "已复制" : "复制"}
            </Button>
          </div>
          <Textarea value={output} readOnly placeholder="去重结果将显示在这里..." className="min-h-[200px] text-sm" />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Check, ArrowRightLeft } from "lucide-react";
import { copyToClipboard } from "@/components/tool/ToolLayout";

type Base = 2 | 8 | 10 | 16 | 32 | 36;

const BASE_OPTIONS: { value: Base; label: string }[] = [
  { value: 2, label: "二进制 (Base 2)" },
  { value: 8, label: "八进制 (Base 8)" },
  { value: 10, label: "十进制 (Base 10)" },
  { value: 16, label: "十六进制 (Base 16)" },
  { value: 32, label: "Base32" },
  { value: 36, label: "Base36" },
];

function convertBase(value: string, fromBase: Base, toBase: Base): string {
  if (!value.trim()) return "";
  try {
    const decimal = parseInt(value, fromBase);
    if (isNaN(decimal)) return "无效输入";
    return decimal.toString(toBase).toUpperCase();
  } catch {
    return "转换失败";
  }
}

export function RadixConverterTool() {
  const [inputValue, setInputValue] = useState("");
  const [fromBase, setFromBase] = useState<Base>(10);
  const [toBase, setToBase] = useState<Base>(16);
  const [customBase, setCustomBase] = useState(10);
  const [useCustom, setUseCustom] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const result = useCustom
    ? convertBase(inputValue, fromBase, customBase as Base)
    : convertBase(inputValue, fromBase, toBase);

  const allResults = BASE_OPTIONS.map((opt) => ({
    base: opt.value,
    label: opt.label,
    value: convertBase(inputValue, fromBase, opt.value),
  }));

  const handleCopy = async (text: string, key: string) => {
    await copyToClipboard(text);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const swapBases = () => {
    setFromBase(toBase);
    setToBase(fromBase);
    setInputValue(result !== "无效输入" && result !== "转换失败" && result ? result : inputValue);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-start">
        <div className="space-y-2">
          <Label>输入值</Label>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="输入数值..."
            className="font-mono"
          />
          <Label className="text-xs">源进制</Label>
          <Select value={String(fromBase)} onValueChange={(v) => setFromBase(Number(v) as Base)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {BASE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center pt-8">
          <Button variant="ghost" size="icon" onClick={swapBases}>
            <ArrowRightLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <Label>转换结果</Label>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm font-mono bg-muted px-3 py-2 rounded-md break-all min-h-[2.5em]">
              {result || "—"}
            </code>
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => handleCopy(result, "main")}>
              {copiedField === "main" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <Label className="text-xs">目标进制</Label>
          <Select value={String(toBase)} onValueChange={(v) => setToBase(Number(v) as Base)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {BASE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* All bases at once */}
      {inputValue && (
        <div className="space-y-2">
          <Label>全部进制结果</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {allResults.map((item) => (
              <Card key={item.base}>
                <CardContent className="p-3 flex items-center gap-2">
                  <span className="text-xs font-semibold w-28 shrink-0">{item.label}</span>
                  <code className="flex-1 text-xs font-mono break-all text-muted-foreground">{item.value}</code>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleCopy(item.value, `base-${item.base}`)}>
                    {copiedField === `base-${item.base}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

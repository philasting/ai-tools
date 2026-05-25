"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useCopyState } from "@/components/tool/ToolLayout";

/** Chinese uppercase digits */
const DIGITS = ["零", "壹", "贰", "叁", "肆", "伍", "陆", "柒", "捌", "玖"];
const UNITS = ["", "拾", "佰", "仟"];
const BIG_UNITS = ["", "万", "亿", "万亿"];

/** Convert a number 0-9999 to Chinese uppercase */
function segmentToChinese(num: number): string {
  if (num === 0) return "";

  const digits = num.toString().padStart(4, "0").split("").map(Number);
  let result = "";
  let hasZero = false;

  for (let i = 0; i < 4; i++) {
    const d = digits[i];
    const unitIdx = 3 - i;

    if (d === 0) {
      hasZero = true;
    } else {
      if (hasZero && result.length > 0) {
        result += "零";
      }
      hasZero = false;
      result += DIGITS[d] + UNITS[unitIdx];
    }
  }

  return result;
}

/** Convert number to Chinese RMB uppercase */
function numberToRmb(n: number): string {
  if (n === 0) return "零元整";

  const isNegative = n < 0;
  const abs = Math.abs(n);

  // Split into integer and decimal parts
  const rounded = Math.round(abs * 100) / 100;
  const intPart = Math.floor(rounded);
  const decimalPart = Math.round((rounded - intPart) * 100);

  let result = "";

  // Process integer part
  if (intPart > 0) {
    // Split into groups of 4 digits
    const groups: number[] = [];
    let remaining = intPart;
    while (remaining > 0) {
      groups.push(remaining % 10000);
      remaining = Math.floor(remaining / 10000);
    }

    const segments: string[] = [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const seg = segmentToChinese(groups[i]);
      if (seg) {
        segments.push(seg + BIG_UNITS[i]);
      }
    }

    result = segments.join("") + "元";
  }

  // Process decimal part (jiao and fen)
  const jiao = Math.floor(decimalPart / 10);
  const fen = decimalPart % 10;

  if (jiao > 0) {
    result += DIGITS[jiao] + "角";
  } else if (intPart > 0 && fen > 0) {
    result += "零";
  }

  if (fen > 0) {
    result += DIGITS[fen] + "分";
  } else {
    result += "整";
  }

  if (isNegative) result = "负" + result;
  return result;
}

export function RmbUppercaseTool() {
  const [input, setInput] = useState("");
  const { copied, handleCopy } = useCopyState();

  const result = useMemo(() => {
    const num = parseFloat(input);
    if (isNaN(num) || input.trim() === "") return "";
    if (num > 999999999999999) return "金额超出转换范围";
    return numberToRmb(num);
  }, [input]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>输入金额</Label>
        <Input
          type="number"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入金额数字，如 1234.56"
          className="font-mono text-lg h-12"
          step="0.01"
          min="0"
        />
      </div>

      {result && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label>大写金额</Label>
              <Button variant="ghost" size="sm" onClick={() => handleCopy(result)}>
                {copied ? "已复制" : "复制"}
              </Button>
            </div>
            <div className="text-2xl font-bold tracking-wider p-4 bg-muted rounded-lg text-center">
              {result}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4 text-xs text-muted-foreground space-y-1">
          <p>• 数字金额转中文大写（壹贰叁肆伍陆柒捌玖）</p>
          <p>• 支持小数点后两位（角、分）</p>
          <p>• 自动添加"元整"、"角"、"分"等单位</p>
          <p>• 支持负数</p>
          <p>• 常用于财务报销、合同金额填写</p>
        </CardContent>
      </Card>

      {/* Quick examples */}
      <Card>
        <CardContent className="p-4">
          <Label className="text-sm mb-2 block">常用示例</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
            {[
              { num: "100", label: "100" },
              { num: "1234.56", label: "1234.56" },
              { num: "10000", label: "10000" },
              { num: "100500.80", label: "100500.80" },
              { num: "3000000", label: "3000000" },
              { num: "0.52", label: "0.52" },
            ].map(({ num, label }) => (
              <button
                key={num}
                onClick={() => setInput(num)}
                className="p-2 rounded bg-muted/50 hover:bg-muted text-left font-mono"
              >
                {label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

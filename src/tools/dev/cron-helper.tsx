"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Copy, Check } from "lucide-react";
import { copyToClipboard } from "@/components/tool/ToolLayout";

type CronField = "minute" | "hour" | "dayOfMonth" | "month" | "dayOfWeek";

const FIELD_LABELS: Record<CronField, { label: string; min: number; max: number }> = {
  minute: { label: "分", min: 0, max: 59 },
  hour: { label: "时", min: 0, max: 23 },
  dayOfMonth: { label: "日", min: 1, max: 31 },
  month: { label: "月", min: 1, max: 12 },
  dayOfWeek: { label: "周", min: 0, max: 6 },
};

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

const COMMON_EXPRESSIONS = [
  { name: "每分钟", expression: "* * * * *" },
  { name: "每小时", expression: "0 * * * *" },
  { name: "每天零点", expression: "0 0 * * *" },
  { name: "每周一零点", expression: "0 0 * * 1" },
  { name: "每月1号零点", expression: "0 0 1 * *" },
  { name: "工作日9点", expression: "0 9 * * 1-5" },
  { name: "每5分钟", expression: "*/5 * * * *" },
  { name: "每30分钟", expression: "*/30 * * * *" },
  { name: "每6小时", expression: "0 */6 * * *" },
  { name: "每天8:30", expression: "30 8 * * *" },
];

function getNextExecutions(expression: string, count: number = 5): Date[] {
  try {
    const parts = expression.trim().split(/\s+/);
    if (parts.length !== 5) return [];

    const parsed = parts.map((p) => {
      if (p === "*") return null;
      if (p.startsWith("*/")) {
        const step = parseInt(p.slice(2));
        return { step };
      }
      if (p.includes(",")) {
        return { values: p.split(",").map(Number) };
      }
      if (p.includes("-")) {
        const [start, end] = p.split("-").map(Number);
        const values: number[] = [];
        for (let i = start; i <= end; i++) values.push(i);
        return { values };
      }
      return { values: [parseInt(p)] };
    });

    const matches = (field: CronField, value: number): boolean => {
      const p = parsed[["minute", "hour", "dayOfMonth", "month", "dayOfWeek"].indexOf(field)];
      if (!p) return true;
      if ("step" in p) return value % p.step! === 0;
      return p.values!.includes(value);
    };

    const results: Date[] = [];
    const now = new Date();
    let current = new Date(now.getTime() + 60000);
    current.setSeconds(0, 0);

    const maxIterations = 100000;
    let iterations = 0;

    while (results.length < count && iterations < maxIterations) {
      iterations++;
      if (
        matches("minute", current.getMinutes()) &&
        matches("hour", current.getHours()) &&
        matches("dayOfMonth", current.getDate()) &&
        matches("month", current.getMonth() + 1) &&
        matches("dayOfWeek", current.getDay())
      ) {
        results.push(new Date(current.getTime()));
      }
      current = new Date(current.getTime() + 60000);
    }

    return results;
  } catch {
    return [];
  }
}

export function CronHelperTool() {
  const [fields, setFields] = useState<Record<CronField, string>>({
    minute: "*",
    hour: "*",
    dayOfMonth: "*",
    month: "*",
    dayOfWeek: "*",
  });

  const expression = useMemo(() => `${fields.minute} ${fields.hour} ${fields.dayOfMonth} ${fields.month} ${fields.dayOfWeek}`, [fields]);

  const nextExecutions = useMemo(() => getNextExecutions(expression), [expression]);

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = async (text: string, key: string) => {
    await copyToClipboard(text);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const updateField = (field: CronField, value: string) => {
    setFields((prev) => ({ ...prev, [field]: value }));
  };

  const applyTemplate = (expr: string) => {
    const parts = expr.split(/\s+/);
    const fieldKeys: CronField[] = ["minute", "hour", "dayOfMonth", "month", "dayOfWeek"];
    const newFields = { ...fields };
    parts.forEach((p, i) => {
      if (i < 5) newFields[fieldKeys[i]] = p;
    });
    setFields(newFields);
  };

  return (
    <div className="space-y-4">
      {/* Expression display */}
      <Card>
        <CardContent className="p-3 flex items-center gap-3">
          <code className="flex-1 text-lg font-mono font-bold text-primary">{expression}</code>
          <Button variant="ghost" size="sm" onClick={() => handleCopy(expression, "expr")}>
            {copiedField === "expr" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </CardContent>
      </Card>

      {/* Field editors */}
      <div className="space-y-2">
        {(Object.keys(FIELD_LABELS) as CronField[]).map((field) => (
          <div key={field} className="flex items-center gap-2">
            <Label className="w-8 text-sm shrink-0">{FIELD_LABELS[field].label}</Label>
            <Input
              value={fields[field]}
              onChange={(e) => updateField(field, e.target.value)}
              placeholder="*"
              className="font-mono flex-1 h-8"
            />
            <span className="text-xs text-muted-foreground">
              ({FIELD_LABELS[field].min}-{FIELD_LABELS[field].max})
            </span>
          </div>
        ))}
      </div>

      <Separator />

      {/* Common expressions */}
      <div className="space-y-2">
        <Label className="text-sm">常用表达式</Label>
        <div className="flex gap-2 flex-wrap">
          {COMMON_EXPRESSIONS.map((item) => (
            <Badge
              key={item.name}
              variant="secondary"
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => applyTemplate(item.expression)}
            >
              {item.name}
            </Badge>
          ))}
        </div>
      </div>

      <Separator />

      {/* Next executions */}
      <div className="space-y-2">
        <Label className="text-sm">下次执行时间</Label>
        {nextExecutions.length > 0 ? (
          <div className="space-y-1">
            {nextExecutions.map((date, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="text-xs text-muted-foreground w-8">#{i + 1}</span>
                <code className="font-mono">{date.toLocaleString("zh-CN")}</code>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">无法计算执行时间（请检查表达式格式）</p>
        )}
      </div>
    </div>
  );
}

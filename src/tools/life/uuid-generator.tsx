"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Copy, Check, RefreshCw } from "lucide-react";
import { copyToClipboard } from "@/components/tool/ToolLayout";

function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback UUID v4
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function UuidGeneratorTool() {
  const [uuids, setUuids] = useState<string[]>([]);
  const [count, setCount] = useState(5);
  const [uppercase, setUppercase] = useState(false);
  const [noDashes, setNoDashes] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const generate = useCallback(() => {
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      let uuid = generateUUID();
      if (uppercase) uuid = uuid.toUpperCase();
      if (noDashes) uuid = uuid.replace(/-/g, "");
      result.push(uuid);
    }
    setUuids(result);
  }, [count, uppercase, noDashes]);

  const handleCopy = async (text: string, key: string) => {
    await copyToClipboard(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const copyAll = async () => {
    await copyToClipboard(uuids.join("\n"));
    setCopiedKey("all");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <Label className="text-sm">数量</Label>
          <Input
            type="number"
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(100, Number(e.target.value))))}
            min={1}
            max={100}
            className="w-24 h-8"
          />
        </div>
        <div className="flex items-center gap-2 pb-1">
          <input
            type="checkbox"
            id="uppercase"
            checked={uppercase}
            onChange={(e) => setUppercase(e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="uppercase" className="text-sm">大写</Label>
        </div>
        <div className="flex items-center gap-2 pb-1">
          <input
            type="checkbox"
            id="no-dashes"
            checked={noDashes}
            onChange={(e) => setNoDashes(e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="no-dashes" className="text-sm">无连字符</Label>
        </div>
      </div>

      <Button onClick={generate} size="lg" className="w-full">
        <RefreshCw className="h-4 w-4 mr-2" /> 生成 UUID
      </Button>

      {uuids.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={copyAll}>
              {copiedKey === "all" ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
              {copiedKey === "all" ? "已复制全部" : "复制全部"}
            </Button>
          </div>

          <div className="space-y-2">
            {uuids.map((uuid, i) => (
              <Card key={i}>
                <CardContent className="p-3 flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-6 shrink-0">#{i + 1}</span>
                  <code className="flex-1 text-sm font-mono break-all select-all">{uuid}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => handleCopy(uuid, `uuid-${i}`)}
                  >
                    {copiedKey === `uuid-${i}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
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

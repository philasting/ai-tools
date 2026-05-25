"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Copy, Check, RefreshCw, ArrowRightLeft } from "lucide-react";
import { copyToClipboard } from "@/components/tool/ToolLayout";

export function TimestampTool() {
  const [timestampInput, setTimestampInput] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [useMillis, setUseMillis] = useState(false);
  const [currentTimestamp, setCurrentTimestamp] = useState(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      const now = Date.now();
      setCurrentTimestamp(now);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const convertToDate = () => {
    const ts = Number(timestampInput);
    if (isNaN(ts)) return;
    const ms = useMillis ? ts : ts * 1000;
    setDateInput(new Date(ms).toLocaleString("zh-CN"));
  };

  const convertToTimestamp = () => {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return;
    const ts = useMillis ? date.getTime() : Math.floor(date.getTime() / 1000);
    setTimestampInput(String(ts));
  };

  const handleCopy = async (value: string, key: string) => {
    await copyToClipboard(value);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const setCurrentAsInput = () => {
    const ts = useMillis ? currentTimestamp : Math.floor(currentTimestamp / 1000);
    setTimestampInput(String(ts));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm text-muted-foreground">当前时间</p>
            <p className="text-lg font-mono font-semibold">{new Date(currentTimestamp).toLocaleString("zh-CN")}</p>
          </div>
          <div className="flex items-center gap-2">
            <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
              {useMillis ? currentTimestamp : Math.floor(currentTimestamp / 1000)}
            </code>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleCopy(
                String(useMillis ? currentTimestamp : Math.floor(currentTimestamp / 1000)),
                "current"
              )}
            >
              {copiedField === "current" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Switch id="use-millis" checked={useMillis} onCheckedChange={setUseMillis} />
        <Label htmlFor="use-millis" className="text-sm">使用毫秒 (默认为秒)</Label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-start">
        <div className="space-y-2">
          <Label>Unix 时间戳</Label>
          <div className="flex gap-2">
            <Input
              value={timestampInput}
              onChange={(e) => setTimestampInput(e.target.value)}
              placeholder="1700000000"
              className="font-mono"
              type="text"
            />
            <Button variant="outline" size="icon" onClick={setCurrentAsInput} title="使用当前时间戳">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={convertToDate} size="sm" className="w-full">
            <ArrowRightLeft className="h-4 w-4 mr-1" /> 转换为日期
          </Button>
        </div>

        <div className="hidden lg:flex items-center pt-8">
          <ArrowRightLeft className="h-5 w-5 text-muted-foreground rotate-90 lg:rotate-0" />
        </div>

        <div className="space-y-2">
          <Label>可读日期时间</Label>
          <Input
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            placeholder="2024/1/1 00:00:00"
            className="font-mono"
            type="text"
          />
          <Button onClick={convertToTimestamp} size="sm" variant="secondary" className="w-full">
            <ArrowRightLeft className="h-4 w-4 mr-1 rotate-180" /> 转换为时间戳
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRightLeft, Copy, Check } from "lucide-react";
import { useCopyState } from "@/components/tool/ToolLayout";

export function UrlEncodeTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const { copied, handleCopy } = useCopyState();

  const encode = () => {
    try {
      setOutput(encodeURIComponent(input));
      setError("");
    } catch (e) {
      setError((e as Error).message);
      setOutput("");
    }
  };

  const decode = () => {
    try {
      setOutput(decodeURIComponent(input));
      setError("");
    } catch {
      setError("无效的 URL 编码");
      setOutput("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">输入文本</label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入要编码或解码的 URL 文本..."
            className="min-h-[200px] font-mono text-sm"
          />
          <div className="flex gap-2 flex-wrap">
            <Button onClick={encode} size="sm">
              <ArrowRightLeft className="h-4 w-4 mr-1" /> 编码
            </Button>
            <Button onClick={decode} variant="secondary" size="sm">
              <ArrowRightLeft className="h-4 w-4 mr-1 rotate-180" /> 解码
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">输出</label>
            <Button variant="ghost" size="sm" onClick={() => handleCopy(output)} disabled={!output}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "已复制" : "复制"}
            </Button>
          </div>
          <Card>
            <CardContent className="p-3">
              {error ? (
                <p className="text-destructive text-sm">{error}</p>
              ) : (
                <pre className="text-sm font-mono whitespace-pre-wrap break-all max-h-[200px] overflow-auto custom-scrollbar">
                  {output || "结果将显示在这里"}
                </pre>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

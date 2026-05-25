"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Wand2, Minimize2, CheckCircle, TreePine } from "lucide-react";
import { useCopyState, copyToClipboard } from "@/components/tool/ToolLayout";

export function JsonFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<"formatted" | "tree">("formatted");
  const { copied, handleCopy } = useCopyState();

  const formatJson = () => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, 2));
      setError("");
    } catch (e) {
      setError((e as Error).message);
      setOutput("");
    }
  };

  const minifyJson = () => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setError("");
    } catch (e) {
      setError((e as Error).message);
      setOutput("");
    }
  };

  const validateJson = () => {
    try {
      JSON.parse(input);
      setError("");
      setOutput("✅ JSON 格式正确");
    } catch (e) {
      setError((e as Error).message);
      setOutput("");
    }
  };

  const onCopyOutput = () => {
    if (!output || output.startsWith("✅")) return;
    handleCopy(output);
  };

  const parsedForTree = useMemo(() => {
    try {
      return JSON.parse(input);
    } catch {
      return null;
    }
  }, [input]);

  const renderTree = (data: unknown, key?: string, depth = 0): React.ReactNode => {
    if (data === null) return <span className="text-orange-500">null</span>;
    if (typeof data === "boolean") return <span className="text-purple-500">{String(data)}</span>;
    if (typeof data === "number") return <span className="text-blue-500">{data}</span>;
    if (typeof data === "string") return <span className="text-green-600 dark:text-green-400">&quot;{data}&quot;</span>;

    const isArray = Array.isArray(data);
    const entries = isArray ? data.map((v, i) => [i, v] as const) : Object.entries(data as Record<string, unknown>);
    const isEmpty = entries.length === 0;

    return (
      <div style={{ marginLeft: depth > 0 ? "1.5rem" : 0 }}>
        {key !== undefined && (
          <span className="text-muted-foreground mr-1">
            {isArray ? "" : `${key}: `}
          </span>
        )}
        <span className="text-muted-foreground">{isArray ? "[" : "{"}</span>
        {isEmpty ? (
          <span className="text-muted-foreground">{isArray ? "]" : "}"}</span>
        ) : (
          <>
            {entries.map(([k, v], i) => (
              <div key={String(k)} className="py-0.5">
                {renderTree(v, typeof k === "number" ? undefined : String(k), depth + 1)}
                {i < entries.length - 1 && <span className="text-muted-foreground">,</span>}
              </div>
            ))}
            <span className="text-muted-foreground">{isArray ? "]" : "}"}</span>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">输入 JSON</label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"key": "value", "array": [1, 2, 3]}'
            className="min-h-[300px] font-mono text-sm"
          />
          <div className="flex gap-2 flex-wrap">
            <Button onClick={formatJson} size="sm">
              <Wand2 className="h-4 w-4 mr-1" /> 格式化
            </Button>
            <Button onClick={minifyJson} variant="secondary" size="sm">
              <Minimize2 className="h-4 w-4 mr-1" /> 压缩
            </Button>
            <Button onClick={validateJson} variant="outline" size="sm">
              <CheckCircle className="h-4 w-4 mr-1" /> 校验
            </Button>
          </div>
        </div>

        {/* Output */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">输出</label>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCopyOutput}
              disabled={!output || output.startsWith("✅")}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "已复制" : "复制"}
            </Button>
          </div>

          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "formatted" | "tree")}>
            <TabsList className="mb-2">
              <TabsTrigger value="formatted">格式化</TabsTrigger>
              <TabsTrigger value="tree">
                <TreePine className="h-3.5 w-3.5 mr-1" /> 树形
              </TabsTrigger>
            </TabsList>

            <TabsContent value="formatted" className="mt-0">
              <Card>
                <CardContent className="p-3">
                  {error ? (
                    <div className="text-destructive text-sm">
                      <Badge variant="destructive" className="mb-2">解析错误</Badge>
                      <pre className="whitespace-pre-wrap break-all">{error}</pre>
                    </div>
                  ) : (
                    <pre className="text-sm font-mono whitespace-pre-wrap break-all max-h-[300px] overflow-auto custom-scrollbar">
                      {output || "点击格式化按钮查看结果"}
                    </pre>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tree" className="mt-0">
              <Card>
                <CardContent className="p-3">
                  {parsedForTree ? (
                    <div className="text-sm font-mono max-h-[300px] overflow-auto custom-scrollbar">
                      {renderTree(parsedForTree)}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">请输入有效的 JSON 以查看树形视图</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

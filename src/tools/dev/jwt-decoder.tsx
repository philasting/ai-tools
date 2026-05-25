"use client";

import { useState, useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { copyToClipboard } from "@/components/tool/ToolLayout";

interface JwtParts {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  isExpired: boolean;
  expiresAt: string | null;
  issuedAt: string | null;
}

function decodeJwt(token: string): JwtParts | null {
  const parts = token.trim().split(".");
  if (parts.length !== 3) return null;

  try {
    const decodeB64 = (str: string) => {
      let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
      const pad = base64.length % 4;
      if (pad) base64 += "=".repeat(4 - pad);
      return JSON.parse(atob(base64));
    };

    const header = decodeB64(parts[0]);
    const payload = decodeB64(parts[1]);

    let isExpired = false;
    let expiresAt: string | null = null;
    let issuedAt: string | null = null;

    if (typeof payload.exp === "number") {
      const expDate = new Date(payload.exp * 1000);
      expiresAt = expDate.toLocaleString("zh-CN");
      isExpired = Date.now() > payload.exp * 1000;
    }
    if (typeof payload.iat === "number") {
      issuedAt = new Date(payload.iat * 1000).toLocaleString("zh-CN");
    }

    return { header, payload, signature: parts[2], isExpired, expiresAt, issuedAt };
  } catch {
    return null;
  }
}

export function JwtDecoderTool() {
  const [input, setInput] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const decoded = useMemo(() => (input.trim() ? decodeJwt(input) : null), [input]);

  const handleCopy = async (text: string, key: string) => {
    await copyToClipboard(text);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>JWT Token</Label>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="粘贴 JWT Token (格式: xxxxx.yyyyy.zzzzz)..."
          className="min-h-[100px] font-mono text-sm"
        />
      </div>

      {input.trim() && !decoded && (
        <Card>
          <CardContent className="p-4">
            <p className="text-destructive text-sm">无效的 JWT Token 格式（需要三段以 . 分隔的 Base64URL 字符串）</p>
          </CardContent>
        </Card>
      )}

      {decoded && (
        <div className="space-y-4">
          {/* Expiry info */}
          {decoded.expiresAt && (
            <Card>
              <CardContent className="p-3 flex items-center gap-3">
                <Badge variant={decoded.isExpired ? "destructive" : "default"}>
                  {decoded.isExpired ? "已过期" : "未过期"}
                </Badge>
                <span className="text-sm">
                  过期时间: {decoded.expiresAt}
                </span>
                {decoded.issuedAt && (
                  <span className="text-sm text-muted-foreground">
                    签发时间: {decoded.issuedAt}
                  </span>
                )}
              </CardContent>
            </Card>
          )}

          {/* Header */}
          <Card>
            <CardContent className="p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Header</span>
                <Button variant="ghost" size="sm" onClick={() => handleCopy(JSON.stringify(decoded.header, null, 2), "header")}>
                  {copiedField === "header" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
              <pre className="text-xs font-mono bg-muted p-2 rounded overflow-auto custom-scrollbar">{JSON.stringify(decoded.header, null, 2)}</pre>
            </CardContent>
          </Card>

          {/* Payload */}
          <Card>
            <CardContent className="p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Payload</span>
                <Button variant="ghost" size="sm" onClick={() => handleCopy(JSON.stringify(decoded.payload, null, 2), "payload")}>
                  {copiedField === "payload" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
              <pre className="text-xs font-mono bg-muted p-2 rounded overflow-auto custom-scrollbar">{JSON.stringify(decoded.payload, null, 2)}</pre>
            </CardContent>
          </Card>

          {/* Signature */}
          <Card>
            <CardContent className="p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Signature</span>
                <Button variant="ghost" size="sm" onClick={() => handleCopy(decoded.signature, "sig")}>
                  {copiedField === "sig" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
              <code className="text-xs font-mono break-all text-muted-foreground">{decoded.signature}</code>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

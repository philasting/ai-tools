"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useCopyState } from "@/components/tool/ToolLayout";

type EncryptMode = "encrypt" | "decrypt";

/** AES-256-GCM encryption using Web Crypto API */
async function aesEncrypt(plaintext: string, password: string): Promise<string> {
  const enc = new TextEncoder();

  // Derive key from password using PBKDF2
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plaintext)
  );

  // Combine salt + iv + ciphertext into a single buffer
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

  // Base64 encode
  return btoa(String.fromCharCode(...combined));
}

/** AES-GCM decryption using Web Crypto API */
async function aesDecrypt(base64Input: string, password: string): Promise<string> {
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  const combined = Uint8Array.from(atob(base64Input), (c) => c.charCodeAt(0));

  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const ciphertext = combined.slice(28);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  return dec.decode(plaintext);
}

export function TextEncryptTool() {
  const [input, setInput] = useState("");
  const [password, setPassword] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<EncryptMode>("encrypt");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { copied, handleCopy } = useCopyState();

  const handleProcess = async () => {
    if (!input || !password) return;
    setLoading(true);
    setError("");

    try {
      if (mode === "encrypt") {
        const result = await aesEncrypt(input, password);
        setOutput(result);
      } else {
        const result = await aesDecrypt(input, password);
        setOutput(result);
      }
    } catch {
      setError(mode === "encrypt" ? "加密失败" : "解密失败，请检查密码是否正确");
      setOutput("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        <Button
          variant={mode === "encrypt" ? "default" : "outline"}
          size="sm"
          onClick={() => { setMode("encrypt"); setOutput(""); setError(""); }}
        >
          加密
        </Button>
        <Button
          variant={mode === "decrypt" ? "default" : "outline"}
          size="sm"
          onClick={() => { setMode("decrypt"); setOutput(""); setError(""); }}
        >
          解密
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>{mode === "encrypt" ? "明文" : "密文"}</Label>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === "encrypt" ? "输入需要加密的文本..." : "输入 Base64 密文..."}
              className="min-h-[200px] text-sm font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label>密码</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入加密/解密密码..."
              className="font-mono"
            />
          </div>
          <Button onClick={handleProcess} disabled={!input || !password || loading} className="w-full">
            {loading ? "处理中..." : mode === "encrypt" ? "加密" : "解密"}
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{mode === "encrypt" ? "密文" : "明文"}</Label>
            <Button variant="ghost" size="sm" onClick={() => handleCopy(output)} disabled={!output}>
              {copied ? "已复制" : "复制"}
            </Button>
          </div>
          <Textarea
            value={output}
            readOnly
            className="min-h-[280px] text-sm font-mono"
          />
        </div>
      </div>

      {error && (
        <Card>
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4 text-xs text-muted-foreground space-y-1">
          <p>• 使用 AES-256-GCM 算法，基于 Web Crypto API 实现</p>
          <p>• 密码通过 PBKDF2 (100000 次迭代 + SHA-256) 派生密钥</p>
          <p>• 每次加密自动生成随机盐值和 IV，确保相同内容不同密文</p>
          <p>• 所有运算均在浏览器本地完成，数据不会上传</p>
        </CardContent>
      </Card>
    </div>
  );
}

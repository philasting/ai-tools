"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCopyState } from "@/components/tool/ToolLayout";

type RsaKeySize = 2048 | 4096;

/** ArrayBuffer to Base64 */
function ab2b64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** Export CryptoKey to PEM format */
async function exportKeyPair(
  keyPair: CryptoKeyPair
): Promise<{ publicKeyPem: string; privateKeyPem: string }> {
  // Export public key
  const pubBuffer = await crypto.subtle.exportKey("spki", keyPair.publicKey);
  const pubB64 = ab2b64(pubBuffer);
  const publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${pubB64.match(/.{1,64}/g)?.join("\n")}\n-----END PUBLIC KEY-----`;

  // Export private key
  const privBuffer = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
  const privB64 = ab2b64(privBuffer);
  const privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${privB64.match(/.{1,64}/g)?.join("\n")}\n-----END PRIVATE KEY-----`;

  return { publicKeyPem, privateKeyPem };
}

export function RsaKeygenTool() {
  const [keySize, setKeySize] = useState<RsaKeySize>(2048);
  const [publicKey, setPublicKey] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [loading, setLoading] = useState(false);
  const pubCopy = useCopyState();
  const privCopy = useCopyState();

  const generateKeyPair = async () => {
    setLoading(true);
    try {
      const keyPair = await crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: keySize,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
      );

      const { publicKeyPem, privateKeyPem } = await exportKeyPair(keyPair);
      setPublicKey(publicKeyPem);
      setPrivateKey(privateKeyPem);
    } catch (err) {
      console.error("RSA key generation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <Label className="text-sm">密钥长度</Label>
          <Select value={String(keySize)} onValueChange={(v) => { if (v !== null) setKeySize(Number(v) as RsaKeySize); }}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2048">2048 位</SelectItem>
              <SelectItem value="4096">4096 位</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={generateKeyPair} disabled={loading}>
          {loading ? "生成中..." : "生成密钥对"}
        </Button>
      </div>

      {publicKey && (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>公钥 (PEM)</Label>
              <Button variant="ghost" size="sm" onClick={() => pubCopy.handleCopy(publicKey)}>
                {pubCopy.copied ? "已复制" : "复制"}
              </Button>
            </div>
            <Textarea value={publicKey} readOnly className="min-h-[150px] text-xs font-mono" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>私钥 (PEM)</Label>
              <Button variant="ghost" size="sm" onClick={() => privCopy.handleCopy(privateKey)}>
                {privCopy.copied ? "已复制" : "复制"}
              </Button>
            </div>
            <Textarea value={privateKey} readOnly className="min-h-[200px] text-xs font-mono" />
          </div>
        </>
      )}

      <Card>
        <CardContent className="p-4 text-xs text-muted-foreground space-y-1">
          <p>• 使用 Web Crypto API 生成 RSA-OAEP 密钥对</p>
          <p>• 支持 2048 位和 4096 位密钥长度</p>
          <p>• 公钥和私钥以 PEM 格式导出</p>
          <p>• ⚠️ 私钥请妥善保管，不要泄露给他人</p>
          <p>• 所有运算在浏览器本地完成，密钥不会上传</p>
        </CardContent>
      </Card>
    </div>
  );
}

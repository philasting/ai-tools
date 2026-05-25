"use client";

import { useState, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useCopyState } from "@/components/tool/ToolLayout";
import QRCode from "qrcode";
import jsQR from "jsqr";

type QrMode = "generate" | "decode";

export function QrcodeTool() {
  const [mode, setMode] = useState<QrMode>("generate");
  const [text, setText] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [size, setSize] = useState(256);
  const [decodedText, setDecodedText] = useState("");
  const [decodeError, setDecodeError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { copied, handleCopy } = useCopyState();

  const generateQR = useCallback(async () => {
    if (!text.trim()) {
      setQrDataUrl("");
      return;
    }
    try {
      const url = await QRCode.toDataURL(text, {
        width: size,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      });
      setQrDataUrl(url);
    } catch {
      setQrDataUrl("");
    }
  }, [text, size]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDecodeError("");
    setDecodedText("");

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
          setDecodedText(code.data);
        } else {
          setDecodeError("未能识别二维码，请确保图片包含有效的二维码");
        }
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        <Button
          variant={mode === "generate" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("generate")}
        >
          生成二维码
        </Button>
        <Button
          variant={mode === "decode" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("decode")}
        >
          解析二维码
        </Button>
      </div>

      {mode === "generate" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>输入内容</Label>
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="输入文本或 URL..."
              className="font-mono"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="space-y-1">
              <Label className="text-sm">尺寸</Label>
              <Input
                type="number"
                value={size}
                onChange={(e) => setSize(Number(e.target.value) || 256)}
                className="w-24 h-8"
                min={64}
                max={1024}
              />
            </div>
            <Button onClick={generateQR} disabled={!text.trim()} className="mt-5">
              生成
            </Button>
          </div>

          {qrDataUrl && (
            <Card>
              <CardContent className="p-4 flex flex-col items-center gap-3">
                <img src={qrDataUrl} alt="QR Code" className="border rounded" />
                <Button variant="outline" size="sm" onClick={() => {
                  const a = document.createElement("a");
                  a.href = qrDataUrl;
                  a.download = "qrcode.png";
                  a.click();
                }}>
                  下载二维码
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {mode === "decode" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>上传二维码图片</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="block w-full text-sm text-muted-foreground
                file:mr-4 file:py-2 file:px-4 file:rounded-lg
                file:border-0 file:text-sm file:font-semibold
                file:bg-primary file:text-primary-foreground
                hover:file:bg-primary/90 cursor-pointer"
            />
          </div>

          {decodedText && (
            <Card>
              <CardContent className="p-4 space-y-2">
                <Label>解析结果</Label>
                <div className="flex items-start gap-2">
                  <p className="text-sm font-mono break-all flex-1 bg-muted p-3 rounded-lg">
                    {decodedText}
                  </p>
                  <Button variant="ghost" size="sm" onClick={() => handleCopy(decodedText)}>
                    {copied ? "已复制" : "复制"}
                  </Button>
                </div>
                {decodedText.startsWith("http") && (
                  <a
                    href={decodedText}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    打开链接 →
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          {decodeError && (
            <Card>
              <CardContent className="p-4 text-center text-sm text-destructive">
                {decodeError}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Upload, Download, Copy, Check, ArrowRightLeft } from "lucide-react";
import { useCopyState } from "@/components/tool/ToolLayout";

type Direction = "img2base64" | "base64img";

export function ImageBase64Tool() {
  const [direction, setDirection] = useState<Direction>("img2base64");
  const [base64Text, setBase64Text] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [includeDataUri, setIncludeDataUri] = useState(true);
  const [fileName, setFileName] = useState("");
  const { copied, handleCopy } = useCopyState();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setBase64Text(result);
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleBase64Decode = () => {
    let data = base64Text.trim();
    if (!data) return;

    // If it has data URI prefix, use it directly
    if (data.startsWith("data:")) {
      setImagePreview(data);
      return;
    }

    // Otherwise, try to detect image type and add prefix
    const prefix = "data:image/png;base64,";
    setImagePreview(prefix + data);
  };

  const handleDownload = () => {
    if (!imagePreview) return;
    const a = document.createElement("a");
    a.href = imagePreview;
    const ext = fileName ? fileName.split(".").pop() || "png" : "png";
    a.download = `image.${ext}`;
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant={direction === "img2base64" ? "default" : "outline"}
          size="sm"
          onClick={() => setDirection("img2base64")}
        >
          图片 → Base64
        </Button>
        <Button
          variant={direction === "base64img" ? "default" : "outline"}
          size="sm"
          onClick={() => setDirection("base64img")}
        >
          Base64 → 图片
        </Button>
      </div>

      {direction === "img2base64" ? (
        <>
          <div
            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) handleFileUpload(file);
            }}
          >
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">点击或拖拽图片到此处</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
          </div>

          {imagePreview && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>预览</Label>
                <span className="text-xs text-muted-foreground">{fileName}</span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="Preview" className="max-h-40 rounded-lg border border-border" />
            </div>
          )}

          {base64Text && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Base64 编码</Label>
                <Button variant="ghost" size="sm" onClick={() => handleCopy(base64Text)}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "已复制" : "复制"}
                </Button>
              </div>
              <Textarea value={base64Text} readOnly className="min-h-[120px] text-xs font-mono" />
              <p className="text-xs text-muted-foreground">
                长度: {base64Text.length.toLocaleString()} 字符
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="space-y-2">
            <Label>Base64 文本</Label>
            <Textarea
              value={base64Text}
              onChange={(e) => setBase64Text(e.target.value)}
              placeholder="粘贴 Base64 编码的图片文本..."
              className="min-h-[150px] text-xs font-mono"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleBase64Decode} size="sm">
              <ArrowRightLeft className="h-4 w-4 mr-1" /> 解码预览
            </Button>
            {imagePreview && (
              <Button onClick={handleDownload} variant="secondary" size="sm">
                <Download className="h-4 w-4 mr-1" /> 下载图片
              </Button>
            )}
          </div>

          {imagePreview && (
            <div className="space-y-2">
              <Label>预览</Label>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="Decoded" className="max-h-60 rounded-lg border border-border" />
            </div>
          )}
        </>
      )}
    </div>
  );
}

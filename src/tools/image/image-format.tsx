"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Upload, Download, Trash2 } from "lucide-react";

type ImageFormat = "image/png" | "image/jpeg" | "image/webp";

const FORMAT_OPTIONS: { value: ImageFormat; label: string; ext: string }[] = [
  { value: "image/png", label: "PNG", ext: "png" },
  { value: "image/jpeg", label: "JPG", ext: "jpg" },
  { value: "image/webp", label: "WEBP", ext: "webp" },
];

interface ConvertedImage {
  originalName: string;
  originalFormat: string;
  targetFormat: ImageFormat;
  url: string;
  quality: number;
}

export function ImageFormatTool() {
  const [images, setImages] = useState<ConvertedImage[]>([]);
  const [targetFormat, setTargetFormat] = useState<ImageFormat>("image/png");
  const [quality, setQuality] = useState(92);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList) => {
    const newImages: ConvertedImage[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;

      const url = await convertFormat(file, targetFormat, quality);
      newImages.push({
        originalName: file.name,
        originalFormat: file.type,
        targetFormat,
        url,
        quality,
      });
    }

    setImages((prev) => [...prev, ...newImages]);
  }, [targetFormat, quality]);

  const convertFormat = async (file: File, format: ImageFormat, quality: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas not available")); return; }
        ctx.drawImage(img, 0, 0);

        const result = canvas.toDataURL(format, quality / 100);
        URL.revokeObjectURL(url);
        resolve(result);
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = url;
    });
  };

  const handleDownload = (image: ConvertedImage) => {
    const a = document.createElement("a");
    a.href = image.url;
    const baseName = image.originalName.replace(/\.[^.]+$/, "");
    const ext = FORMAT_OPTIONS.find((f) => f.value === image.targetFormat)?.ext || "png";
    a.download = `${baseName}.${ext}`;
    a.click();
  };

  const handleConvertAll = async () => {
    // Re-convert existing files is not possible since we don't store original File objects
    // This button is mainly for batch uploads
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <Label className="text-sm">目标格式</Label>
          <Select value={targetFormat} onValueChange={(v) => setTargetFormat(v as ImageFormat)}>
            <SelectTrigger className="w-36 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FORMAT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-sm">质量</Label>
            <span className="text-xs text-muted-foreground">{quality}%</span>
          </div>
          <Slider
            value={[quality]}
            onValueChange={(v) => setQuality(Array.isArray(v) ? v[0] : v)}
            min={10}
            max={100}
            step={1}
            className="w-32"
          />
        </div>
      </div>

      <div
        className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files) handleFiles(e.dataTransfer.files); }}
      >
        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">点击或拖拽图片到此处（支持批量）</p>
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
      </div>

      {images.length > 0 && (
        <div className="flex gap-2">
          <Button onClick={() => images.forEach((img) => handleDownload(img))} variant="secondary" size="sm">
            <Download className="h-4 w-4 mr-1" /> 下载全部
          </Button>
          <Button onClick={() => setImages([])} variant="outline" size="sm">
            <Trash2 className="h-4 w-4 mr-1" /> 清空
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {images.map((img, i) => {
          const targetLabel = FORMAT_OPTIONS.find((f) => f.value === img.targetFormat)?.label || "?";
          return (
            <Card key={i}>
              <CardContent className="p-3 flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex items-center justify-center shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.originalName} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{img.originalName}</p>
                  <p className="text-xs text-muted-foreground">
                    {img.originalFormat.split("/")[1]?.toUpperCase()} → {targetLabel}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleDownload(img)}>
                  <Download className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

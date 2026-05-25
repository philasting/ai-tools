"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Upload, Download, Trash2 } from "lucide-react";

interface ImageFile {
  file: File;
  originalUrl: string;
  compressedUrl: string;
  originalSize: number;
  compressedSize: number;
}

export function ImageCompressTool() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [quality, setQuality] = useState(80);
  const [maxWidth, setMaxWidth] = useState(0);
  const [maxHeight, setMaxHeight] = useState(0);
  const [useResize, setUseResize] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = useCallback(
    async (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
          const canvas = document.createElement("canvas");
          let { width, height } = img;

          if (useResize && (maxWidth > 0 || maxHeight > 0)) {
            if (maxWidth > 0 && width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
            if (maxHeight > 0 && height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) { reject(new Error("Canvas context not available")); return; }
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(URL.createObjectURL(blob));
              } else {
                reject(new Error("Compression failed"));
              }
            },
            "image/jpeg",
            quality / 100
          );
          URL.revokeObjectURL(url);
        };

        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = url;
      });
    },
    [quality, useResize, maxWidth, maxHeight]
  );

  const handleFiles = async (files: FileList) => {
    const newImages: ImageFile[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      const originalUrl = URL.createObjectURL(file);
      try {
        const compressedUrl = await compressImage(file);
        newImages.push({ file, originalUrl, compressedUrl, originalSize: file.size, compressedSize: 0 });
      } catch {
        newImages.push({ file, originalUrl, compressedUrl: originalUrl, originalSize: file.size, compressedSize: file.size });
      }
    }
    setImages((prev) => [...prev, ...newImages]);
  };

  const handleCompressAll = async () => {
    const updated = await Promise.all(
      images.map(async (img) => {
        try {
          const compressedUrl = await compressImage(img.file);
          const response = await fetch(compressedUrl);
          const blob = await response.blob();
          return { ...img, compressedUrl, compressedSize: blob.size };
        } catch {
          return img;
        }
      })
    );
    setImages(updated);
  };

  const handleDownload = (image: ImageFile) => {
    const a = document.createElement("a");
    a.href = image.compressedUrl;
    const ext = image.file.name.split(".").pop() || "jpg";
    a.download = image.file.name.replace(`.${ext}`, `_compressed.${ext}`);
    a.click();
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>压缩质量</Label>
          <span className="text-sm font-mono text-primary">{quality}%</span>
        </div>
        <Slider value={[quality]} onValueChange={(v) => setQuality(Array.isArray(v) ? v[0] : v)} min={10} max={100} step={5} className="w-full" />
      </div>

      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex items-center gap-2">
          <Switch id="use-resize" checked={useResize} onCheckedChange={setUseResize} />
          <Label htmlFor="use-resize" className="text-sm">调整尺寸</Label>
        </div>
        {useResize && (
          <>
            <div className="space-y-1">
              <Label className="text-xs">最大宽度 (px)</Label>
              <Input type="number" value={maxWidth || ""} onChange={(e) => setMaxWidth(Number(e.target.value) || 0)} placeholder="不限" className="w-28 h-8" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">最大高度 (px)</Label>
              <Input type="number" value={maxHeight || ""} onChange={(e) => setMaxHeight(Number(e.target.value) || 0)} placeholder="不限" className="w-28 h-8" />
            </div>
          </>
        )}
      </div>

      <div
        className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files) handleFiles(e.dataTransfer.files); }}
      >
        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">点击或拖拽图片到此处上传（支持批量）</p>
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
      </div>

      {images.length > 0 && (
        <div className="flex gap-2">
          <Button onClick={handleCompressAll} size="sm">压缩全部 ({images.length} 张)</Button>
          <Button onClick={() => images.forEach((img) => handleDownload(img))} variant="secondary" size="sm">
            <Download className="h-4 w-4 mr-1" /> 下载全部
          </Button>
          <Button onClick={() => setImages([])} variant="outline" size="sm">
            <Trash2 className="h-4 w-4 mr-1" /> 清空
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {images.map((img, index) => (
          <Card key={index}>
            <CardContent className="p-3 flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex items-center justify-center shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.compressedUrl} alt={img.file.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{img.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatSize(img.originalSize)}
                  {img.compressedSize > 0 && (
                    <>
                      {" → "}<span className="text-green-600 dark:text-green-400">{formatSize(img.compressedSize)}</span>
                      {" "}<span className="text-green-600 dark:text-green-400">(-{Math.round((1 - img.compressedSize / img.originalSize) * 100)}%)</span>
                    </>
                  )}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(img)}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

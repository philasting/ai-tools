"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Upload, Download } from "lucide-react";

interface ResizeResult {
  originalName: string;
  originalWidth: number;
  originalHeight: number;
  newWidth: number;
  newHeight: number;
  url: string;
}

export function ImageResizeTool() {
  const [results, setResults] = useState<ResizeResult[]>([]);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(0);
  const [keepRatio, setKeepRatio] = useState(true);
  const [originalSize, setOriginalSize] = useState<{ w: number; h: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;

    return new Promise<void>((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        const origW = img.width;
        const origH = img.height;
        setOriginalSize({ w: origW, h: origH });

        let newW = width || origW;
        let newH = height || origH;

        if (keepRatio && width > 0) {
          const ratio = origW / origH;
          newH = Math.round(newW / ratio);
        } else if (keepRatio && height > 0) {
          const ratio = origW / origH;
          newW = Math.round(newH * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = newW;
        canvas.height = newH;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(); return; }
        ctx.drawImage(img, 0, 0, newW, newH);

        const resultUrl = canvas.toDataURL("image/png");
        setResults((prev) => [
          ...prev,
          {
            originalName: file.name,
            originalWidth: origW,
            originalHeight: origH,
            newWidth: newW,
            newHeight: newH,
            url: resultUrl,
          },
        ]);
        URL.revokeObjectURL(url);
        resolve();
      };

      img.onerror = () => resolve();
      img.src = url;
    });
  }, [width, height, keepRatio]);

  const handleFiles = async (files: FileList) => {
    for (const file of Array.from(files)) {
      await handleFile(file);
    }
  };

  const handleDownload = (result: ResizeResult) => {
    const a = document.createElement("a");
    a.href = result.url;
    a.download = result.originalName.replace(/\.[^.]+$/, `_resized.png`);
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <Label className="text-sm">宽度 (px)</Label>
          <Input
            type="number"
            value={width || ""}
            onChange={(e) => setWidth(Number(e.target.value) || 0)}
            placeholder="自动"
            className="w-28 h-8"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">高度 (px)</Label>
          <Input
            type="number"
            value={height || ""}
            onChange={(e) => setHeight(Number(e.target.value) || 0)}
            placeholder="自动"
            className="w-28 h-8"
          />
        </div>
        <div className="flex items-center gap-2 pb-1">
          <Switch id="keep-ratio" checked={keepRatio} onCheckedChange={setKeepRatio} />
          <Label htmlFor="keep-ratio" className="text-sm">保持比例</Label>
        </div>
      </div>

      {originalSize && (
        <p className="text-xs text-muted-foreground">
          原始尺寸: {originalSize.w} × {originalSize.h}px
        </p>
      )}

      <div
        className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files) handleFiles(e.dataTransfer.files); }}
      >
        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">点击或拖拽图片到此处</p>
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
      </div>

      <div className="space-y-2">
        {results.map((result, i) => (
          <Card key={i}>
            <CardContent className="p-3 flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex items-center justify-center shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={result.url} alt={result.originalName} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{result.originalName}</p>
                <p className="text-xs text-muted-foreground">
                  {result.originalWidth}×{result.originalHeight} → {result.newWidth}×{result.newHeight}px
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleDownload(result)}>
                <Download className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useCopyState } from "@/components/tool/ToolLayout";

interface ColorInfo {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function getColorAtPixel(
  imageData: ImageData,
  x: number,
  y: number
): ColorInfo {
  const idx = (y * imageData.width + x) * 4;
  const r = imageData.data[idx];
  const g = imageData.data[idx + 1];
  const b = imageData.data[idx + 2];
  const hex = "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");
  return { hex, rgb: { r, g, b }, hsl: rgbToHsl(r, g, b) };
}

export function ColorPickerTool() {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [currentColor, setCurrentColor] = useState<ColorInfo | null>(null);
  const [colorHistory, setColorHistory] = useState<ColorInfo[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const imageDataRef = useRef<ImageData | null>(null);
  const { copied, handleCopy } = useCopyState();

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCurrentColor(null);

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      setImageUrl(url);

      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      imageDataRef.current = ctx.getImageData(0, 0, img.width, img.height);
    };
    img.src = url;
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!imageDataRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    const color = getColorAtPixel(imageDataRef.current, x, y);
    setCurrentColor(color);
    setColorHistory((prev) => {
      if (prev.length > 0 && prev[0].hex === color.hex) return prev;
      return [color, ...prev].slice(0, 20);
    });
  }, []);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>上传图片</Label>
        <input
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

      {imageUrl && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <Label className="text-sm">点击图片取色</Label>
            <div className="overflow-auto max-h-[300px] border rounded-lg cursor-crosshair inline-block">
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                className="max-w-full h-auto"
                style={{ imageRendering: "auto" }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {currentColor && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-lg border-2 border-border shrink-0"
                style={{ backgroundColor: currentColor.hex }}
              />
              <div className="space-y-1 text-sm flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground w-10">HEX</span>
                  <span className="font-mono">{currentColor.hex}</span>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => handleCopy(currentColor.hex)}>
                    复制
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground w-10">RGB</span>
                  <span className="font-mono">rgb({currentColor.rgb.r}, {currentColor.rgb.g}, {currentColor.rgb.b})</span>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => handleCopy(`rgb(${currentColor.rgb.r}, ${currentColor.rgb.g}, ${currentColor.rgb.b})`)}>
                    复制
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground w-10">HSL</span>
                  <span className="font-mono">hsl({currentColor.hsl.h}, {currentColor.hsl.s}%, {currentColor.hsl.l}%)</span>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => handleCopy(`hsl(${currentColor.hsl.h}, ${currentColor.hsl.s}%, ${currentColor.hsl.l}%)`)}>
                    复制
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {colorHistory.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <Label className="text-sm">取色历史</Label>
            <div className="flex flex-wrap gap-2">
              {colorHistory.map((c, i) => (
                <button
                  key={i}
                  onClick={() => handleCopy(c.hex)}
                  className="w-8 h-8 rounded-lg border-2 border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: c.hex }}
                  title={c.hex}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

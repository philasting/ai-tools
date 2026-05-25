"use client";

import { useState, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type WatermarkType = "text" | "image";
type WatermarkPosition = "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right" | "tiled";

export function WatermarkTool() {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [resultUrl, setResultUrl] = useState<string>("");
  const [watermarkType, setWatermarkType] = useState<WatermarkType>("text");
  const [text, setText] = useState("WATERMARK");
  const [fontSize, setFontSize] = useState(48);
  const [fontColor, setFontColor] = useState("#808080");
  const [opacity, setOpacity] = useState(30);
  const [position, setPosition] = useState<WatermarkPosition>("tiled");
  const [rotation, setRotation] = useState(-30);
  const [wmImageUrl, setWmImageUrl] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const wmImgRef = useRef<HTMLImageElement | null>(null);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { imgRef.current = img; setImageUrl(url); };
    img.src = url;
  }, []);

  const handleWmImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { wmImgRef.current = img; setWmImageUrl(url); };
    img.src = url;
  }, []);

  const applyWatermark = useCallback(() => {
    if (!imgRef.current) return;
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);

    ctx.globalAlpha = opacity / 100;

    if (watermarkType === "text") {
      ctx.font = `${fontSize}px sans-serif`;
      ctx.fillStyle = fontColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      if (position === "tiled") {
        const angleRad = (rotation * Math.PI) / 180;
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(angleRad);
        const stepX = fontSize * text.length * 0.8 + 100;
        const stepY = fontSize * 2.5;
        const diagonal = Math.sqrt(canvas.width ** 2 + canvas.height ** 2);
        for (let y = -diagonal; y < diagonal; y += stepY) {
          for (let x = -diagonal; x < diagonal; x += stepX) {
            ctx.fillText(text, x, y);
          }
        }
        ctx.restore();
      } else {
        const pos = getPositionCoords(position, canvas.width, canvas.height, fontSize * text.length * 0.5, fontSize * 0.5);
        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.fillText(text, 0, 0);
        ctx.restore();
      }
    } else if (watermarkType === "image" && wmImgRef.current) {
      const wmImg = wmImgRef.current;
      const wmW = Math.min(wmImg.width, canvas.width * 0.3);
      const wmH = (wmImg.height / wmImg.width) * wmW;

      if (position === "tiled") {
        const stepX = wmW + 80;
        const stepY = wmH + 80;
        for (let y = 0; y < canvas.height; y += stepY) {
          for (let x = 0; x < canvas.width; x += stepX) {
            ctx.drawImage(wmImg, x, y, wmW, wmH);
          }
        }
      } else {
        const pos = getPositionCoords(position, canvas.width, canvas.height, wmW / 2, wmH / 2);
        ctx.drawImage(wmImg, pos.x - wmW / 2, pos.y - wmH / 2, wmW, wmH);
      }
    }

    ctx.globalAlpha = 1;
    setResultUrl(canvas.toDataURL("image/png"));
  }, [watermarkType, text, fontSize, fontColor, opacity, position, rotation]);

  const handleDownload = useCallback(() => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = "watermarked.png";
    a.click();
  }, [resultUrl]);

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

      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <Label className="text-sm">水印类型</Label>
          <Select value={watermarkType} onValueChange={(v) => { if (v !== null) setWatermarkType(v as WatermarkType); }}>
            <SelectTrigger className="w-28 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">文字水印</SelectItem>
              <SelectItem value="image">图片水印</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-sm">位置</Label>
          <Select value={position} onValueChange={(v) => { if (v !== null) setPosition(v as WatermarkPosition); }}>
            <SelectTrigger className="w-28 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tiled">平铺</SelectItem>
              <SelectItem value="center">居中</SelectItem>
              <SelectItem value="bottom-right">右下</SelectItem>
              <SelectItem value="bottom-left">左下</SelectItem>
              <SelectItem value="top-right">右上</SelectItem>
              <SelectItem value="top-left">左上</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-sm">透明度 ({opacity}%)</Label>
          <input type="range" min={5} max={100} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="w-28" />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">角度 ({rotation}°)</Label>
          <input type="range" min={-90} max={90} value={rotation} onChange={(e) => setRotation(Number(e.target.value))} className="w-28" />
        </div>
      </div>

      {watermarkType === "text" && (
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1">
            <Label className="text-sm">水印文字</Label>
            <Input value={text} onChange={(e) => setText(e.target.value)} className="w-40 h-8" />
          </div>
          <div className="space-y-1">
            <Label className="text-sm">字号</Label>
            <Input type="number" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-20 h-8" min={12} max={200} />
          </div>
          <div className="space-y-1">
            <Label className="text-sm">颜色</Label>
            <input type="color" value={fontColor} onChange={(e) => setFontColor(e.target.value)} className="w-10 h-8 rounded cursor-pointer" />
          </div>
        </div>
      )}

      {watermarkType === "image" && (
        <div className="space-y-2">
          <Label>水印图片</Label>
          <input
            type="file"
            accept="image/*"
            onChange={handleWmImageUpload}
            className="block w-full text-sm text-muted-foreground
              file:mr-4 file:py-2 file:px-4 file:rounded-lg
              file:border-0 file:text-sm file:font-semibold
              file:bg-primary file:text-primary-foreground
              hover:file:bg-primary/90 cursor-pointer"
          />
        </div>
      )}

      <Button onClick={applyWatermark} disabled={!imageUrl} className="w-full">
        添加水印
      </Button>

      {resultUrl && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <img src={resultUrl} alt="Result" className="max-w-full border rounded-lg" />
            <Button onClick={handleDownload} className="w-full">下载图片</Button>
          </CardContent>
        </Card>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

function getPositionCoords(
  position: WatermarkPosition,
  canvasW: number,
  canvasH: number,
  halfTextW: number,
  halfTextH: number
): { x: number; y: number } {
  const pad = 40;
  switch (position) {
    case "center": return { x: canvasW / 2, y: canvasH / 2 };
    case "top-left": return { x: pad + halfTextW, y: pad + halfTextH };
    case "top-right": return { x: canvasW - pad - halfTextW, y: pad + halfTextH };
    case "bottom-left": return { x: pad + halfTextW, y: canvasH - pad - halfTextH };
    case "bottom-right": return { x: canvasW - pad - halfTextW, y: canvasH - pad - halfTextH };
    default: return { x: canvasW / 2, y: canvasH / 2 };
  }
}

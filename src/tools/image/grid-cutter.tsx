"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

/** Cut image into 3x3 grid pieces */
function cutGrid(
  img: HTMLImageElement
): Promise<string[]> {
  return new Promise((resolve) => {
    const pieces: string[] = [];
    const pieceW = Math.floor(img.width / 3);
    const pieceH = Math.floor(img.height / 3);

    let loaded = 0;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const canvas = document.createElement("canvas");
        canvas.width = pieceW;
        canvas.height = pieceH;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(
          img,
          col * pieceW, row * pieceH, pieceW, pieceH,
          0, 0, pieceW, pieceH
        );
        pieces.push(canvas.toDataURL("image/png"));
        loaded++;
        if (loaded === 9) resolve(pieces);
      }
    }
  });
}

export function GridCutterTool() {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [pieces, setPieces] = useState<string[]>([]);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPieces([]);

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { imgRef.current = img; setImageUrl(url); };
    img.src = url;
  }, []);

  const handleCut = useCallback(async () => {
    if (!imgRef.current) return;
    const result = await cutGrid(imgRef.current);
    setPieces(result);
  }, []);

  const handleDownloadAll = useCallback(() => {
    pieces.forEach((dataUrl, idx) => {
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `grid-${Math.floor(idx / 3) + 1}-${(idx % 3) + 1}.png`;
      a.click();
    });
  }, [pieces]);

  const handleDownloadOne = useCallback((dataUrl: string, idx: number) => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `grid-${Math.floor(idx / 3) + 1}-${(idx % 3) + 1}.png`;
    a.click();
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
            <Label className="text-sm">原始图片预览</Label>
            <img src={imageUrl} alt="Preview" className="max-w-full max-h-[300px] object-contain border rounded-lg" />
            <Button onClick={handleCut} className="w-full">切图</Button>
          </CardContent>
        </Card>
      )}

      {pieces.length === 9 && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">九宫格预览</Label>
              <Button variant="outline" size="sm" onClick={handleDownloadAll}>
                下载全部
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {pieces.map((dataUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => handleDownloadOne(dataUrl, idx)}
                  className="border rounded-lg overflow-hidden hover:border-primary transition-colors group"
                  title="点击下载"
                >
                  <img
                    src={dataUrl}
                    alt={`Piece ${idx + 1}`}
                    className="w-full h-auto group-hover:opacity-80 transition-opacity"
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              点击单张图片可单独下载
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4 text-xs text-muted-foreground space-y-1">
          <p>• 将图片均匀切成 3×3 共 9 片</p>
          <p>• 适配微信朋友圈九宫格发布</p>
          <p>• 建议上传正方形图片以获得最佳效果</p>
        </CardContent>
      </Card>
    </div>
  );
}

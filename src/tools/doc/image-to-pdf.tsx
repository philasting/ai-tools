"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Upload, Download, Trash2 } from "lucide-react";
import { PDFDocument } from "pdf-lib";

interface ImageItem {
  file: File;
  url: string;
}

export function ImageToPdfTool() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addImages = (files: FileList) => {
    const newImages: ImageItem[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      newImages.push({ file, url: URL.createObjectURL(file) });
    }
    setImages((prev) => [...prev, ...newImages]);
  };

  const handleConvert = async () => {
    if (images.length === 0) return;
    setLoading(true);
    setError("");

    try {
      const pdfDoc = await PDFDocument.create();

      for (const item of images) {
        const buffer = await item.file.arrayBuffer();
        const bytes = new Uint8Array(buffer);

        let image;
        if (item.file.type === "image/png") {
          image = await pdfDoc.embedPng(bytes);
        } else if (item.file.type === "image/jpeg" || item.file.type === "image/jpg") {
          image = await pdfDoc.embedJpg(bytes);
        } else {
          // Convert other formats to PNG first via Canvas
          const img = new Image();
          const loaded = await new Promise<HTMLCanvasElement>((resolve, reject) => {
            img.onload = () => {
              const canvas = document.createElement("canvas");
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext("2d");
              if (!ctx) { reject(new Error("Canvas not available")); return; }
              ctx.drawImage(img, 0, 0);
              resolve(canvas);
            };
            img.onerror = () => reject(new Error("Failed to load image"));
            img.src = item.url;
          });

          const pngBlob = await new Promise<Blob>((resolve) => {
            loaded.toBlob((blob) => resolve(blob!), "image/png");
          });
          const pngBuffer = await pngBlob.arrayBuffer();
          image = await pdfDoc.embedPng(new Uint8Array(pngBuffer));
        }

        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "images.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(`转换失败: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files) addImages(e.dataTransfer.files); }}
      >
        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">点击或拖拽图片到此处（支持多图）</p>
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && addImages(e.target.files)} />
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      {images.length > 0 && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {images.map((img, i) => (
              <div key={i} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.file.name} className="w-full h-24 object-cover rounded-lg border border-border" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80"
                  onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleConvert} disabled={loading}>
              {loading ? "转换中..." : `转换 ${images.length} 张图片为 PDF`}
            </Button>
            <Button onClick={() => setImages([])} variant="outline">
              清空
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

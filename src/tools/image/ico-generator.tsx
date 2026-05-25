"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useCopyState } from "@/components/tool/ToolLayout";

/** ICO file format structures */
const ICO_HEADER_SIZE = 6;
const ICO_DIR_ENTRY_SIZE = 16;
const BMP_INFO_HEADER_SIZE = 40;

function createIcoFile(images: { width: number; height: number; pixels: Uint8ClampedArray }[]): Uint8Array {
  const count = images.length;
  const headerSize = ICO_HEADER_SIZE + count * ICO_DIR_ENTRY_SIZE;

  let bmpDataOffset = headerSize;
  const bmpBuffers: Uint8Array[] = [];

  for (const img of images) {
    const { width, height, pixels } = img;
    // BMP data: AND mask + XOR mask (BGRA)
    const andMaskRowSize = Math.ceil(width / 8 / 4) * 4;
    const xorMaskRowSize = width * 4; // BGRA
    const rowSize = xorMaskRowSize; // We use BGRA (32-bit)
    const imageSize = BMP_INFO_HEADER_SIZE + (rowSize + andMaskRowSize) * height;

    const bmp = new Uint8Array(imageSize);
    const view = new DataView(bmp.buffer);

    // BITMAPINFOHEADER
    view.setUint32(0, BMP_INFO_HEADER_SIZE, true); // biSize
    view.setInt32(4, width, true); // biWidth
    view.setInt32(8, height * 2, true); // biHeight (doubled for AND mask)
    view.setUint16(12, 1, true); // biPlanes
    view.setUint16(14, 32, true); // biBitCount (BGRA)
    view.setUint32(16, 0, true); // biCompression
    view.setUint32(20, imageSize - BMP_INFO_HEADER_SIZE, true); // biSizeImage
    view.setInt32(24, 0, true); // biXPelsPerMeter
    view.setInt32(28, 0, true); // biYPelsPerMeter
    view.setUint32(32, 0, true); // biClrUsed
    view.setUint32(36, 0, true); // biClrImportant

    // Pixel data (bottom-up, BGRA)
    let offset = BMP_INFO_HEADER_SIZE;
    for (let y = height - 1; y >= 0; y--) {
      for (let x = 0; x < width; x++) {
        const srcIdx = (y * width + x) * 4;
        bmp[offset++] = pixels[srcIdx + 2]; // B
        bmp[offset++] = pixels[srcIdx + 1]; // G
        bmp[offset++] = pixels[srcIdx];     // R
        bmp[offset++] = pixels[srcIdx + 3]; // A
      }
    }

    bmpBuffers.push(bmp);
  }

  // Calculate total size
  let totalSize = headerSize;
  for (const bmp of bmpBuffers) totalSize += bmp.length;

  const ico = new Uint8Array(totalSize);
  const view = new DataView(ico.buffer);

  // ICO Header
  view.setUint16(0, 0, true); // Reserved
  view.setUint16(2, 1, true); // Type: 1 = ICO
  view.setUint16(4, count, true); // Number of images

  // Directory entries
  let dataOffset = headerSize;
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const entryOffset = ICO_HEADER_SIZE + i * ICO_DIR_ENTRY_SIZE;
    view.setUint8(entryOffset + 0, img.width >= 256 ? 0 : img.width);
    view.setUint8(entryOffset + 1, img.height >= 256 ? 0 : img.height);
    view.setUint8(entryOffset + 2, 0); // Color palette
    view.setUint8(entryOffset + 3, 0); // Reserved
    view.setUint16(entryOffset + 4, 1, true); // Color planes
    view.setUint16(entryOffset + 6, 32, true); // Bits per pixel
    view.setUint32(entryOffset + 8, bmpBuffers[i].length, true); // Image size
    view.setUint32(entryOffset + 12, dataOffset, true); // Image offset

    dataOffset += bmpBuffers[i].length;
  }

  // Copy BMP data
  let writeOffset = headerSize;
  for (const bmp of bmpBuffers) {
    ico.set(bmp, writeOffset);
    writeOffset += bmp.length;
  }

  return ico;
}

/** Resize image to target size using Canvas */
function resizeImage(
  img: HTMLImageElement,
  targetSize: number
): { width: number; height: number; pixels: Uint8ClampedArray } {
  const canvas = document.createElement("canvas");
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, targetSize, targetSize);
  const imageData = ctx.getImageData(0, 0, targetSize, targetSize);
  return { width: targetSize, height: targetSize, pixels: imageData.data };
}

const ICO_SIZES = [16, 32, 48, 64];

export function IcoGeneratorTool() {
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [icoReady, setIcoReady] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<number[]>([16, 32, 48]);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIcoReady(false);

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setPreviewUrl(url);
    };
    img.src = url;
  }, []);

  const toggleSize = (size: number) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
    setIcoReady(false);
  };

  const handleGenerate = useCallback(() => {
    if (!imgRef.current || selectedSizes.length === 0) return;

    const images = selectedSizes
      .sort((a, b) => a - b)
      .map((size) => resizeImage(imgRef.current!, size));

    const icoData = createIcoFile(images);
    const blob = new Blob([icoData.buffer as ArrayBuffer], { type: "image/x-icon" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "favicon.ico";
    a.click();
    URL.revokeObjectURL(url);
    setIcoReady(true);
  }, [selectedSizes]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>上传图片</Label>
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

      {previewUrl && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-4">
              <img src={previewUrl} alt="Preview" className="w-24 h-24 object-contain border rounded" />
              <div className="text-sm text-muted-foreground">
                原始图片预览，将缩放至目标尺寸
              </div>
            </div>

            <div className="space-y-2">
              <Label>选择 ICO 尺寸</Label>
              <div className="flex gap-2">
                {ICO_SIZES.map((size) => (
                  <Button
                    key={size}
                    variant={selectedSizes.includes(size) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleSize(size)}
                  >
                    {size}×{size}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={selectedSizes.length === 0}
              className="w-full"
            >
              生成 ICO 并下载
            </Button>

            {icoReady && (
              <p className="text-sm text-green-600 dark:text-green-400 text-center">
                ✅ ICO 文件已生成并下载
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4 text-xs text-muted-foreground space-y-1">
          <p>• 支持将 PNG/JPG/WEBP 等图片转换为 ICO 格式</p>
          <p>• 可选尺寸：16×16、32×32、48×48、64×64</p>
          <p>• 生成的 ICO 文件包含所有选中的尺寸</p>
          <p>• 使用高质量缩放算法，确保小尺寸清晰度</p>
        </CardContent>
      </Card>
    </div>
  );
}

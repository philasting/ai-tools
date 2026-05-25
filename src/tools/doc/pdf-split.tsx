"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download, Scissors } from "lucide-react";
import { PDFDocument } from "pdf-lib";

export function PdfSplitTool() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [rangeInput, setRangeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (file.type !== "application/pdf") return;
    setPdfFile(file);
    setError("");
    try {
      const buffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(buffer);
      setPageCount(pdf.getPageCount());
      setRangeInput(`1-${pdf.getPageCount()}`);
    } catch (e) {
      setError(`读取 PDF 失败: ${(e as Error).message}`);
    }
  };

  const parseRanges = (input: string, max: number): number[][] => {
    const ranges: number[][] = [];
    const parts = input.split(",").map((s) => s.trim()).filter(Boolean);

    for (const part of parts) {
      if (part.includes("-")) {
        const [startStr, endStr] = part.split("-");
        const start = Math.max(1, parseInt(startStr) || 1);
        const end = Math.min(max, parseInt(endStr) || max);
        const pages: number[] = [];
        for (let i = start; i <= end; i++) pages.push(i);
        ranges.push(pages);
      } else {
        const page = parseInt(part);
        if (page >= 1 && page <= max) ranges.push([page]);
      }
    }

    return ranges;
  };

  const handleSplit = async () => {
    if (!pdfFile) return;
    setLoading(true);
    setError("");

    try {
      const buffer = await pdfFile.arrayBuffer();
      const sourcePdf = await PDFDocument.load(buffer);
      const ranges = parseRanges(rangeInput, pageCount);

      for (const pages of ranges) {
        const newPdf = await PDFDocument.create();
        const indices = pages.map((p) => p - 1);
        const copiedPages = await newPdf.copyPages(sourcePdf, indices);
        copiedPages.forEach((page) => newPdf.addPage(page));

        const pdfBytes = await newPdf.save();
        const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        const baseName = pdfFile.name.replace(/\.pdf$/i, "");
        const rangeLabel = pages.length === 1 ? `p${pages[0]}` : `p${pages[0]}-${pages[pages.length - 1]}`;
        a.download = `${baseName}_${rangeLabel}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      setError(`拆分失败: ${(e as Error).message}`);
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
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
      >
        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">点击或拖拽 PDF 文件到此处</p>
        <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>

      {pdfFile && (
        <Card>
          <CardContent className="p-3">
            <p className="text-sm font-medium">{pdfFile.name}</p>
            <p className="text-xs text-muted-foreground">{pageCount} 页</p>
          </CardContent>
        </Card>
      )}

      {pageCount > 0 && (
        <div className="space-y-2">
          <Label>页码范围（逗号分隔，支持连字符）</Label>
          <Input
            value={rangeInput}
            onChange={(e) => setRangeInput(e.target.value)}
            placeholder="例: 1-3, 5, 7-10"
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            每个逗号分隔的范围将生成一个独立的 PDF 文件
          </p>
        </div>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}

      {pdfFile && (
        <Button onClick={handleSplit} disabled={loading || !rangeInput}>
          <Scissors className="h-4 w-4 mr-1" />
          {loading ? "拆分中..." : "拆分下载"}
        </Button>
      )}
    </div>
  );
}

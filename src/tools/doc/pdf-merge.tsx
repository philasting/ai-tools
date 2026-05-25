"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Download, Trash2, GripVertical } from "lucide-react";
import { PDFDocument } from "pdf-lib";

interface PdfFileItem {
  file: File;
  name: string;
  pageCount: number;
}

export function PdfMergeTool() {
  const [files, setFiles] = useState<PdfFileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = async (newFiles: FileList) => {
    const items: PdfFileItem[] = [];
    for (const file of Array.from(newFiles)) {
      if (file.type !== "application/pdf") continue;
      try {
        const buffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(buffer);
        items.push({
          file,
          name: file.name,
          pageCount: pdf.getPageCount(),
        });
      } catch {
        items.push({ file, name: file.name, pageCount: 0 });
      }
    }
    setFiles((prev) => [...prev, ...items]);
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setError("请至少添加 2 个 PDF 文件");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const mergedPdf = await PDFDocument.create();

      for (const item of files) {
        try {
          const buffer = await item.file.arrayBuffer();
          const pdf = await PDFDocument.load(buffer);
          const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
          pages.forEach((page) => mergedPdf.addPage(page));
        } catch (e) {
          setError(`合并 ${item.name} 时出错: ${(e as Error).message}`);
          setLoading(false);
          return;
        }
      }

      const mergedBytes = await mergedPdf.save();
      const blob = new Blob([mergedBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "merged.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(`合并失败: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const moveFile = (index: number, direction: "up" | "down") => {
    const newFiles = [...files];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFiles.length) return;
    [newFiles[index], newFiles[targetIndex]] = [newFiles[targetIndex], newFiles[index]];
    setFiles(newFiles);
  };

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files) addFiles(e.dataTransfer.files); }}
      >
        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">点击或拖拽 PDF 文件到此处（支持多文件）</p>
        <input ref={fileInputRef} type="file" accept="application/pdf" multiple className="hidden" onChange={(e) => e.target.files && addFiles(e.target.files)} />
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, i) => (
            <Card key={i}>
              <CardContent className="p-3 flex items-center gap-3">
                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-xs font-semibold text-muted-foreground w-6">#{i + 1}</span>
                <span className="text-sm font-medium truncate flex-1">{file.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">{file.pageCount} 页</span>
                <Button variant="ghost" size="sm" className="h-7 w-7 shrink-0" onClick={() => moveFile(i, "up")} disabled={i === 0}>↑</Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 shrink-0" onClick={() => moveFile(i, "down")} disabled={i === files.length - 1}>↓</Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}

          <div className="flex gap-2 pt-2">
            <Button onClick={handleMerge} disabled={loading || files.length < 2}>
              {loading ? "合并中..." : `合并 ${files.length} 个文件`}
            </Button>
            <Button onClick={() => setFiles([])} variant="outline">
              清空
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

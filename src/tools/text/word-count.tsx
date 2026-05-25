"use client";

import { useState, useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

export function WordCountTool() {
  const [text, setText] = useState("");

  const stats = useMemo(() => {
    const charCount = text.length;
    const charNoSpaces = text.replace(/\s/g, "").length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const lines = text ? text.split("\n").length : 0;
    const paragraphs = text.trim() ? text.trim().split(/\n\s*\n/).length : 0;
    const sentences = (text.match(/[.!?。！？]+/g) || []).length || (text.trim() ? 1 : 0);
    const bytes = new TextEncoder().encode(text).length;
    return { charCount, charNoSpaces, words, chineseChars, lines, paragraphs, sentences, bytes };
  }, [text]);

  const statItems = [
    { label: "字符数", value: stats.charCount },
    { label: "字符数(不含空格)", value: stats.charNoSpaces },
    { label: "单词数", value: stats.words },
    { label: "中文字数", value: stats.chineseChars },
    { label: "行数", value: stats.lines },
    { label: "段落数", value: stats.paragraphs },
    { label: "句子数", value: stats.sentences },
    { label: "字节数", value: stats.bytes },
  ];

  return (
    <div className="space-y-4">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="在此输入或粘贴文本，实时统计字数..."
        className="min-h-[200px] text-sm"
      />
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {statItems.map((item) => (
              <div key={item.label} className="text-center">
                <p className="text-2xl font-bold text-primary">{item.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

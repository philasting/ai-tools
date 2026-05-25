"use client";

import { useState, useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useCopyState } from "@/components/tool/ToolLayout";
import { marked } from "marked";

// Configure marked for safe rendering
marked.setOptions({
  breaks: true,
  gfm: true,
});

export function MarkdownPreviewTool() {
  const [input, setInput] = useState(`# Markdown 预览

## 功能演示

这是一个 **Markdown** 实时预览工具，支持常见语法：

### 文本样式

- **粗体文本**
- *斜体文本*
- ~~删除线~~
- \`行内代码\`

### 代码块

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

### 列表

1. 第一项
2. 第二项
3. 第三项

### 引用

> 这是一段引用文本

### 表格

| 功能 | 状态 |
|------|------|
| 标题 | ✅ |
| 列表 | ✅ |
| 代码 | ✅ |

### 链接

[访问 GitHub](https://github.com)
`);

  const { copied, handleCopy } = useCopyState();

  const htmlOutput = useMemo(() => {
    try {
      return marked(input) as string;
    } catch {
      return "<p>渲染失败</p>";
    }
  }, [input]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Markdown 输入</Label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入 Markdown 文本..."
            className="min-h-[500px] text-sm font-mono"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>预览</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopy(htmlOutput)}
            >
              {copied ? "已复制 HTML" : "复制 HTML"}
            </Button>
          </div>
          <div
            className="min-h-[500px] border rounded-lg p-4 overflow-auto text-sm
              prose prose-sm dark:prose-invert max-w-none
              prose-headings:mt-4 prose-headings:mb-2
              prose-p:my-2 prose-pre:bg-muted prose-pre:p-3
              prose-code:text-primary prose-code:before:content-[''] prose-code:after:content-['']
              prose-table:border-collapse prose-th:border prose-th:p-1.5
              prose-td:border prose-td:p-1.5"
            dangerouslySetInnerHTML={{ __html: htmlOutput }}
          />
        </div>
      </div>
    </div>
  );
}

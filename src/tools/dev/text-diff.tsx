"use client";

import { useState, useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type DiffLine = {
  type: "same" | "add" | "remove";
  lineNum: number;
  content: string;
};

/** Simple line-based diff using LCS algorithm */
function computeDiff(textA: string, textB: string): { left: DiffLine[]; right: DiffLine[] } {
  const linesA = textA.split("\n");
  const linesB = textB.split("\n");

  // Build LCS table
  const m = linesA.length;
  const n = linesB.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (linesA[i - 1] === linesB[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find diff
  const left: DiffLine[] = [];
  const right: DiffLine[] = [];
  let i = m, j = n;

  const tempLeft: DiffLine[] = [];
  const tempRight: DiffLine[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && linesA[i - 1] === linesB[j - 1]) {
      tempLeft.push({ type: "same", lineNum: i, content: linesA[i - 1] });
      tempRight.push({ type: "same", lineNum: j, content: linesB[j - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      tempLeft.push({ type: "add" as const, lineNum: 0, content: "" });
      tempRight.push({ type: "add", lineNum: j, content: linesB[j - 1] });
      j--;
    } else {
      tempLeft.push({ type: "remove", lineNum: i, content: linesA[i - 1] });
      tempRight.push({ type: "add" as const, lineNum: 0, content: "" });
      i--;
    }
  }

  // Reverse since we backtracked
  tempLeft.reverse();
  tempRight.reverse();

  // Renumber line numbers for display
  let leftNum = 0;
  let rightNum = 0;
  for (let k = 0; k < tempLeft.length; k++) {
    if (tempLeft[k].type === "same" || tempLeft[k].type === "remove") {
      leftNum++;
      tempLeft[k].lineNum = leftNum;
    }
    if (tempRight[k].type === "same" || tempRight[k].type === "add") {
      rightNum++;
      tempRight[k].lineNum = rightNum;
    }
  }

  return { left: tempLeft, right: tempRight };
}

export function TextDiffTool() {
  const [textA, setTextA] = useState("");
  const [textB, setTextB] = useState("");

  const diff = useMemo(() => computeDiff(textA, textB), [textA, textB]);

  const stats = useMemo(() => {
    let added = 0, removed = 0, same = 0;
    diff.left.forEach((l) => {
      if (l.type === "remove") removed++;
      else if (l.type === "same") same++;
    });
    diff.right.forEach((l) => {
      if (l.type === "add") added++;
    });
    return { added, removed, same };
  }, [diff]);

  const renderSide = (lines: DiffLine[], side: "left" | "right") => (
    <div className="font-mono text-sm overflow-x-auto">
      {lines.map((line, idx) => (
        <div
          key={idx}
          className={cn(
            "flex min-h-[1.5em] leading-[1.5em]",
            line.type === "remove" && "bg-red-500/10 text-red-700 dark:text-red-400",
            line.type === "add" && "bg-green-500/10 text-green-700 dark:text-green-400",
            line.type === "same" && line.content === "" && side === (line.lineNum ? "left" : "right") && "bg-transparent"
          )}
        >
          <span className="inline-block w-10 shrink-0 text-right pr-2 text-muted-foreground select-none text-xs leading-[1.5em]">
            {line.lineNum || ""}
          </span>
          <span className="inline-block w-5 shrink-0 text-center select-none text-xs leading-[1.5em]">
            {line.type === "remove" ? "−" : line.type === "add" ? "+" : " "}
          </span>
          <span className="whitespace-pre px-1 leading-[1.5em]">{line.content}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>原始文本</Label>
          <Textarea
            value={textA}
            onChange={(e) => setTextA(e.target.value)}
            placeholder="输入原始文本..."
            className="min-h-[200px] text-sm font-mono"
          />
        </div>
        <div className="space-y-2">
          <Label>修改后文本</Label>
          <Textarea
            value={textB}
            onChange={(e) => setTextB(e.target.value)}
            placeholder="输入修改后文本..."
            className="min-h-[200px] text-sm font-mono"
          />
        </div>
      </div>

      {(textA || textB) && (
        <div className="space-y-2">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-green-600 dark:text-green-400">+{stats.added} 行新增</span>
            <span className="text-red-600 dark:text-red-400">−{stats.removed} 行删除</span>
            <span className="text-muted-foreground">{stats.same} 行相同</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border rounded-lg overflow-hidden">
            <div className="border-r overflow-auto max-h-[400px]">
              <div className="p-1 bg-muted/30 text-xs font-semibold text-muted-foreground text-center sticky top-0">
                原始
              </div>
              {renderSide(diff.left, "left")}
            </div>
            <div className="overflow-auto max-h-[400px]">
              <div className="p-1 bg-muted/30 text-xs font-semibold text-muted-foreground text-center sticky top-0">
                修改后
              </div>
              {renderSide(diff.right, "right")}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

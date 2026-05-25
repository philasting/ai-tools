"use client";

import { useState, useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCopyState } from "@/components/tool/ToolLayout";

type SqlDialect = "sql" | "mysql" | "postgresql";

/** SQL keywords for uppercase transformation */
const SQL_KEYWORDS = new Set([
  "SELECT", "FROM", "WHERE", "AND", "OR", "NOT", "IN", "IS", "NULL",
  "INSERT", "INTO", "VALUES", "UPDATE", "SET", "DELETE", "CREATE",
  "TABLE", "ALTER", "DROP", "INDEX", "VIEW", "JOIN", "INNER", "LEFT",
  "RIGHT", "OUTER", "ON", "AS", "GROUP", "BY", "ORDER", "ASC", "DESC",
  "HAVING", "LIMIT", "OFFSET", "UNION", "ALL", "DISTINCT", "BETWEEN",
  "LIKE", "EXISTS", "CASE", "WHEN", "THEN", "ELSE", "END", "COUNT",
  "SUM", "AVG", "MIN", "MAX", "PRIMARY", "KEY", "FOREIGN", "REFERENCES",
  "CONSTRAINT", "DEFAULT", "CHECK", "UNIQUE", "IF", "BEGIN", "COMMIT",
  "ROLLBACK", "TRANSACTION", "GRANT", "REVOKE", "WITH", "RECURSIVE",
  "OVER", "PARTITION", "ROW_NUMBER", "RANK", "DENSE_RANK", "USING",
  "NATURAL", "CROSS", "FULL", "FETCH", "NEXT", "ROWS", "ONLY",
  "RETURNING", "RETURN", "DECLARE", "FUNCTION", "PROCEDURE", "TRIGGER",
]);

/** Simple SQL formatter — keyword-based line breaking and indentation */
function formatSql(sql: string, indentSize: number, uppercase: boolean): string {
  if (!sql.trim()) return "";

  const indent = " ".repeat(indentSize);
  let indentLevel = 0;

  // Normalize whitespace
  let normalized = sql.replace(/\s+/g, " ").trim();

  // Apply uppercase to keywords if requested
  if (uppercase) {
    normalized = normalized.replace(/\b([a-zA-Z_]+)\b/g, (match) => {
      return SQL_KEYWORDS.has(match.toUpperCase()) ? match.toUpperCase() : match;
    });
  }

  // Major keywords that start a new line and increase indent
  const majorBreakBefore = new Set([
    "SELECT", "FROM", "WHERE", "AND", "OR", "ORDER BY", "GROUP BY",
    "HAVING", "LIMIT", "OFFSET", "INSERT INTO", "VALUES", "SET",
    "LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "OUTER JOIN", "CROSS JOIN",
    "NATURAL JOIN", "JOIN", "ON", "UNION", "UNION ALL",
  ]);

  // Keywords that decrease indent before them
  const decreaseBefore = new Set(["FROM", "WHERE", "ORDER BY", "GROUP BY", "HAVING", "LIMIT"]);

  // Build lines
  const lines: string[] = [];
  let currentLine = "";

  // Split on semicolons first for multi-statement
  const statements = normalized.split(/(?<=;)/);

  for (const stmt of statements) {
    if (!stmt.trim()) continue;

    // Tokenize by splitting around keywords
    const tokens = tokenize(stmt);

    for (const token of tokens) {
      const upperToken = token.toUpperCase().trim();

      if (decreaseBefore.has(upperToken) && indentLevel > 0) {
        indentLevel--;
      }

      if (currentLine && majorBreakBefore.has(upperToken)) {
        lines.push(indent.repeat(indentLevel) + currentLine.trim());
        if (upperToken === "SELECT" || upperToken === "FROM" ||
            upperToken.includes("JOIN") || upperToken === "WHERE" ||
            upperToken === "ORDER BY" || upperToken === "GROUP BY" ||
            upperToken === "HAVING") {
          indentLevel++;
        }
        currentLine = token + " ";
      } else if (upperToken === "(") {
        currentLine += token + " ";
      } else if (upperToken === ")") {
        currentLine = currentLine.trimEnd() + token + " ";
      } else if (upperToken === ",") {
        lines.push(indent.repeat(indentLevel) + currentLine.trimEnd() + ",");
        currentLine = "";
      } else if (upperToken === ";") {
        currentLine += ";";
        lines.push(indent.repeat(indentLevel) + currentLine.trim());
        currentLine = "";
        indentLevel = 0;
      } else {
        currentLine += token + " ";
      }
    }
  }

  if (currentLine.trim()) {
    lines.push(indent.repeat(indentLevel) + currentLine.trim());
  }

  return lines.join("\n");
}

/** Simple tokenizer that preserves quoted strings and parentheses */
function tokenize(sql: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let inQuote = false;
  let quoteChar = "";

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];

    if (inQuote) {
      current += ch;
      if (ch === quoteChar) {
        inQuote = false;
      }
      continue;
    }

    if (ch === "'" || ch === '"') {
      if (current.trim()) tokens.push(current.trim());
      current = ch;
      inQuote = true;
      quoteChar = ch;
      continue;
    }

    if (ch === "(" || ch === ")" || ch === ";" || ch === ",") {
      if (current.trim()) tokens.push(current.trim());
      tokens.push(ch);
      current = "";
      continue;
    }

    current += ch;
  }

  if (current.trim()) tokens.push(current.trim());

  return tokens;
}

/** Compress SQL — remove extra whitespace and newlines */
function compressSql(sql: string, uppercase: boolean): string {
  if (!sql.trim()) return "";
  let compressed = sql.replace(/\s+/g, " ").trim();

  if (uppercase) {
    compressed = compressed.replace(/\b([a-zA-Z_]+)\b/g, (match) => {
      return SQL_KEYWORDS.has(match.toUpperCase()) ? match.toUpperCase() : match;
    });
  }

  return compressed;
}

export function SqlFormatterTool() {
  const [input, setInput] = useState("");
  const [indentSize, setIndentSize] = useState(2);
  const [uppercase, setUppercase] = useState(true);
  const [mode, setMode] = useState<"format" | "compress">("format");
  const { copied, handleCopy } = useCopyState();

  const output = useMemo(() => {
    if (!input.trim()) return "";
    if (mode === "format") {
      return formatSql(input, indentSize, uppercase);
    }
    return compressSql(input, uppercase);
  }, [input, indentSize, uppercase, mode]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <Label className="text-sm">模式</Label>
          <Select value={mode} onValueChange={(v) => { if (v !== null) setMode(v as "format" | "compress"); }}>
            <SelectTrigger className="w-28 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="format">格式化</SelectItem>
              <SelectItem value="compress">压缩</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {mode === "format" && (
          <div className="space-y-1">
            <Label className="text-sm">缩进</Label>
            <Select value={String(indentSize)} onValueChange={(v) => { if (v !== null) setIndentSize(Number(v)); }}>
              <SelectTrigger className="w-24 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 空格</SelectItem>
                <SelectItem value="4">4 空格</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="sql-uppercase"
            checked={uppercase}
            onChange={(e) => setUppercase(e.target.checked)}
            className="rounded border-border"
          />
          <Label htmlFor="sql-uppercase" className="text-sm cursor-pointer">关键词大写</Label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>输入 SQL</Label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="粘贴或输入 SQL 语句..."
            className="min-h-[300px] text-sm font-mono"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>输出结果</Label>
            <Button variant="ghost" size="sm" onClick={() => handleCopy(output)} disabled={!output}>
              {copied ? "已复制" : "复制"}
            </Button>
          </div>
          <Textarea
            value={output}
            readOnly
            className="min-h-[300px] text-sm font-mono"
          />
        </div>
      </div>
    </div>
  );
}

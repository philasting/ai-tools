"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Copy, Check, RefreshCw, ShieldCheck, ShieldAlert, Shield } from "lucide-react";
import { copyToClipboard } from "@/components/tool/ToolLayout";

interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  count: number;
  excludeAmbiguous: boolean;
}

const CHARSETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
};
const AMBIGUOUS_CHARS = "Il1O0o";

function generatePassword(options: PasswordOptions): string {
  let charset = "";
  if (options.uppercase) charset += CHARSETS.uppercase;
  if (options.lowercase) charset += CHARSETS.lowercase;
  if (options.numbers) charset += CHARSETS.numbers;
  if (options.symbols) charset += CHARSETS.symbols;
  if (options.excludeAmbiguous) charset = charset.split("").filter((c) => !AMBIGUOUS_CHARS.includes(c)).join("");
  if (!charset) return "";
  const array = new Uint32Array(options.length);
  crypto.getRandomValues(array);
  return Array.from(array, (v) => charset[v % charset.length]).join("");
}

function calculateStrength(password: string) {
  if (!password) return { score: 0, label: "未设置", color: "text-muted-foreground", Icon: Shield };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  if (score <= 2) return { score: 1, label: "弱", color: "text-red-500", Icon: ShieldAlert };
  if (score <= 4) return { score: 2, label: "中等", color: "text-yellow-500", Icon: Shield };
  if (score <= 5) return { score: 3, label: "强", color: "text-green-500", Icon: ShieldCheck };
  return { score: 4, label: "非常强", color: "text-green-600", Icon: ShieldCheck };
}

export function PasswordGeneratorTool() {
  const [options, setOptions] = useState<PasswordOptions>({ length: 16, uppercase: true, lowercase: true, numbers: true, symbols: false, count: 1, excludeAmbiguous: false });
  const [passwords, setPasswords] = useState<string[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const generate = useCallback(() => {
    setPasswords(Array.from({ length: options.count }, () => generatePassword(options)));
  }, [options]);

  const strength = useMemo(() => calculateStrength(passwords[0] || ""), [passwords]);
  const { Icon: StrengthIcon } = strength;

  const handleCopy = async (text: string, key: string) => {
    await copyToClipboard(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const updateOption = <K extends keyof PasswordOptions>(key: K, value: PasswordOptions[K]) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>密码长度</Label>
            <span className="text-sm font-mono text-primary">{options.length}</span>
          </div>
          <Slider value={[options.length]} onValueChange={(v) => updateOption("length", Array.isArray(v) ? v[0] : v)} min={4} max={128} step={1} />
        </div>
        <div className="flex flex-wrap gap-4">
          {([["uppercase", "大写字母 A-Z"], ["lowercase", "小写字母 a-z"], ["numbers", "数字 0-9"], ["symbols", "特殊符号 !@#$%"], ["excludeAmbiguous", "排除易混淆字符"]] as const).map(([key, label]) => (
            <div key={key} className="flex items-center gap-2">
              <Switch id={key} checked={options[key]} onCheckedChange={(v) => updateOption(key, v)} />
              <Label htmlFor={key} className="text-sm">{label}</Label>
            </div>
          ))}
        </div>
        <div className="space-y-1">
          <Label className="text-sm">生成数量</Label>
          <Input type="number" value={options.count} onChange={(e) => updateOption("count", Math.max(1, Math.min(50, Number(e.target.value))))} min={1} max={50} className="w-24 h-8" />
        </div>
      </div>

      <Button onClick={generate} size="lg" className="w-full">
        <RefreshCw className="h-4 w-4 mr-2" /> 生成密码
      </Button>

      {passwords.length > 0 && (
        <div className="space-y-3">
          {passwords.length === 1 && (
            <Card>
              <CardContent className="p-3 flex items-center gap-2">
                <StrengthIcon className={`h-5 w-5 ${strength.color}`} />
                <span className={`text-sm font-medium ${strength.color}`}>密码强度: {strength.label}</span>
                <div className="flex-1" />
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div key={level} className={`h-2 w-8 rounded-full ${level <= strength.score ? strength.score <= 1 ? "bg-red-500" : strength.score <= 2 ? "bg-yellow-500" : "bg-green-500" : "bg-muted"}`} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          <div className="space-y-2">
            {passwords.map((pw, i) => (
              <Card key={i}>
                <CardContent className="p-3 flex items-center gap-3">
                  <code className="flex-1 text-sm font-mono break-all select-all">{pw}</code>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleCopy(pw, `pw-${i}`)}>
                    {copiedKey === `pw-${i}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

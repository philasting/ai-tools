"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { copyToClipboard } from "@/components/tool/ToolLayout";

interface RGB { r: number; g: number; b: number; }
interface HSL { h: number; s: number; l: number; }

function hexToRgb(hex: string): RGB | null {
  const match = hex.replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!match) return null;
  return { r: parseInt(match[1], 16), g: parseInt(match[2], 16), b: parseInt(match[3], 16) };
}

function rgbToHex(rgb: RGB): string {
  return `#${[rgb.r, rgb.g, rgb.b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`;
}

function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360, s = hsl.s / 100, l = hsl.l / 100;
  if (s === 0) return { r: Math.round(l * 255), g: Math.round(l * 255), b: Math.round(l * 255) };
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  };
}

export function ColorConverterTool() {
  const [hexInput, setHexInput] = useState("#3B82F6");
  const [rgbInput, setRgbInput] = useState({ r: 59, g: 130, b: 246 });
  const [hslInput, setHslInput] = useState({ h: 217, s: 91, l: 60 });
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const currentRgb = useMemo(() => hexToRgb(hexInput) || rgbInput, [hexInput, rgbInput]);
  const currentHsl = useMemo(() => rgbToHsl(currentRgb), [currentRgb]);
  const currentHex = useMemo(() => rgbToHex(currentRgb), [currentRgb]);

  const handleHexChange = (hex: string) => {
    setHexInput(hex);
    const rgb = hexToRgb(hex);
    if (rgb) {
      setRgbInput(rgb);
      setHslInput(rgbToHsl(rgb));
    }
  };

  const handleRgbChange = (field: keyof RGB, value: number) => {
    const newRgb = { ...rgbInput, [field]: Math.max(0, Math.min(255, value)) };
    setRgbInput(newRgb);
    setHexInput(rgbToHex(newRgb));
    setHslInput(rgbToHsl(newRgb));
  };

  const handleHslChange = (field: keyof HSL, value: number) => {
    const newHsl = { ...hslInput, [field]: value };
    setHslInput(newHsl);
    const rgb = hslToRgb(newHsl);
    setRgbInput(rgb);
    setHexInput(rgbToHex(rgb));
  };

  const handleNativePicker = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleHexChange(e.target.value);
  };

  const handleCopy = async (text: string, key: string) => {
    await copyToClipboard(text);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formats = [
    { label: "HEX", value: currentHex, key: "hex" },
    { label: "RGB", value: `rgb(${currentRgb.r}, ${currentRgb.g}, ${currentRgb.b})`, key: "rgb" },
    { label: "HSL", value: `hsl(${currentHsl.h}, ${currentHsl.s}%, ${currentHsl.l}%)`, key: "hsl" },
    { label: "RGBA", value: `rgba(${currentRgb.r}, ${currentRgb.g}, ${currentRgb.b}, 1)`, key: "rgba" },
  ];

  return (
    <div className="space-y-4">
      {/* Color preview + picker */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-xl border border-border" style={{ backgroundColor: currentHex }} />
          <input
            type="color"
            value={currentHex}
            onChange={handleNativePicker}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <div className="space-y-2 flex-1">
          {formats.map((fmt) => (
            <div key={fmt.key} className="flex items-center gap-2">
              <span className="text-xs font-semibold w-10 shrink-0">{fmt.label}</span>
              <code className="flex-1 text-xs font-mono bg-muted px-2 py-1 rounded">{fmt.value}</code>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleCopy(fmt.value, fmt.key)}>
                {copiedField === fmt.key ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* HEX input */}
      <div className="space-y-1">
        <Label className="text-sm">HEX</Label>
        <Input value={hexInput} onChange={(e) => handleHexChange(e.target.value)} className="font-mono" />
      </div>

      {/* RGB inputs */}
      <div className="space-y-1">
        <Label className="text-sm">RGB</Label>
        <div className="grid grid-cols-3 gap-2">
          {(["r", "g", "b"] as const).map((ch) => (
            <div key={ch}>
              <Label className="text-xs text-muted-foreground">{ch.toUpperCase()}</Label>
              <Input type="number" min={0} max={255} value={rgbInput[ch]} onChange={(e) => handleRgbChange(ch, Number(e.target.value))} className="font-mono" />
            </div>
          ))}
        </div>
      </div>

      {/* HSL inputs */}
      <div className="space-y-1">
        <Label className="text-sm">HSL</Label>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs text-muted-foreground">H (°)</Label>
            <Input type="number" min={0} max={360} value={hslInput.h} onChange={(e) => handleHslChange("h", Number(e.target.value))} className="font-mono" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">S (%)</Label>
            <Input type="number" min={0} max={100} value={hslInput.s} onChange={(e) => handleHslChange("s", Number(e.target.value))} className="font-mono" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">L (%)</Label>
            <Input type="number" min={0} max={100} value={hslInput.l} onChange={(e) => handleHslChange("l", Number(e.target.value))} className="font-mono" />
          </div>
        </div>
      </div>
    </div>
  );
}

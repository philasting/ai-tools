"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCopyState } from "@/components/tool/ToolLayout";

type UnitCategory = "length" | "weight" | "temperature" | "area" | "volume" | "speed";

interface UnitDef {
  name: string;
  toBase: (v: number) => number;
  fromBase: (v: number) => number;
}

/** Unit definitions with conversion to/from base unit */
const UNITS: Record<UnitCategory, { base: string; units: Record<string, UnitDef> }> = {
  length: {
    base: "米",
    units: {
      "千米": { name: "千米 (km)", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      "米": { name: "米 (m)", toBase: (v) => v, fromBase: (v) => v },
      "分米": { name: "分米 (dm)", toBase: (v) => v * 0.1, fromBase: (v) => v * 10 },
      "厘米": { name: "厘米 (cm)", toBase: (v) => v * 0.01, fromBase: (v) => v * 100 },
      "毫米": { name: "毫米 (mm)", toBase: (v) => v * 0.001, fromBase: (v) => v * 1000 },
      "英里": { name: "英里 (mi)", toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
      "码": { name: "码 (yd)", toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
      "英尺": { name: "英尺 (ft)", toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
      "英寸": { name: "英寸 (in)", toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
      "海里": { name: "海里 (nmi)", toBase: (v) => v * 1852, fromBase: (v) => v / 1852 },
      "里": { name: "里", toBase: (v) => v * 500, fromBase: (v) => v / 500 },
      "丈": { name: "丈", toBase: (v) => v * 10 / 3, fromBase: (v) => v * 3 / 10 },
      "尺": { name: "尺", toBase: (v) => v * 10 / 30, fromBase: (v) => v * 30 / 10 },
      "寸": { name: "寸", toBase: (v) => v * 10 / 300, fromBase: (v) => v * 300 / 10 },
    },
  },
  weight: {
    base: "千克",
    units: {
      "吨": { name: "吨 (t)", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      "千克": { name: "千克 (kg)", toBase: (v) => v, fromBase: (v) => v },
      "克": { name: "克 (g)", toBase: (v) => v * 0.001, fromBase: (v) => v * 1000 },
      "毫克": { name: "毫克 (mg)", toBase: (v) => v * 0.000001, fromBase: (v) => v * 1000000 },
      "磅": { name: "磅 (lb)", toBase: (v) => v * 0.453592, fromBase: (v) => v / 0.453592 },
      "盎司": { name: "盎司 (oz)", toBase: (v) => v * 0.0283495, fromBase: (v) => v / 0.0283495 },
      "斤": { name: "斤", toBase: (v) => v * 0.5, fromBase: (v) => v * 2 },
      "两": { name: "两", toBase: (v) => v * 0.05, fromBase: (v) => v * 20 },
    },
  },
  temperature: {
    base: "摄氏度",
    units: {
      "摄氏度": {
        name: "摄氏度 (°C)",
        toBase: (v) => v,
        fromBase: (v) => v,
      },
      "华氏度": {
        name: "华氏度 (°F)",
        toBase: (v) => (v - 32) * 5 / 9,
        fromBase: (v) => v * 9 / 5 + 32,
      },
      "开尔文": {
        name: "开尔文 (K)",
        toBase: (v) => v - 273.15,
        fromBase: (v) => v + 273.15,
      },
    },
  },
  area: {
    base: "平方米",
    units: {
      "平方千米": { name: "平方千米 (km²)", toBase: (v) => v * 1000000, fromBase: (v) => v / 1000000 },
      "公顷": { name: "公顷 (ha)", toBase: (v) => v * 10000, fromBase: (v) => v / 10000 },
      "亩": { name: "亩", toBase: (v) => v * 666.667, fromBase: (v) => v / 666.667 },
      "平方米": { name: "平方米 (m²)", toBase: (v) => v, fromBase: (v) => v },
      "平方分米": { name: "平方分米 (dm²)", toBase: (v) => v * 0.01, fromBase: (v) => v * 100 },
      "平方厘米": { name: "平方厘米 (cm²)", toBase: (v) => v * 0.0001, fromBase: (v) => v * 10000 },
      "平方英里": { name: "平方英里 (mi²)", toBase: (v) => v * 2589988.11, fromBase: (v) => v / 2589988.11 },
      "英亩": { name: "英亩 (ac)", toBase: (v) => v * 4046.856, fromBase: (v) => v / 4046.856 },
    },
  },
  volume: {
    base: "升",
    units: {
      "立方米": { name: "立方米 (m³)", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      "升": { name: "升 (L)", toBase: (v) => v, fromBase: (v) => v },
      "毫升": { name: "毫升 (mL)", toBase: (v) => v * 0.001, fromBase: (v) => v * 1000 },
      "加仑": { name: "加仑 (gal)", toBase: (v) => v * 3.78541, fromBase: (v) => v / 3.78541 },
      "品脱": { name: "品脱 (pt)", toBase: (v) => v * 0.473176, fromBase: (v) => v / 0.473176 },
      "杯": { name: "杯 (cup)", toBase: (v) => v * 0.236588, fromBase: (v) => v / 0.236588 },
    },
  },
  speed: {
    base: "米/秒",
    units: {
      "米/秒": { name: "米/秒 (m/s)", toBase: (v) => v, fromBase: (v) => v },
      "千米/时": { name: "千米/时 (km/h)", toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
      "英里/时": { name: "英里/时 (mph)", toBase: (v) => v * 0.44704, fromBase: (v) => v / 0.44704 },
      "节": { name: "节 (kn)", toBase: (v) => v * 0.514444, fromBase: (v) => v / 0.514444 },
      "马赫": { name: "马赫 (Ma)", toBase: (v) => v * 340.29, fromBase: (v) => v / 340.29 },
    },
  },
};

const CATEGORY_LABELS: Record<UnitCategory, string> = {
  length: "长度",
  weight: "重量",
  temperature: "温度",
  area: "面积",
  volume: "体积",
  speed: "速度",
};

export function UnitConverterTool() {
  const [category, setCategory] = useState<UnitCategory>("length");
  const [fromUnit, setFromUnit] = useState("米");
  const [toUnit, setToUnit] = useState("厘米");
  const [fromValue, setFromValue] = useState("1");
  const { copied, handleCopy } = useCopyState();

  const catData = UNITS[category];
  const unitKeys = Object.keys(catData.units);

  const result = useMemo(() => {
    const numVal = parseFloat(fromValue);
    if (isNaN(numVal)) return "";
    const fromDef = catData.units[fromUnit];
    const toDef = catData.units[toUnit];
    if (!fromDef || !toDef) return "";
    const baseValue = fromDef.toBase(numVal);
    const converted = toDef.fromBase(baseValue);
    // Format with appropriate precision
    if (Number.isInteger(converted)) return converted.toString();
    return converted.toPrecision(10).replace(/\.?0+$/, "");
  }, [fromValue, fromUnit, toUnit, catData]);

  const swapUnits = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    setFromValue(result || fromValue);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1">
        {(Object.keys(CATEGORY_LABELS) as UnitCategory[]).map((cat) => (
          <Button
            key={cat}
            variant={category === cat ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setCategory(cat);
              const keys = Object.keys(UNITS[cat].units);
              setFromUnit(keys[0]);
              setToUnit(keys[1] || keys[0]);
              setFromValue("1");
            }}
          >
            {CATEGORY_LABELS[cat]}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
        <div className="space-y-2">
          <Label>从</Label>
          <Select value={fromUnit} onValueChange={(v) => { if (v !== null) setFromUnit(v); }}>
            <SelectTrigger className="w-full h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {unitKeys.map((key) => (
                <SelectItem key={key} value={key}>{catData.units[key].name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            value={fromValue}
            onChange={(e) => setFromValue(e.target.value)}
            className="font-mono text-lg h-12"
          />
        </div>

        <Button variant="ghost" size="icon" onClick={swapUnits} className="hidden md:flex">
          ⇄
        </Button>

        <div className="space-y-2">
          <Label>到</Label>
          <Select value={toUnit} onValueChange={(v) => { if (v !== null) setToUnit(v); }}>
            <SelectTrigger className="w-full h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {unitKeys.map((key) => (
                <SelectItem key={key} value={key}>{catData.units[key].name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-12 px-3 rounded-md border bg-muted/50 flex items-center font-mono text-lg">
              {result || "—"}
            </div>
            <Button variant="ghost" size="sm" onClick={() => handleCopy(result)} disabled={!result}>
              复制
            </Button>
          </div>
        </div>
      </div>

      {/* All conversions from input */}
      {fromValue && result && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-2">全部换算</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
              {unitKeys.map((key) => {
                const def = catData.units[key];
                const baseVal = catData.units[fromUnit].toBase(parseFloat(fromValue));
                const val = def.fromBase(baseVal);
                const formatted = Number.isInteger(val) ? val.toString() : val.toPrecision(8).replace(/\.?0+$/, "");
                return (
                  <div key={key} className="flex justify-between p-2 rounded bg-muted/50">
                    <span className="text-muted-foreground">{def.name}</span>
                    <span className="font-mono">{formatted}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

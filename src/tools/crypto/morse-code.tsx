"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useCopyState } from "@/components/tool/ToolLayout";

type MorseMode = "encode" | "decode";

/** Morse code mapping */
const MORSE_MAP: Record<string, string> = {
  "A": ".-", "B": "-...", "C": "-.-.", "D": "-..", "E": ".", "F": "..-.",
  "G": "--.", "H": "....", "I": "..", "J": ".---", "K": "-.-", "L": ".-..",
  "M": "--", "N": "-.", "O": "---", "P": ".--.", "Q": "--.-", "R": ".-.",
  "S": "...", "T": "-", "U": "..-", "V": "...-", "W": ".--", "X": "-..-",
  "Y": "-.--", "Z": "--..",
  "0": "-----", "1": ".----", "2": "..---", "3": "...--", "4": "....-",
  "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.",
  ".": ".-.-.-", ",": "--..--", "?": "..--..", "!": "-.-.--", "/": "-..-.",
  "(": "-.--.", ")": "-.--.-", "&": ".-...", ":": "---...", ";": "-.-.-.",
  "=": "-...-", "+": ".-.-.", "-": "-....-", "_": "..--.-", "\"": ".-..-.",
  "$": "...-..-", "@": ".--.-.", "'": ".----.",
};

/** Reverse Morse mapping */
const REVERSE_MORSE: Record<string, string> = {};
for (const [char, code] of Object.entries(MORSE_MAP)) {
  REVERSE_MORSE[code] = char;
}

function textToMorse(text: string): string {
  return text
    .toUpperCase()
    .split("")
    .map((ch) => {
      if (ch === " ") return "/";
      return MORSE_MAP[ch] || ch;
    })
    .join(" ");
}

function morseToText(morse: string): string {
  return morse
    .split(" / ")
    .map((word) =>
      word
        .split(" ")
        .map((code) => REVERSE_MORSE[code] || code)
        .join("")
    )
    .join(" ");
}

/** Play Morse code using Web Audio API */
function playMorseCode(morse: string): void {
  const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  const ditDuration = 0.06; // seconds
  const dahDuration = ditDuration * 3;
  const symbolGap = ditDuration;
  const letterGap = ditDuration * 3;
  const wordGap = ditDuration * 7;
  const frequency = 700;

  let time = audioCtx.currentTime + 0.05;

  const symbols = morse.split("");
  for (let i = 0; i < symbols.length; i++) {
    const sym = symbols[i];
    if (sym === ".") {
      playBeep(audioCtx, frequency, time, ditDuration);
      time += ditDuration + symbolGap;
    } else if (sym === "-") {
      playBeep(audioCtx, frequency, time, dahDuration);
      time += dahDuration + symbolGap;
    } else if (sym === " ") {
      time += letterGap - symbolGap;
    } else if (sym === "/") {
      time += wordGap - symbolGap;
    }
  }
}

function playBeep(ctx: AudioContext, freq: number, startTime: number, duration: number): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = freq;
  osc.type = "sine";
  gain.gain.setValueAtTime(0.3, startTime);
  gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

export function MorseCodeTool() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<MorseMode>("encode");
  const { copied, handleCopy } = useCopyState();

  const output = useMemo(() => {
    if (!input) return "";
    if (mode === "encode") return textToMorse(input);
    return morseToText(input);
  }, [input, mode]);

  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        <Button variant={mode === "encode" ? "default" : "outline"} size="sm" onClick={() => setMode("encode")}>
          编码
        </Button>
        <Button variant={mode === "decode" ? "default" : "outline"} size="sm" onClick={() => setMode("decode")}>
          解码
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{mode === "encode" ? "输入文本" : "输入摩斯密码"}</Label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === "encode" ? "输入英文文本..." : "输入摩斯密码（用空格分隔，/ 分隔单词）..."}
            className="min-h-[200px] text-sm font-mono"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{mode === "encode" ? "摩斯密码" : "解码文本"}</Label>
            <div className="flex gap-1">
              {mode === "encode" && output && (
                <Button variant="ghost" size="sm" onClick={() => playMorseCode(output)}>
                  🔊 播放
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => handleCopy(output)} disabled={!output}>
                {copied ? "已复制" : "复制"}
              </Button>
            </div>
          </div>
          <Textarea value={output} readOnly className="min-h-[200px] text-sm font-mono" />
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3">摩斯密码对照表</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 text-sm">
            {Object.entries(MORSE_MAP).slice(0, 36).map(([char, code]) => (
              <div key={char} className="flex items-center gap-1.5 p-1.5 rounded bg-muted/50">
                <span className="font-semibold w-4 text-center">{char}</span>
                <span className="font-mono text-xs text-muted-foreground">{code}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

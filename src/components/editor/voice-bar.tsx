"use client";

import { Mic, MicOff, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { SpeechLang, VoiceTarget } from "@/lib/types";
import { useSpeech } from "@/hooks/use-speech";
import { cn } from "@/lib/utils";

const LANGS: { id: SpeechLang; label: string }[] = [
  { id: "ml-IN", label: "Malayalam" },
  { id: "en-IN", label: "English (India)" },
  { id: "en-US", label: "English (US)" },
];

const TARGETS: { id: VoiceTarget; label: string }[] = [
  { id: "current", label: "Current line" },
  { id: "dialogue", label: "New dialogue" },
  { id: "action", label: "New action" },
  { id: "scene", label: "New scene" },
];

export function VoiceBar({
  target,
  onTarget,
  onInsert,
}: {
  target: VoiceTarget;
  onTarget: (t: VoiceTarget) => void;
  onInsert: (text: string) => void;
}) {
  const speech = useSpeech();
  const live = [speech.finalText, speech.interim].filter(Boolean).join(" ");

  return (
    <div className="border-t bg-sidebar/80 px-3 py-2 backdrop-blur md:px-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={speech.status === "listening" ? "destructive" : "default"}
            onClick={() => (speech.status === "listening" ? speech.stop() : speech.start())}
            disabled={speech.status === "unsupported"}
          >
            {speech.status === "listening" ? <MicOff /> : <Mic />}
            {speech.status === "listening" ? "Stop" : "Dictate"}
          </Button>
          <select
            className="sf-select"
            value={speech.lang}
            onChange={(e) => speech.setLang(e.target.value as SpeechLang)}
            aria-label="Dictation language"
          >
            {LANGS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
          <select
            className="sf-select"
            value={target}
            onChange={(e) => onTarget(e.target.value as VoiceTarget)}
            aria-label="Insert voice as"
          >
            {TARGETS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <p
          className={cn(
            "min-h-6 flex-1 truncate font-[family-name:var(--font-ml)] text-sm",
            speech.status === "listening" ? "text-primary" : "text-muted-foreground"
          )}
        >
          {speech.status === "unsupported" &&
            "Voice dictation needs Chrome or Edge on this device. Type a take below."}
          {speech.status === "denied" && "Microphone permission was blocked."}
          {speech.status === "error" && "Dictation failed. Try again, or type the line."}
          {speech.status === "listening" && (live || "Listening… speak Malayalam or English.")}
          {speech.status === "idle" &&
            (live || "Speak a line, then insert it into the script.")}
        </p>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!live.trim()}
            onClick={() => {
              onInsert(live.trim());
              speech.clear();
            }}
          >
            <Plus />
            Insert
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={speech.clear}>
            Clear
          </Button>
        </div>
      </div>
      {speech.status === "unsupported" || speech.status === "denied" ? (
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const box = e.currentTarget.elements.namedItem("take") as HTMLTextAreaElement;
            const value = box.value.trim();
            if (!value) return;
            onInsert(value);
            box.value = "";
          }}
        >
          <Textarea
            name="take"
            rows={2}
            placeholder="Type or paste a spoken take…"
            className="font-[family-name:var(--font-ml)]"
          />
          <Button type="submit">Add</Button>
        </form>
      ) : null}
    </div>
  );
}

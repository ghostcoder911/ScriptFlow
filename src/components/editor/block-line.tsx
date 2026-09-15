"use client";

import { useEffect, useRef, useState } from "react";
import type { BlockType, TypingMode } from "@/lib/types";
import {
  commitLocalWord,
  fetchSuggestions,
  lastLatinWord,
  localPhrase,
  type TranslitSuggestion,
} from "@/lib/transliterate";
import { cn } from "@/lib/utils";

function caretOffset(el: HTMLElement): number {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return el.innerText.length;
  const range = sel.getRangeAt(0).cloneRange();
  range.selectNodeContents(el);
  range.setEnd(sel.getRangeAt(0).endContainer, sel.getRangeAt(0).endOffset);
  return range.toString().length;
}

function placeCaret(el: HTMLElement, offset: number) {
  const sel = window.getSelection();
  if (!sel) return;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let remaining = Math.max(0, offset);
  let node: Node | null = walker.nextNode();
  while (node) {
    const len = node.textContent?.length ?? 0;
    if (remaining <= len) {
      const range = document.createRange();
      range.setStart(node, remaining);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      return;
    }
    remaining -= len;
    node = walker.nextNode();
  }
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}

function shouldAutoConvert(type: BlockType, mode: TypingMode) {
  if (mode === "en" || mode === "ml") return false;
  if (type === "scene" || type === "transition" || type === "shot") return false;
  return true;
}

export function BlockLine({
  id,
  type,
  text,
  mode,
  active,
  sceneNumber,
  query,
  onFocus,
  onChange,
  onEnter,
  onTab,
  onBackspaceEmpty,
  onShiftEnter,
}: {
  id: string;
  type: BlockType;
  text: string;
  mode: TypingMode;
  active: boolean;
  sceneNumber?: number;
  query: string;
  onFocus: () => void;
  onChange: (text: string) => void;
  onEnter: () => void;
  onTab: (reverse: boolean) => void;
  onBackspaceEmpty: () => void;
  onShiftEnter: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [suggestion, setSuggestion] = useState<TranslitSuggestion | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.activeElement === el) return;
    if (el.innerText !== text) el.innerText = text;
  }, [text, id]);

  function emit(value: string) {
    onChange(value);
  }

  async function convertCommitted(raw: string) {
    if (!shouldAutoConvert(type, mode)) return;
    const mixed = mode === "mixed";
    const local = commitLocalWord(raw, mixed);
    const el = ref.current;
    if (local.suggestion && el) {
      el.innerText = local.text;
      emit(local.text);
      placeCaret(el, local.text.length);
    }
    const found = lastLatinWord(raw);
    const source = local.suggestion?.source || found?.word;
    if (!source) return;
    const current = ++requestId.current;
    const remote = await fetchSuggestions(source, mixed);
    if (current !== requestId.current) return;
    const el2 = ref.current;
    if (!el2) return;
    const latest = el2.innerText;
    const updated = latest.includes(local.suggestion?.primary || source)
      ? latest.replace(local.suggestion?.primary || source, remote.primary)
      : latest.replace(source, remote.primary);
    if (updated !== latest) {
      const offset = caretOffset(el2);
      el2.innerText = updated;
      emit(updated);
      placeCaret(el2, offset + (remote.primary.length - source.length));
    }
    if (remote.alternatives.length > 1) setSuggestion(remote);
  }

  async function convertWhole() {
    const el = ref.current;
    if (!el) return;
    const raw = el.innerText;
    const local = localPhrase(raw, mode === "mixed");
    el.innerText = local;
    emit(local);
    const remote = await fetchSuggestions(raw, mode === "mixed");
    if (ref.current) {
      ref.current.innerText = remote.primary;
      emit(remote.primary);
      placeCaret(ref.current, remote.primary.length);
    }
    if (remote.alternatives.length > 1) setSuggestion(remote);
  }

  function applyAlt(value: string) {
    const el = ref.current;
    if (!el || !suggestion) return;
    const next = el.innerText.replace(suggestion.primary, value);
    el.innerText = next;
    emit(next);
    placeCaret(el, next.length);
    setSuggestion({ ...suggestion, primary: value });
  }

  const hit = query.trim() && text.toLowerCase().includes(query.trim().toLowerCase());

  return (
    <div className="relative">
      <div
        ref={ref}
        data-block-id={id}
        data-type={type}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        role="textbox"
        aria-label={type}
        onFocus={onFocus}
        onClick={onFocus}
        onInput={(e) => emit(e.currentTarget.innerText)}
        onKeyDown={(e) => {
          if (suggestion && e.key >= "1" && e.key <= "9") {
            const idx = Number(e.key) - 1;
            const alt = suggestion.alternatives[idx];
            if (alt) {
              e.preventDefault();
              applyAlt(alt);
              setSuggestion(null);
              return;
            }
          }
          if (suggestion && e.key === "Escape") {
            e.preventDefault();
            setSuggestion(null);
            return;
          }
          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "m") {
            e.preventDefault();
            void convertWhole();
            return;
          }
          if (e.key === "Tab") {
            e.preventDefault();
            onTab(e.shiftKey);
            return;
          }
          if (e.key === "Enter") {
            e.preventDefault();
            if (e.shiftKey) onShiftEnter();
            else onEnter();
            return;
          }
          if (e.key === "Backspace" && !e.currentTarget.innerText) {
            e.preventDefault();
            onBackspaceEmpty();
            return;
          }
          if (
            shouldAutoConvert(type, mode) &&
            (e.key === " " || [".", ",", "?", "!", ";", ":"].includes(e.key))
          ) {
            const el = e.currentTarget;
            window.setTimeout(() => {
              void convertCommitted(el.innerText);
            }, 0);
          }
        }}
        className={cn(
          "sf-block",
          active && "sf-block-active",
          hit && "sf-block-hit",
          type === "note" && "opacity-70 italic"
        )}
      />
      {type === "scene" && sceneNumber ? (
        <span className="sf-scene-num">{sceneNumber}.</span>
      ) : null}
      {suggestion && suggestion.alternatives.length > 1 ? (
        <div className="absolute left-1/2 z-20 mt-1 flex max-w-full -translate-x-1/2 flex-wrap gap-1 rounded-md border bg-popover px-2 py-1 text-xs shadow-lg">
          {suggestion.alternatives.slice(0, 6).map((alt, i) => (
            <button
              key={alt + i}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                applyAlt(alt);
                setSuggestion(null);
              }}
              className={cn(
                "rounded px-1.5 py-0.5 font-[family-name:var(--font-ml)] hover:bg-accent",
                alt === suggestion.primary && "bg-primary/15 text-primary"
              )}
            >
              <span className="mr-1 text-[10px] text-muted-foreground">{i + 1}</span>
              {alt}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Clapperboard,
  Download,
  FilePlus,
  Keyboard,
  LayoutGrid,
  List,
  Printer,
  Save,
  Search,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BlockLine } from "@/components/editor/block-line";
import { VoiceBar } from "@/components/editor/voice-bar";
import { Corkboard } from "@/components/corkboard/corkboard";
import { CharacterList, Reports } from "@/components/reports/reports";
import { useScript } from "@/hooks/use-script";
import {
  BLOCK_LABELS,
  type BlockType,
  type EditorView,
  type SceneCard,
  type ScriptBlock,
  type TypingMode,
  type VoiceTarget,
} from "@/lib/types";
import {
  NEXT_BLOCK,
  charactersIn,
  cycleType,
  estimatePages,
  formatForType,
  generateSceneCards,
  placeholderFor,
  sceneBlocks,
} from "@/lib/screenplay";
import { uid } from "@/lib/ids";
import { downloadText, fromFountain, toFdx, toFountain } from "@/lib/export";
import { fetchSuggestions } from "@/lib/transliterate";
import { cn } from "@/lib/utils";

const MODES: { id: TypingMode; label: string }[] = [
  { id: "translit", label: "Manglish → മലയാളം" },
  { id: "mixed", label: "Mixed EN + ML" },
  { id: "en", label: "English" },
  { id: "ml", label: "Malayalam" },
];

export function Workspace({ id }: { id: string }) {
  const { script, ready, dirty, update, saveNow, missing } = useScript(id);
  const [view, setView] = useState<EditorView>("script");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [findOpen, setFindOpen] = useState(false);
  const [keysOpen, setKeysOpen] = useState(false);
  const [voiceTarget, setVoiceTarget] = useState<VoiceTarget>("dialogue");
  const undoRef = useRef<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const resolvedActiveId = activeId ?? script?.blocks[0]?.id ?? null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveNow();
        toast.success("Saved on this device");
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setFindOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        const raw = undoRef.current.pop();
        if (!raw) return;
        const prev = JSON.parse(raw) as {
          blocks: ScriptBlock[];
          cards: NonNullable<typeof script>["cards"];
          titlePage: NonNullable<typeof script>["titlePage"];
        };
        update((s) => ({ ...s, ...prev }));
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        setKeysOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saveNow, update]);

  const scenes = useMemo(() => (script ? sceneBlocks(script.blocks) : []), [script]);
  const pages = script ? estimatePages(script.blocks) : 1;
  const active = script?.blocks.find((b) => b.id === resolvedActiveId);

  function snapshot() {
    if (!script) return;
    undoRef.current.push(JSON.stringify({ blocks: script.blocks, cards: script.cards, titlePage: script.titlePage }));
    if (undoRef.current.length > 80) undoRef.current.shift();
  }

  function patchBlocks(mutator: (blocks: ScriptBlock[]) => ScriptBlock[]) {
    snapshot();
    update((s) => ({ ...s, blocks: mutator(s.blocks) }));
  }

  function setBlockText(blockId: string, text: string) {
    update((s) => ({
      ...s,
      blocks: s.blocks.map((b) => (b.id === blockId ? { ...b, text } : b)),
    }));
  }

  function setType(blockId: string, type: BlockType) {
    snapshot();
    update((s) => ({
      ...s,
      blocks: s.blocks.map((b) =>
        b.id === blockId ? { ...b, type, text: formatForType(type, b.text) } : b
      ),
    }));
  }

  function insertAfter(blockId: string, type: BlockType, text = "") {
    const block: ScriptBlock = { id: uid("b"), type, text };
    patchBlocks((blocks) => {
      const i = blocks.findIndex((b) => b.id === blockId);
      const next = [...blocks];
      next.splice(i + 1, 0, block);
      return next;
    });
    setActiveId(block.id);
    queueMicrotask(() => {
      document.querySelector<HTMLElement>(`[data-block-id="${block.id}"]`)?.focus();
    });
  }

  function removeBlock(blockId: string) {
    if (!script || script.blocks.length <= 1) return;
    const i = script.blocks.findIndex((b) => b.id === blockId);
    const fallback = script.blocks[i - 1] || script.blocks[i + 1];
    patchBlocks((blocks) => blocks.filter((b) => b.id !== blockId));
    setActiveId(fallback?.id ?? null);
  }

  function insertVoice(text: string) {
    if (!script) return;
    const current = script.blocks.find((b) => b.id === resolvedActiveId) || script.blocks.at(-1);
    if (!current) return;
    if (voiceTarget === "current") {
      setBlockText(current.id, `${current.text ? current.text + " " : ""}${text}`);
      return;
    }
    if (voiceTarget === "dialogue") {
      const lastChar =
        [...script.blocks].reverse().find((b) => b.type === "character")?.text || "CHARACTER";
      const char: ScriptBlock = { id: uid("b"), type: "character", text: lastChar };
      const line: ScriptBlock = { id: uid("b"), type: "dialogue", text };
      patchBlocks((blocks) => {
        const i = blocks.findIndex((b) => b.id === current.id);
        const next = [...blocks];
        next.splice(i + 1, 0, char, line);
        return next;
      });
      setActiveId(line.id);
      return;
    }
    const type: BlockType = voiceTarget === "scene" ? "scene" : "action";
    insertAfter(current.id, type, voiceTarget === "scene" ? text.toUpperCase() : text);
  }

  function insertCard(card: SceneCard) {
    const heading: ScriptBlock = {
      id: uid("b"),
      type: "scene",
      text: (card.heading || "INT. LOCATION - DAY").toUpperCase(),
    };
    const action: ScriptBlock = { id: uid("b"), type: "action", text: card.synopsis };
    snapshot();
    update((s) => ({ ...s, blocks: [...s.blocks, heading, ...(card.synopsis ? [action] : [])] }));
    setView("script");
    setActiveId(heading.id);
    toast.success("Scene dropped into the script");
  }

  async function convertActive() {
    if (!active) return;
    const remote = await fetchSuggestions(active.text, script?.typingMode === "mixed");
    setBlockText(active.id, remote.primary);
    toast.success("Converted with Malayalam suggestions");
  }

  function exportFountain() {
    if (!script) return;
    downloadText(
      `${script.titlePage.title || "screenplay"}.fountain`,
      toFountain(script.titlePage, script.blocks),
      "text/plain;charset=utf-8"
    );
  }

  function exportFdx() {
    if (!script) return;
    downloadText(
      `${script.titlePage.title || "screenplay"}.fdx`,
      toFdx(script.titlePage, script.blocks),
      "text/xml;charset=utf-8"
    );
  }

  async function importFountain(file: File) {
    const source = await file.text();
    const parsed = fromFountain(source);
    snapshot();
    update((s) => ({
      ...s,
      titlePage: { ...s.titlePage, ...parsed.title },
      title: parsed.title.title || s.title,
      author: parsed.title.author || s.author,
      blocks: parsed.blocks.map((b) => ({ ...b, id: uid("b") })),
    }));
    toast.success("Fountain imported");
  }

  if (!ready) {
    return <div className="flex flex-1 items-center justify-center text-muted-foreground">Opening script…</div>;
  }
  if (missing || !script) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <p>That screenplay is not on this device.</p>
        <Button nativeButton={false} render={<Link href="/" />}>
          Back to library
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 flex flex-wrap items-center gap-2 border-b bg-background/90 px-3 py-2 backdrop-blur">
        <Link href="/" className="mr-1 flex items-center gap-2 pr-2">
          <Clapperboard className="size-4 text-primary" />
          <span className="font-heading text-sm font-semibold tracking-tight">
            Script<span className="text-primary">Flow</span>
          </span>
        </Link>
        <div className="flex rounded-lg bg-muted p-0.5">
          {(
            [
              ["script", "Script", List],
              ["cards", "Scene cards", LayoutGrid],
              ["report", "Reports", Clapperboard],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium",
                view === id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>
        <select
          className="sf-select"
          value={script.typingMode}
          onChange={(e) => update((s) => ({ ...s, typingMode: e.target.value as TypingMode }))}
        >
          {MODES.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
        <select
          className="sf-select"
          value={active?.type || "action"}
          onChange={(e) => active && setType(active.id, e.target.value as BlockType)}
        >
          {(Object.keys(BLOCK_LABELS) as BlockType[]).map((t) => (
            <option key={t} value={t}>
              {BLOCK_LABELS[t]}
            </option>
          ))}
        </select>
        <Button type="button" variant="outline" size="sm" onClick={convertActive} disabled={!active}>
          <Sparkles />
          Convert line
        </Button>
        <div className="ml-auto flex flex-wrap items-center gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={() => setFindOpen((v) => !v)}>
            <Search />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setKeysOpen(true)}>
            <Keyboard />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              saveNow();
              toast.success("Saved on this device");
            }}
          >
            <Save />
            {dirty ? "Save" : "Saved"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => window.print()}>
            <Printer />
            PDF
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={exportFountain}>
            <Download />
            Fountain
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={exportFdx}>
            FDX
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>
            Import
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".fountain,.txt"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void importFountain(file);
              e.currentTarget.value = "";
            }}
          />
        </div>
      </header>

      {findOpen ? (
        <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2">
          <Search className="size-4 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            placeholder="Find in script…"
            onChange={(e) => setQuery(e.target.value)}
            className="h-8"
          />
          <Button type="button" variant="ghost" size="sm" onClick={() => setFindOpen(false)}>
            Close
          </Button>
        </div>
      ) : null}

      {view === "script" ? (
        <div className="flex min-h-0 flex-1">
          <aside className="sf-aside hidden w-[240px] shrink-0 border-r md:block">
            <div className="flex items-center justify-between px-3 py-3">
              <h2 className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                Scenes
              </h2>
              <Button
                type="button"
                size="xs"
                variant="ghost"
                onClick={() => {
                  const last = script.blocks.at(-1);
                  if (last) insertAfter(last.id, "scene", "INT. LOCATION - DAY");
                }}
              >
                <FilePlus className="size-3.5" />
              </Button>
            </div>
            <nav className="space-y-0.5 px-2 pb-4">
              {scenes.length === 0 ? (
                <p className="px-2 text-xs text-muted-foreground">Add a scene heading to outline the film.</p>
              ) : (
                scenes.map((s) => (
                  <button
                    key={s.block.id}
                    type="button"
                    onClick={() => {
                      setActiveId(s.block.id);
                      document.querySelector<HTMLElement>(`[data-block-id="${s.block.id}"]`)?.focus();
                    }}
                    className={cn(
                      "flex w-full gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted",
                      resolvedActiveId === s.block.id && "bg-muted"
                    )}
                  >
                    <span className="font-mono text-muted-foreground">{s.index}</span>
                    <span className="line-clamp-2 font-[family-name:var(--font-script)] uppercase">
                      {s.block.text || "Untitled scene"}
                    </span>
                  </button>
                ))
              )}
            </nav>
            <div className="border-t px-3 py-3">
              <h2 className="mb-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                Characters
              </h2>
              <CharacterList blocks={script.blocks} />
            </div>
          </aside>

          <main className="sf-workspace min-w-0 flex-1 overflow-auto">
            <div className="sf-editor-wrap print:w-full print:max-w-none">
              <article className="sf-paper" id="paper">
                <div className="sf-page-no">{pages}</div>
                <section className="sf-title-page print:break-after-page">
                  <Input
                    value={script.titlePage.title}
                    placeholder="TITLE"
                    className="sf-title-input"
                    onChange={(e) =>
                      update((s) => ({
                        ...s,
                        title: e.target.value,
                        titlePage: { ...s.titlePage, title: e.target.value },
                      }))
                    }
                  />
                  <Input
                    value={script.titlePage.titleMl}
                    placeholder="മലയാളം ടൈറ്റിൽ"
                    className="sf-title-input-ml"
                    onChange={(e) =>
                      update((s) => ({
                        ...s,
                        titlePage: { ...s.titlePage, titleMl: e.target.value },
                      }))
                    }
                  />
                  <p className="mt-8 text-sm tracking-widest uppercase">Written by</p>
                  <Input
                    value={script.titlePage.author}
                    placeholder="Writer name"
                    className="sf-title-input-sm"
                    onChange={(e) =>
                      update((s) => ({
                        ...s,
                        author: e.target.value,
                        titlePage: { ...s.titlePage, author: e.target.value },
                      }))
                    }
                  />
                  <Input
                    value={script.titlePage.basedOn}
                    placeholder="Based on / based upon"
                    className="sf-title-input-sm mt-6"
                    onChange={(e) =>
                      update((s) => ({ ...s, titlePage: { ...s.titlePage, basedOn: e.target.value } }))
                    }
                  />
                  <Input
                    value={script.titlePage.draft}
                    placeholder="Draft"
                    className="sf-title-input-sm"
                    onChange={(e) =>
                      update((s) => ({ ...s, titlePage: { ...s.titlePage, draft: e.target.value } }))
                    }
                  />
                  <Input
                    value={script.titlePage.contact}
                    placeholder="Contact"
                    className="sf-title-input-sm mt-10"
                    onChange={(e) =>
                      update((s) => ({ ...s, titlePage: { ...s.titlePage, contact: e.target.value } }))
                    }
                  />
                </section>
                <div className="sf-script">
                  {script.blocks.map((block) => {
                    const scene = scenes.find((s) => s.block.id === block.id);
                    return (
                      <BlockLine
                        key={block.id}
                        id={block.id}
                        type={block.type}
                        text={block.text}
                        mode={script.typingMode}
                        active={block.id === resolvedActiveId}
                        sceneNumber={script.showSceneNumbers ? scene?.index : undefined}
                        query={query}
                        onFocus={() => setActiveId(block.id)}
                        onChange={(text) => setBlockText(block.id, text)}
                        onEnter={() => insertAfter(block.id, NEXT_BLOCK[block.type])}
                        onShiftEnter={() => insertAfter(block.id, block.type)}
                        onTab={(reverse) => setType(block.id, cycleType(block.type, reverse))}
                        onBackspaceEmpty={() => removeBlock(block.id)}
                      />
                    );
                  })}
                </div>
              </article>
            </div>
          </main>

          <aside className="sf-aside hidden w-[260px] shrink-0 border-l lg:block">
            <div className="space-y-4 p-4">
              <div>
                <h2 className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Elements
                </h2>
                <div className="mt-2 grid grid-cols-2 gap-1">
                  {(Object.keys(BLOCK_LABELS) as BlockType[]).map((t) => (
                    <Button
                      key={t}
                      type="button"
                      size="xs"
                      variant="outline"
                      onClick={() => {
                        const current = active || script.blocks.at(-1);
                        if (current) insertAfter(current.id, t, placeholderFor(t));
                      }}
                    >
                      {BLOCK_LABELS[t]}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="scene-nos" className="text-xs">
                  Scene numbers
                </Label>
                <Switch
                  id="scene-nos"
                  checked={script.showSceneNumbers}
                  onCheckedChange={(v) => update((s) => ({ ...s, showSceneNumbers: Boolean(v) }))}
                />
              </div>
              <div>
                <h2 className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Story notes
                </h2>
                <Textarea
                  className="mt-2 min-h-32 font-[family-name:var(--font-ml)]"
                  value={script.notes}
                  placeholder="Tone, motif, open questions…"
                  onChange={(e) => update((s) => ({ ...s, notes: e.target.value }))}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  update((s) => ({ ...s, cards: generateSceneCards(s.blocks) }));
                  setView("cards");
                }}
              >
                <LayoutGrid />
                Build scene cards
              </Button>
              <p className="text-xs leading-5 text-muted-foreground">
                Manglish mode converts each word as you type. Press Ctrl/Cmd+M to reconvert a whole
                line with Google-grade Malayalam suggestions. Prefix a word with \ to keep it
                English.
              </p>
            </div>
          </aside>
        </div>
      ) : null}

      {view === "cards" ? (
        <Corkboard
          cards={script.cards}
          blocks={script.blocks}
          mode={script.typingMode}
          onCards={(cards) => update((s) => ({ ...s, cards }))}
          onInsertScene={insertCard}
        />
      ) : null}

      {view === "report" ? <Reports blocks={script.blocks} /> : null}

      <div className="flex items-center justify-between border-t px-4 py-1.5 text-[11px] text-muted-foreground">
        <span>
          {scenes.length} scenes · {charactersIn(script.blocks).length} characters · ~{pages} pages
        </span>
        <span>{dirty ? "Saving…" : "All changes saved locally"}</span>
      </div>
      <VoiceBar target={voiceTarget} onTarget={setVoiceTarget} onInsert={insertVoice} />

      <Dialog open={keysOpen} onOpenChange={setKeysOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Writer shortcuts</DialogTitle>
            <DialogDescription>Final Draft-style element flow, plus Malayalam tools.</DialogDescription>
          </DialogHeader>
          <ul className="space-y-2 text-sm">
            <li>
              <kbd>Enter</kbd> next screenplay element
            </li>
            <li>
              <kbd>Shift+Enter</kbd> same element
            </li>
            <li>
              <kbd>Tab</kbd> / <kbd>Shift+Tab</kbd> cycle element type
            </li>
            <li>
              <kbd>Ctrl+M</kbd> convert line to Malayalam
            </li>
            <li>
              <kbd>1–6</kbd> pick a Malayalam suggestion
            </li>
            <li>
              <kbd>Ctrl+S</kbd> save · <kbd>Ctrl+F</kbd> find · <kbd>Ctrl+Z</kbd> undo
            </li>
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  );
}


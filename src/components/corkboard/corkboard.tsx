"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDownToLine, Plus, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CARD_COLORS, type SceneCard, type ScriptBlock, type TypingMode } from "@/lib/types";
import { generateSceneCards, mergeMissingCards } from "@/lib/screenplay";
import { uid } from "@/lib/ids";
import { commitLocalWord } from "@/lib/transliterate";
import { cn } from "@/lib/utils";

function SortableCard({
  card,
  index,
  mode,
  onChange,
  onDelete,
  onToScript,
}: {
  card: SceneCard;
  index: number;
  mode: TypingMode;
  onChange: (patch: Partial<SceneCard>) => void;
  onDelete: () => void;
  onToScript: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    borderTopColor: card.color,
  };

  const headingRef = useRef<HTMLDivElement>(null);
  const synRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (headingRef.current && document.activeElement !== headingRef.current) {
      headingRef.current.innerText = card.heading;
    }
  }, [card.heading]);
  useEffect(() => {
    if (synRef.current && document.activeElement !== synRef.current) {
      synRef.current.innerText = card.synopsis;
    }
  }, [card.synopsis]);

  function translitField(value: string) {
    if (mode !== "translit" && mode !== "mixed") return value;
    return commitLocalWord(value, mode === "mixed").text;
  }

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex min-h-[210px] flex-col rounded-lg border border-border/70 bg-[#fbfaf4] text-[#1a1814] shadow-lg",
        isDragging && "opacity-70"
      )}
    >
      <header className="flex items-start gap-2 px-3 pt-3">
        <button
          type="button"
          className="mt-1 cursor-grab text-[11px] font-bold text-neutral-500"
          {...attributes}
          {...listeners}
        >
          {index + 1}
        </button>
        <div
          ref={headingRef}
          className="min-h-10 flex-1 font-[family-name:var(--font-script)] text-[13px] font-bold uppercase outline-none"
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => onChange({ heading: e.currentTarget.innerText.toUpperCase() })}
          onKeyUp={(e) => {
            if (e.key === " " || [".", ",", "?", "!"].includes(e.key)) {
              e.currentTarget.innerText = translitField(e.currentTarget.innerText);
            }
          }}
        />
        <button type="button" className="text-neutral-400 hover:text-red-600" onClick={onDelete}>
          <Trash2 className="size-3.5" />
        </button>
      </header>
      <div
        ref={synRef}
        className="flex-1 px-3 py-2 font-[family-name:var(--font-ml)] text-[13px] leading-5 text-neutral-700 outline-none"
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => onChange({ synopsis: e.currentTarget.innerText })}
        onKeyUp={(e) => {
          if (e.key === " " || [".", ",", "?", "!"].includes(e.key)) {
            e.currentTarget.innerText = translitField(e.currentTarget.innerText);
          }
        }}
      />
      <footer className="flex items-center justify-between gap-2 border-t border-neutral-200 bg-neutral-50 px-3 py-2">
        <div className="flex gap-1">
          {CARD_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Color ${c}`}
              onClick={() => onChange({ color: c })}
              className={cn(
                "size-3.5 rounded-full border border-black/10",
                card.color === c && "ring-2 ring-neutral-800 ring-offset-1"
              )}
              style={{ background: c }}
            />
          ))}
        </div>
        <Button type="button" size="xs" variant="outline" onClick={onToScript}>
          <ArrowDownToLine />
          Script
        </Button>
      </footer>
    </article>
  );
}

export function Corkboard({
  cards,
  blocks,
  mode,
  onCards,
  onInsertScene,
}: {
  cards: SceneCard[];
  blocks: ScriptBlock[];
  mode: TypingMode;
  onCards: (cards: SceneCard[]) => void;
  onInsertScene: (card: SceneCard) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const ids = useMemo(() => cards.map((c) => c.id), [cards]);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = cards.findIndex((c) => c.id === active.id);
    const newIndex = cards.findIndex((c) => c.id === over.id);
    onCards(arrayMove(cards, oldIndex, newIndex));
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6">
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          onClick={() =>
            onCards([
              ...cards,
              {
                id: uid("c"),
                heading: "",
                synopsis: "",
                color: CARD_COLORS[cards.length % CARD_COLORS.length],
              },
            ])
          }
        >
          <Plus />
          New scene card
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => onCards(mergeMissingCards(cards, generateSceneCards(blocks)))}
        >
          <Sparkles />
          Add missing from script
        </Button>
        <Button type="button" variant="outline" onClick={() => onCards(generateSceneCards(blocks))}>
          Rebuild from script
        </Button>
        <p className="text-sm text-muted-foreground">
          Drag to reorder. Cards stay bilingual — Manglish converts here too.
        </p>
      </div>
      {cards.length === 0 ? (
        <div className="rounded-xl border border-dashed p-16 text-center text-muted-foreground">
          No scene cards yet. Generate them from the screenplay, or pin a blank card and outline the
          beat.
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={ids} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {cards.map((card, index) => (
                <SortableCard
                  key={card.id}
                  card={card}
                  index={index}
                  mode={mode}
                  onChange={(patch) =>
                    onCards(cards.map((c) => (c.id === card.id ? { ...c, ...patch } : c)))
                  }
                  onDelete={() => {
                    if (confirmId !== card.id) {
                      setConfirmId(card.id);
                      window.setTimeout(() => setConfirmId((id) => (id === card.id ? null : id)), 2500);
                      return;
                    }
                    onCards(cards.filter((c) => c.id !== card.id));
                    setConfirmId(null);
                  }}
                  onToScript={() => onInsertScene(card)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
      {confirmId ? (
        <p className="mt-3 text-xs text-muted-foreground">Click delete again to confirm.</p>
      ) : null}
    </div>
  );
}

"use client";

import type { ScriptBlock } from "@/lib/types";
import { charactersIn, estimateLines, estimatePages, locationsIn, parseSceneHeading, sceneBlocks } from "@/lib/screenplay";

function dialogueStats(blocks: ScriptBlock[]) {
  const map = new Map<string, { name: string; lines: number; words: number; scenes: Set<number> }>();
  let sceneNo = 0;
  let current = "";
  for (const b of blocks) {
    if (b.type === "scene") sceneNo += 1;
    if (b.type === "character") {
      current = b.text.replace(/\s*(\(|\/).*$/, "").trim() || b.text.trim();
    }
    if (b.type === "dialogue" && current) {
      const key = current.toUpperCase();
      const row = map.get(key) || { name: current, lines: 0, words: 0, scenes: new Set<number>() };
      row.lines += 1;
      row.words += b.text.trim().split(/\s+/).filter(Boolean).length;
      if (sceneNo) row.scenes.add(sceneNo);
      map.set(key, row);
    }
  }
  return [...map.values()].sort((a, b) => b.lines - a.lines);
}

export function Reports({ blocks }: { blocks: ScriptBlock[] }) {
  const scenes = sceneBlocks(blocks);
  const people = dialogueStats(blocks);
  const locs = locationsIn(blocks);
  const pages = estimatePages(blocks);

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-6 lg:grid-cols-2">
      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-heading text-base">Script report</h2>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Scenes</dt>
            <dd className="text-2xl font-semibold">{scenes.length}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Pages (est.)</dt>
            <dd className="text-2xl font-semibold">{pages}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Speaking characters</dt>
            <dd className="text-2xl font-semibold">{people.length}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Locations</dt>
            <dd className="text-2xl font-semibold">{locs.length}</dd>
          </div>
        </dl>
      </section>
      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-heading text-base">Locations</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {locs.length === 0 ? (
            <li className="text-muted-foreground">No scene headings yet.</li>
          ) : (
            locs.map((loc) => (
              <li key={loc} className="rounded-md bg-muted/50 px-3 py-2 font-[family-name:var(--font-script)]">
                {loc}
              </li>
            ))
          )}
        </ul>
      </section>
      <section className="rounded-xl border bg-card p-5 lg:col-span-2">
        <h2 className="font-heading text-base">Character dialogue</h2>
        {people.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Add character cues to see a breakdown.</p>
        ) : (
          <table className="mt-3 w-full text-left text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="pb-2 font-medium">Character</th>
                <th className="pb-2 font-medium">Lines</th>
                <th className="pb-2 font-medium">Words</th>
                <th className="pb-2 font-medium">Scenes</th>
              </tr>
            </thead>
            <tbody>
              {people.map((p) => (
                <tr key={p.name} className="border-t">
                  <td className="py-2 font-[family-name:var(--font-ml)] font-medium">{p.name}</td>
                  <td>{p.lines}</td>
                  <td>{p.words}</td>
                  <td>{p.scenes.size}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      <section className="rounded-xl border bg-card p-5 lg:col-span-2">
        <h2 className="font-heading text-base">Scene list</h2>
        <ol className="mt-3 space-y-2">
          {scenes.map((s, i) => {
            const end = scenes[i + 1]?.start ?? blocks.length;
            const eighths = Math.max(1, Math.round((blocks.slice(s.start, end).reduce((n, b) => n + estimateLines(b), 0) / 55) * 8));
            const parsed = parseSceneHeading(s.block.text);
            return (
              <li key={s.block.id} className="flex gap-3 rounded-md bg-muted/40 px-3 py-2 text-sm">
                <span className="w-8 font-mono text-muted-foreground">{s.index}.</span>
                <div className="flex-1 font-[family-name:var(--font-script)]">
                  <p className="font-semibold uppercase">{s.block.text || "UNTITLED SCENE"}</p>
                  <p className="text-xs text-muted-foreground">
                    {parsed.intExt || "—"} · {eighths}/8 p.
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

export function CharacterList({ blocks }: { blocks: ScriptBlock[] }) {
  const names = charactersIn(blocks);
  if (!names.length) return <p className="px-3 text-xs text-muted-foreground">Characters appear as you write cues.</p>;
  return (
    <ul className="space-y-1 px-1">
      {names.map((n) => (
        <li key={n} className="rounded-md px-2 py-1.5 text-sm font-[family-name:var(--font-ml)] hover:bg-muted">
          {n}
        </li>
      ))}
    </ul>
  );
}

import type { BlockType, ScriptBlock, SceneCard, TitlePage } from "@/lib/types";
import { CARD_COLORS } from "@/lib/types";
import { uid } from "@/lib/ids";

export const NEXT_BLOCK: Record<BlockType, BlockType> = {
  scene: "action",
  action: "character",
  character: "dialogue",
  dialogue: "character",
  parenthetical: "dialogue",
  transition: "scene",
  shot: "action",
  note: "action",
};

export const TAB_CYCLE: BlockType[] = [
  "scene",
  "action",
  "character",
  "parenthetical",
  "dialogue",
  "transition",
  "shot",
  "note",
];

export function cycleType(current: BlockType, reverse = false): BlockType {
  const i = TAB_CYCLE.indexOf(current);
  const next = reverse
    ? (i - 1 + TAB_CYCLE.length) % TAB_CYCLE.length
    : (i + 1) % TAB_CYCLE.length;
  return TAB_CYCLE[next];
}

export function emptyTitlePage(): TitlePage {
  return {
    title: "",
    titleMl: "",
    author: "",
    contact: "",
    basedOn: "",
    draft: "First Draft",
  };
}

export function starterBlocks(): ScriptBlock[] {
  return [
    { id: uid("b"), type: "scene", text: "INT. LOCATION - DAY" },
    { id: uid("b"), type: "action", text: "" },
  ];
}

export function parseSceneHeading(text: string): {
  intExt: string;
  location: string;
  time: string;
} {
  const raw = text.trim();
  const match = raw.match(
    /^(INT\/EXT|I\/E|INT|EXT)\.?\s*(.+?)(?:\s*[-–—]\s*(.+))?$/i
  );
  if (!match) {
    return { intExt: "", location: raw, time: "" };
  }
  return {
    intExt: match[1].toUpperCase(),
    location: (match[2] || "").trim(),
    time: (match[3] || "").trim().toUpperCase(),
  };
}

export function sceneColor(heading: string): string {
  const { intExt, time } = parseSceneHeading(heading);
  const night = /NIGHT|DUSK|NIGHTFALL|ഇരുട്ട്|രാത്രി/.test(time);
  const interior = intExt.startsWith("INT");
  if (interior && night) return "#9b8cd9";
  if (!interior && night) return "#8cb6d9";
  if (interior) return "#e9b949";
  return "#8cd9a0";
}

export function estimateLines(block: ScriptBlock): number {
  const text = block.text.trim();
  if (!text) return 1;
  const len = text.length;
  switch (block.type) {
    case "scene":
    case "shot":
    case "transition":
    case "character":
      return 2;
    case "parenthetical":
      return 1;
    case "dialogue":
      return Math.max(1, Math.ceil(len / 36));
    case "note":
      return Math.max(1, Math.ceil(len / 55));
    default:
      return Math.max(1, Math.ceil(len / 58));
  }
}

export function estimatePages(blocks: ScriptBlock[]): number {
  const lines = blocks.reduce((sum, b) => sum + estimateLines(b), 0);
  return Math.max(1, Math.round((lines / 55) * 10) / 10);
}

export function sceneBlocks(blocks: ScriptBlock[]) {
  const scenes: { index: number; block: ScriptBlock; start: number }[] = [];
  blocks.forEach((block, start) => {
    if (block.type === "scene") {
      scenes.push({ index: scenes.length + 1, block, start });
    }
  });
  return scenes;
}

export function charactersIn(blocks: ScriptBlock[]): string[] {
  const names = new Map<string, string>();
  for (const b of blocks) {
    if (b.type !== "character") continue;
    const name = b.text.replace(/\s*(\(|\/).*$/, "").trim();
    if (!name) continue;
    const key = name.toUpperCase();
    if (!names.has(key)) names.set(key, name);
  }
  return [...names.values()];
}

export function locationsIn(blocks: ScriptBlock[]): string[] {
  const locs = new Map<string, string>();
  for (const b of blocks) {
    if (b.type !== "scene") continue;
    const { location } = parseSceneHeading(b.text);
    if (!location) continue;
    const key = location.toUpperCase();
    if (!locs.has(key)) locs.set(key, location);
  }
  return [...locs.values()];
}

export function generateSceneCards(blocks: ScriptBlock[]): SceneCard[] {
  const scenes = sceneBlocks(blocks);
  return scenes.map((scene, i) => {
    const end = scenes[i + 1]?.start ?? blocks.length;
    const slice = blocks.slice(scene.start + 1, end);
    const action = slice
      .filter((b) => b.type === "action")
      .map((b) => b.text.trim())
      .filter(Boolean)
      .join(" ");
    const people = charactersIn(slice);
    const synopsis = [action, people.length ? `Characters: ${people.join(", ")}` : ""]
      .filter(Boolean)
      .join("\n")
      .slice(0, 420);
    return {
      id: uid("c"),
      heading: scene.block.text.trim() || "INT. LOCATION - DAY",
      synopsis,
      color: sceneColor(scene.block.text) || CARD_COLORS[i % CARD_COLORS.length],
      sceneId: scene.block.id,
    };
  });
}

export function mergeMissingCards(
  existing: SceneCard[],
  generated: SceneCard[]
): SceneCard[] {
  const have = new Set(
    existing.map((c) => c.heading.trim().toUpperCase()).filter(Boolean)
  );
  const extra = generated.filter((c) => !have.has(c.heading.trim().toUpperCase()));
  return [...existing, ...extra];
}

export function formatForType(type: BlockType, text: string): string {
  if (type === "scene" || type === "character" || type === "transition" || type === "shot") {
    return text.replace(/[a-z]+/g, (chunk) =>
      /[\u0D00-\u0D7F]/.test(chunk) ? chunk : chunk.toUpperCase()
    );
  }
  return text;
}

export function placeholderFor(type: BlockType): string {
  switch (type) {
    case "scene":
      return "INT. LOCATION - DAY";
    case "character":
      return "CHARACTER";
    case "parenthetical":
      return "(beat)";
    case "dialogue":
      return "Dialogue…";
    case "transition":
      return "CUT TO:";
    case "shot":
      return "CLOSE ON";
    case "note":
      return "[[ note ]]";
    default:
      return "Action…";
  }
}

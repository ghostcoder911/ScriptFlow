import type { ScriptBlock, TitlePage } from "@/lib/types";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function toFountain(title: TitlePage, blocks: ScriptBlock[]): string {
  const header = [
    `Title: ${title.title || "Untitled"}`,
    title.titleMl ? `Title (Malayalam): ${title.titleMl}` : "",
    `Author: ${title.author || ""}`,
    title.draft ? `Draft: ${title.draft}` : "",
    title.contact ? `Contact: ${title.contact}` : "",
    title.basedOn ? `Credit: ${title.basedOn}` : "",
    "",
  ]
    .filter((line) => line !== "")
    .join("\n");

  const body = blocks
    .map((b) => {
      const txt = b.text.trim();
      if (!txt) return "";
      switch (b.type) {
        case "scene":
          return txt.toUpperCase();
        case "character":
          return txt.toUpperCase();
        case "parenthetical":
          return txt.startsWith("(") ? txt : `(${txt})`;
        case "dialogue":
          return txt;
        case "transition":
          return `> ${txt.toUpperCase()}`;
        case "shot":
          return txt.toUpperCase();
        case "note":
          return `[[${txt}]]`;
        default:
          return txt;
      }
    })
    .filter((line, i, arr) => line || arr[i - 1])
    .join("\n\n");

  return `${header}\n${body}\n`;
}

const FOUNTAIN_SCENE = /^(INT|EXT|INT\/EXT|I\/E)[.\s]/i;
const FOUNTAIN_TRANSITION = /^(CUT TO:|FADE IN:|FADE OUT\.|FADE TO:|DISSOLVE TO:|SMASH CUT TO:)>?$/i;

export function fromFountain(source: string): { title: Partial<TitlePage>; blocks: Omit<ScriptBlock, "id">[] } {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const title: Partial<TitlePage> = {};
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const meta = line.match(/^(Title|Author|Draft|Contact|Credit):\s*(.*)$/i);
    if (!meta) break;
    const key = meta[1].toLowerCase();
    const value = meta[2].trim();
    if (key === "title") title.title = value;
    if (key === "author") title.author = value;
    if (key === "draft") title.draft = value;
    if (key === "contact") title.contact = value;
    if (key === "credit") title.basedOn = value;
    i += 1;
  }
  while (i < lines.length && !lines[i].trim()) i += 1;

  const blocks: Omit<ScriptBlock, "id">[] = [];
  let pendingCharacter: string | null = null;

  const push = (type: ScriptBlock["type"], text: string) => {
    blocks.push({ type, text });
  };

  for (; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line) {
      pendingCharacter = null;
      continue;
    }
    if (line.startsWith("[[") && line.endsWith("]]")) {
      push("note", line.slice(2, -2).trim());
      continue;
    }
    if (line.startsWith(">")) {
      push("transition", line.replace(/^>\s*/, "").trim());
      continue;
    }
    if (FOUNTAIN_TRANSITION.test(line)) {
      push("transition", line);
      continue;
    }
    if (FOUNTAIN_SCENE.test(line)) {
      push("scene", line);
      pendingCharacter = null;
      continue;
    }
    if (line.startsWith("(") && line.endsWith(")")) {
      push("parenthetical", line);
      continue;
    }
    if (line === line.toUpperCase() && /[A-Z]/.test(line) && line.length < 40 && !line.endsWith(".")) {
      pendingCharacter = line;
      push("character", line);
      continue;
    }
    if (pendingCharacter) {
      push("dialogue", line);
      continue;
    }
    push("action", line);
  }

  return { title, blocks };
}

export function toFdx(title: TitlePage, blocks: ScriptBlock[]): string {
  const typeMap: Record<ScriptBlock["type"], string> = {
    scene: "Scene Heading",
    action: "Action",
    character: "Character",
    parenthetical: "Parenthetical",
    dialogue: "Dialogue",
    transition: "Transition",
    shot: "Shot",
    note: "Action",
  };
  const paragraphs = blocks
    .filter((b) => b.text.trim())
    .map((b) => {
      const t = escapeXml(b.text.trim());
      return `    <Paragraph Type="${typeMap[b.type]}"><Text>${t}</Text></Paragraph>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<FinalDraft DocumentType="Script" Template="No" Version="1">
  <Content>
    <Paragraph Type="Title Page Title"><Text>${escapeXml(title.title || "Untitled")}</Text></Paragraph>
    <Paragraph Type="Title Page Author"><Text>${escapeXml(title.author || "")}</Text></Paragraph>
${paragraphs}
  </Content>
</FinalDraft>
`;
}

export function downloadText(filename: string, contents: string, mime: string) {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

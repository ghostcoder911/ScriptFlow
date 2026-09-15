export const BLOCK_TYPES = [
  "scene",
  "action",
  "character",
  "parenthetical",
  "dialogue",
  "transition",
  "shot",
  "note",
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

export type TypingMode = "en" | "translit" | "ml" | "mixed";
export type SpeechLang = "en-IN" | "ml-IN" | "en-US";
export type EditorView = "script" | "cards" | "report";
export type VoiceTarget = "current" | "dialogue" | "action" | "scene";

export interface ScriptBlock {
  id: string;
  type: BlockType;
  text: string;
}

export interface SceneCard {
  id: string;
  heading: string;
  synopsis: string;
  color: string;
  sceneId?: string;
}

export interface TitlePage {
  title: string;
  titleMl: string;
  author: string;
  contact: string;
  basedOn: string;
  draft: string;
}

export interface ScriptProject {
  id: string;
  title: string;
  author: string;
  titlePage: TitlePage;
  blocks: ScriptBlock[];
  cards: SceneCard[];
  typingMode: TypingMode;
  notes: string;
  showSceneNumbers: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMeta {
  id: string;
  title: string;
  author: string;
  updatedAt: string;
  createdAt: string;
  sceneCount: number;
  pageEstimate: number;
}

export const CARD_COLORS = [
  "#e9b949",
  "#7fb7be",
  "#e88a8a",
  "#9b8cd9",
  "#8cd9a0",
  "#e0a85f",
  "#8cb6d9",
  "#c98cd9",
] as const;

export const BLOCK_LABELS: Record<BlockType, string> = {
  scene: "Scene Heading",
  action: "Action",
  character: "Character",
  parenthetical: "Parenthetical",
  dialogue: "Dialogue",
  transition: "Transition",
  shot: "Shot",
  note: "Note",
};

export const TYPING_MODE_LABELS: Record<TypingMode, string> = {
  en: "English",
  translit: "Manglish → മലയാളം",
  ml: "Malayalam (native)",
  mixed: "Mixed EN + ML",
};

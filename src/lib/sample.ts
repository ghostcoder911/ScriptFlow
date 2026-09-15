import type { ScriptProject } from "@/lib/types";
import { generateSceneCards } from "@/lib/screenplay";
import { uid } from "@/lib/ids";

export function createBlankProject(): ScriptProject {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: "Untitled Screenplay",
    author: "",
    titlePage: {
      title: "Untitled Screenplay",
      titleMl: "പേരിടാത്ത തിരക്കഥ",
      author: "",
      contact: "",
      basedOn: "",
      draft: "First Draft",
    },
    blocks: [
      { id: uid("b"), type: "scene", text: "INT. LOCATION - DAY" },
      { id: uid("b"), type: "action", text: "" },
    ],
    cards: [],
    typingMode: "translit",
    notes: "",
    showSceneNumbers: true,
    createdAt: now,
    updatedAt: now,
  };
}

export function createSampleProject(): ScriptProject {
  const now = new Date().toISOString();
  const blocks = [
    { type: "scene" as const, text: "INT. APARTMENT — NIGHT" },
    {
      type: "action" as const,
      text: "Rain needles the window. A cheap Android phone buzzes across a teak table, lighting ARUN's face in cold blue.",
    },
    { type: "character" as const, text: "ARUN" },
    { type: "parenthetical" as const, text: "(into phone, low)" },
    { type: "dialogue" as const, text: "Hello? ആരാണ് ഇപ്പോൾ വിളിക്കുന്നത്?" },
    { type: "character" as const, text: "MEERA (V.O.)" },
    { type: "dialogue" as const, text: "ഞാൻ മീര. Don't hang up. നീ പറഞ്ഞതല്ലേ — once. Only once." },
    { type: "character" as const, text: "ARUN" },
    { type: "dialogue" as const, text: "I told you not to call me again. ഇനി വിളിക്കരുത്." },
    { type: "transition" as const, text: "CUT TO:" },
    { type: "scene" as const, text: "EXT. KOCHI BACKWATERS — DAWN" },
    {
      type: "action" as const,
      text: "A wooden canoe slides through mist. MEERA sits in the prow, a film still of the two of them soaked in her fist.",
    },
    { type: "character" as const, text: "MEERA" },
    { type: "dialogue" as const, text: "He thinks the story is over. കഥ ഇവിടെ തീരുന്നില്ല." },
    { type: "character" as const, text: "BOATMAN" },
    { type: "dialogue" as const, text: "എവിടെയാ ഇറങ്ങേണ്ടത്, മോളേ?" },
    { type: "character" as const, text: "MEERA" },
    { type: "dialogue" as const, text: "Fort Kochi. The old warehouse. വേഗം." },
    { type: "scene" as const, text: "INT. WAREHOUSE SOUNDSTAGE — DAY" },
    {
      type: "action" as const,
      text: "A half-built film set: a living room with no fourth wall. ARUN stands under a practical lamp, script pages trembling in his hand.",
    },
    { type: "shot" as const, text: "CLOSE ON — THE SCRIPT" },
    {
      type: "action" as const,
      text: "The scene heading reads: INT. APARTMENT — NIGHT. His own name is printed in the character cue.",
    },
    { type: "character" as const, text: "DIRECTOR" },
    { type: "parenthetical" as const, text: "(from darkness)" },
    { type: "dialogue" as const, text: "From the top. And this time... അതു പോലെ തന്നെ. Don't act. Remember." },
    { type: "character" as const, text: "ARUN" },
    { type: "dialogue" as const, text: "What if I don't want to remember?" },
    { type: "character" as const, text: "DIRECTOR" },
    { type: "dialogue" as const, text: "Then the camera will. ക്യാമറ മറക്കില്ല." },
  ].map((b) => ({ id: uid("b"), ...b }));

  return {
    id: crypto.randomUUID(),
    title: "Call at Midnight",
    author: "ScriptFlow",
    titlePage: {
      title: "CALL AT MIDNIGHT",
      titleMl: "അർദ്ധരാത്രിയിലെ കോൾ",
      author: "Written by ScriptFlow",
      contact: "scriptflow.local",
      basedOn: "An original bilingual screenplay",
      draft: "First Draft",
    },
    blocks,
    cards: generateSceneCards(blocks),
    typingMode: "translit",
    notes:
      "Tone: humid neo-noir, Malayalam interiors, English when characters hide. Keep rain as a motif. Warehouse reveal is the act-one turn.",
    showSceneNumbers: true,
    createdAt: now,
    updatedAt: now,
  };
}

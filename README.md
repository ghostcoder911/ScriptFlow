# ScriptFlow

A professional bilingual screenplay studio for Malayalam and English. Type Manglish (`njan pokunnu`) and get accurate Malayalam (`ഞാൻ പോകുന്നു`), dictate lines in either language, and outline the film on scene cards — all in one writer-focused workspace.

ScriptFlow is the writing slice of a larger film-making toolkit (pre-production first). Drafts live on your machine; nothing is uploaded unless you export a file.

## Features

- **Industry screenplay format** — scene headings, action, character cues, parentheticals, dialogue, shots, transitions, and notes, with Final Draft-style Enter/Tab flow
- **Accurate Malayalam typing** — spoken Manglish is converted word-by-word using a Malayalam dictionary, a Mozhi-style engine, and Google Input Tools suggestions (with numbered alternatives)
- **Voice dictation** — speak Malayalam or English in Chrome/Edge and insert the take as dialogue, action, a scene heading, or the current line
- **Scene cards** — generate a corkboard from the script, drag to reorder, color beats, and drop a card back into the screenplay
- **Reports** — scene list with page-eighths, character dialogue counts, locations
- **Export** — Fountain, Final Draft `.fdx`, print/PDF
- **Import** — Fountain files
- **Local library** — multiple scripts, autosave, duplicate, undo

## Run locally

```bash
npm install
npm test
npm run dev
```

Open [http://127.0.0.1:43147](http://127.0.0.1:43147).

## Writing Malayalam

1. Set the language menu to **Manglish → മലയാളം**.
2. Type phonetically: `ente peru neeraj aanu` becomes **എന്റെ പേര് നീരജ് ആണ്**.
3. After each word, numbered suggestions appear if there is more than one spelling — press `1`–`6` to pick.
4. **Ctrl/Cmd+M** reconverts the whole line through the Malayalam suggestion engine.
5. Prefix a word with `\` to keep it in English (`\cut ` → `cut`).
6. Scene headings stay in English automatically so `INT. HOUSE - NIGHT` is not mangled.
7. **Mixed EN + ML** only converts words that look like Malayalam, so English dialogue can sit next to Malayalam.

Native Malayalam keyboard input also works (mode: Malayalam).

## Voice

The dictation bar at the bottom of the editor uses the browser Speech Recognition API.

- Choose **Malayalam** (`ml-IN`) or **English**.
- Choose where the take lands: current line, new dialogue, action, or scene.
- Chrome and Edge are required. Safari and Firefox do not expose this API; a typed-take box is shown instead.
- Microphone permission is required. This environment may not have a mic — on your laptop it will.

## Keyboard

| Shortcut | Action |
| --- | --- |
| `Enter` | Next screenplay element |
| `Shift+Enter` | Same element type |
| `Tab` / `Shift+Tab` | Cycle element type |
| `Ctrl/Cmd+M` | Convert line to Malayalam |
| `1`–`6` | Pick a suggestion |
| `Ctrl/Cmd+S` | Save |
| `Ctrl/Cmd+F` | Find |
| `Ctrl/Cmd+Z` | Undo |
| `Ctrl/Cmd+/` | Shortcut list |

## Stack

Next.js, TypeScript, Tailwind, shadcn/ui. No database and no login — scripts are stored in the browser.

This rebuild replaces the original HTML ScriptFlow prototype (`ghostcoder911/ScriptFlow`) with a full writing studio, keeping the bilingual intent and scene-card idea.

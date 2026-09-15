import { dictionaryLookup } from "./dictionary";
import { mozhiPhrase, mozhiWord } from "./mozhi";
import { shouldKeepLatin } from "./skip";

export interface TranslitSuggestion {
  source: string;
  primary: string;
  alternatives: string[];
}

const memoryCache = new Map<string, TranslitSuggestion>();

export function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const t = v.replace(/\u200c/g, "").trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

export function localWord(word: string, mixed = false): TranslitSuggestion {
  if (!word || shouldKeepLatin(word, mixed)) {
    return { source: word, primary: word, alternatives: [] };
  }
  const dict = dictionaryLookup(word);
  const phonetic = mozhiWord(word);
  const alternatives = unique([dict, phonetic, word].filter(Boolean) as string[]);
  return {
    source: word,
    primary: dict || phonetic || word,
    alternatives,
  };
}

export function localPhrase(text: string, mixed = false): string {
  return text.replace(/[A-Za-z]+/g, (word) => localWord(word, mixed).primary);
}

export function lastLatinWord(text: string): { word: string; start: number; end: number } | null {
  const match = text.match(/([A-Za-z]+)(\s|[.,?!;:…])$/);
  if (match && match.index !== undefined) {
    return {
      word: match[1],
      start: match.index,
      end: match.index + match[1].length,
    };
  }
  const trailing = text.match(/([A-Za-z]+)$/);
  if (trailing && trailing.index !== undefined) {
    return {
      word: trailing[1],
      start: trailing.index,
      end: trailing.index + trailing[1].length,
    };
  }
  return null;
}

export function commitLocalWord(
  text: string,
  mixed = false
): { text: string; suggestion: TranslitSuggestion | null } {
  if (/\\[A-Za-z]+(\s|[.,?!;:…])$/.test(text)) {
    return { text: text.replace(/\\([A-Za-z]+)(\s|[.,?!;:…])$/, "$1$2"), suggestion: null };
  }
  const found = lastLatinWord(text);
  if (!found) return { text, suggestion: null };
  const suggestion = localWord(found.word, mixed);
  if (suggestion.primary === found.word) return { text, suggestion: null };
  const next =
    text.slice(0, found.start) + suggestion.primary + text.slice(found.end);
  return { text: next, suggestion };
}

export function cacheGet(word: string): TranslitSuggestion | undefined {
  return memoryCache.get(word.toLowerCase());
}

export function cacheSet(word: string, suggestion: TranslitSuggestion) {
  memoryCache.set(word.toLowerCase(), suggestion);
}

export async function fetchSuggestions(
  text: string,
  mixed = false
): Promise<TranslitSuggestion> {
  const cached = cacheGet(text);
  if (cached) return cached;
  const local = /[A-Za-z]/.test(text) ? localPhrase(text, mixed) : text;
  try {
    const res = await fetch("/api/transliterate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      const fallback = { source: text, primary: local, alternatives: [local] };
      cacheSet(text, fallback);
      return fallback;
    }
    const data = (await res.json()) as { suggestions?: string[] };
    const suggestions = unique([...(data.suggestions || []), local]);
    const result = {
      source: text,
      primary: suggestions[0] || local,
      alternatives: suggestions,
    };
    cacheSet(text, result);
    return result;
  } catch {
    const fallback = { source: text, primary: local, alternatives: [local] };
    return fallback;
  }
}

export { mozhiPhrase };

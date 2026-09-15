/**
 * Word-level Mozhi-inspired Malayalam transliterator.
 * Google Input Tools is the primary converter; this is the offline fallback
 * and the instant preview while the network suggestion loads.
 */
const TOKENS: [string, string][] = [
  ["ksh", "ക്ഷ്"],
  ["nth", "ന്ത്"],
  ["ndh", "ന്ധ്"],
  ["ntr", "ന്ത്ര്"],
  ["thh", "ഥ്"],
  ["tth", "ത്ത്"],
  ["ddh", "ദ്ധ്"],
  ["ngh", "ങ്ങ്"],
  ["njh", "ഞ്ഞ്"],
  ["chh", "ഛ്"],
  ["shh", "ഷ്"],
  ["kh", "ഖ്"],
  ["gh", "ഘ്"],
  ["ch", "ച്"],
  ["jh", "ഝ്"],
  ["th", "ത്"],
  ["dh", "ധ്"],
  ["ph", "ഫ്"],
  ["bh", "ഭ്"],
  ["sh", "ശ്"],
  ["zh", "ഴ്"],
  ["ng", "ങ്"],
  ["nj", "ഞ്"],
  ["lh", "ൾ"],
  ["nh", "ൺ"],
  ["rh", "റ്"],
  ["ai", "ഐ"],
  ["au", "ഔ"],
  ["aa", "ആ"],
  ["ee", "ഈ"],
  ["ii", "ഈ"],
  ["oo", "ഊ"],
  ["uu", "ഊ"],
  ["ea", "ഏ"],
  ["oa", "ഓ"],
  ["ou", "ൗ"],
  ["tt", "ട്ട്"],
  ["dd", "ഡ്ഡ്"],
  ["nn", "ന്ന്"],
  ["mm", "മ്മ്"],
  ["ll", "ല്ല്"],
  ["kk", "ക്ക്"],
  ["pp", "പ്പ്"],
  ["cc", "ച്ച്"],
  ["bb", "ബ്ബ്"],
  ["ss", "സ്സ്"],
  ["rr", "റ്റ്"],
  ["k", "ക്"],
  ["g", "ഗ്"],
  ["c", "ച്"],
  ["j", "ജ്"],
  ["t", "റ്റ്"],
  ["d", "ദ്"],
  ["n", "ൻ"],
  ["p", "പ്"],
  ["b", "ബ്"],
  ["m", "മ്"],
  ["y", "യ്"],
  ["r", "ർ"],
  ["l", "ൽ"],
  ["v", "വ്"],
  ["w", "വ്"],
  ["s", "സ്"],
  ["h", "ഹ്"],
  ["f", "ഫ്"],
  ["q", "ക്ക്"],
  ["x", "ക്ഷ്"],
  ["z", "ശ്"],
  ["T", "ട്"],
  ["D", "ഡ്"],
  ["N", "ൺ"],
  ["L", "ൾ"],
  ["R", "റ്"],
  ["S", "ശ്"],
  ["H", "ഃ"],
  ["a", "അ"],
  ["A", "ആ"],
  ["i", "ഇ"],
  ["I", "ഈ"],
  ["u", "ഉ"],
  ["U", "ഊ"],
  ["e", "എ"],
  ["E", "ഏ"],
  ["o", "ഒ"],
  ["O", "ഓ"],
];

const VOWEL_SIGN: Record<string, string> = {
  അ: "",
  ആ: "ാ",
  ഇ: "ി",
  ഈ: "ീ",
  ഉ: "ു",
  ഊ: "ൂ",
  ഋ: "ൃ",
  എ: "െ",
  ഏ: "േ",
  ഐ: "ൈ",
  ഒ: "ൊ",
  ഓ: "ോ",
  ഔ: "ൗ",
};

const CHILLU_TO_CONS: Record<string, string> = {
  "ൻ": "ന്",
  "ൺ": "ണ്",
  "ൽ": "ല്",
  "ൾ": "ള്",
  "ർ": "ര്",
  "ൿ": "ക്",
};

const INDEP_VOWELS = new Set(Object.keys(VOWEL_SIGN));

function isConsonantForm(syll: string): boolean {
  return /[ക-ഹ]്$/.test(syll) || syll in CHILLU_TO_CONS;
}

function joinVowel(prev: string, vowel: string): string | null {
  const sign = VOWEL_SIGN[vowel];
  if (sign === undefined) return null;
  if (prev in CHILLU_TO_CONS) {
    const base = CHILLU_TO_CONS[prev];
    return base.slice(0, -1) + sign;
  }
  if (/[ക-ഹ]്$/.test(prev)) {
    return prev.slice(0, -1) + sign;
  }
  return null;
}

function attachConsonant(prev: string, cons: string): string | null {
  const expanded =
    prev in CHILLU_TO_CONS ? CHILLU_TO_CONS[prev] : /[ക-ഹ]്$/.test(prev) ? prev : null;
  if (!expanded) return null;
  const next = cons in CHILLU_TO_CONS ? CHILLU_TO_CONS[cons] : cons;
  if (!/[ക-ഹ]്$/.test(next)) return null;
  return expanded + next;
}

export function mozhiWord(input: string): string {
  if (!input) return input;
  const word = input;
  let i = 0;
  const out: string[] = [];

  while (i < word.length) {
    let matched: [string, string] | null = null;
    for (const token of TOKENS) {
      const [latin] = token;
      if (word.startsWith(latin, i)) {
        matched = token;
        break;
      }
    }
    if (!matched) {
      out.push(word[i]);
      i += 1;
      continue;
    }
    const [latin, ml] = matched;
    i += latin.length;
    const prev = out[out.length - 1];

    if (INDEP_VOWELS.has(ml) && prev) {
      const joined = joinVowel(prev, ml);
      if (joined !== null) {
        out[out.length - 1] = joined;
        continue;
      }
    }

    if (prev && isConsonantForm(ml)) {
      const cluster = attachConsonant(prev, ml);
      if (cluster) {
        out[out.length - 1] = cluster;
        continue;
      }
    }

    out.push(ml);
  }

  return out.join("").replace(/്്/g, "്").replace(/മ്$/u, "ം");
}

export function mozhiPhrase(text: string): string {
  return text.replace(/[A-Za-z]+/g, (word) => mozhiWord(word));
}

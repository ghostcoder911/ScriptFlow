import assert from "node:assert/strict";
import test from "node:test";
import { dictionaryLookup } from "./dictionary.ts";
import { mozhiWord } from "./mozhi.ts";
import { shouldKeepLatin } from "./skip.ts";

function localWord(word: string, mixed = false): string {
  if (!word || shouldKeepLatin(word, mixed)) return word;
  return dictionaryLookup(word) || mozhiWord(word) || word;
}

function localPhrase(text: string, mixed = false): string {
  return text.replace(/[A-Za-z]+/g, (word) => localWord(word, mixed));
}

test("dictionary catches spoken Manglish shortcuts", () => {
  assert.equal(dictionaryLookup("njan"), "ഞാൻ");
  assert.equal(dictionaryLookup("ente"), "എന്റെ");
  assert.equal(dictionaryLookup("parayunnu"), "പറയുന്നു");
  assert.equal(dictionaryLookup("ippol"), "ഇപ്പോൾ");
  assert.equal(dictionaryLookup("namukku"), "നമുക്ക്");
});

test("phrase conversion uses dictionary for common speech", () => {
  assert.equal(localPhrase("njan ente peru neeraj aanu"), "ഞാൻ എന്റെ പേര് നീരജ് ആണ്");
});

test("screenplay jargon is not converted", () => {
  assert.equal(localWord("INT"), "INT");
  assert.equal(localWord("NIGHT"), "NIGHT");
  assert.equal(localPhrase("INT. LOCATION - DAY"), "INT. LOCATION - DAY");
});

test("mixed mode keeps common English", () => {
  assert.equal(localWord("the", true), "the");
  assert.equal(localWord("njan", true), "ഞാൻ");
});

test("mozhi forms chillu letters", () => {
  assert.equal(mozhiWord("avan"), "അവൻ");
  assert.equal(mozhiWord("aval"), "അവൽ");
  assert.equal(mozhiWord("samayam"), "സമയം");
});

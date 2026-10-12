import { describe, expect, it } from "vitest";

import { BANNED_WORDS_MAX } from "../constants/limits";
import { validateBannedWord } from "../validation/word-filter";

import {
  addBannedWord,
  normalizeBannedWord,
  removeBannedWord,
} from "./word-filter";

describe("normalizeBannedWord", () => {
  it("queda como la guarda el back: minusculas, sin espacios de mas, tildes intactas", () => {
    expect(normalizeBannedWord("  NO   Sirve ")).toBe("no sirve");
    expect(normalizeBannedWord("Pésimo")).toBe("pésimo");
  });
});

describe("addBannedWord y removeBannedWord", () => {
  it("agrega al final, normalizada, sin repetir y sin mutar", () => {
    const words = ["tonto"];
    expect(addBannedWord(words, " Feo ")).toEqual(["tonto", "feo"]);
    expect(addBannedWord(words, "TONTO")).toEqual(["tonto"]);
    expect(addBannedWord(words, "   ")).toEqual(["tonto"]);
    expect(words).toEqual(["tonto"]);
  });

  it("saca solo esa palabra", () => {
    expect(removeBannedWord(["a", "b", "c"], "b")).toEqual(["a", "c"]);
  });
});

describe("validateBannedWord", () => {
  it("acepta una palabra nueva", () => {
    expect(validateBannedWord("tonto", [])).toBeUndefined();
  });

  it("rechaza vacia, muy larga, repetida (normalizada) o si la lista esta llena", () => {
    expect(validateBannedWord("  ", [])).toMatch(/Escribí/);
    expect(validateBannedWord("a".repeat(51), [])).toMatch(/50/);
    expect(validateBannedWord("ñ".repeat(50), [])).toBeUndefined();
    expect(validateBannedWord(" TONTO", ["tonto"])).toMatch(/ya está/);
    const full = Array.from({ length: BANNED_WORDS_MAX }, (_, i) => `p${i}`);
    expect(validateBannedWord("otra", full)).toMatch(/100/);
  });
});

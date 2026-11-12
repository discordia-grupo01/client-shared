import { describe, expect, it } from "vitest";

import {
  CODE_HIGHLIGHT_MAX_LENGTH,
  highlightCode,
  isHighlightLanguage,
} from "./code-highlight";

const colored = (code: string, language: string) =>
  highlightCode(code, language)
    ?.filter((token) => token.kind !== null)
    .map((token) => `${token.kind}:${token.text}`);

describe("highlightCode", () => {
  it("marca palabras clave, strings, numeros y comentarios", () => {
    expect(colored('const a = "hola"; // saludo\nlet b = 42;', "js")).toEqual([
      "keyword:const",
      'string:"hola"',
      "comment:// saludo",
      "keyword:let",
      "number:42",
    ]);
  });

  it("el texto de los tokens arma el codigo original", () => {
    const code = "if (a < b && c > \"d\") { return 'x'; }";
    const tokens = highlightCode(code, "javascript") ?? [];
    expect(tokens.map((token) => token.text).join("")).toBe(code);
  });

  it("funciones y tipos", () => {
    expect(colored("def saludar(nombre):\n  pass", "python")).toEqual([
      "keyword:def",
      "function:saludar",
      "keyword:pass",
    ]);
    expect(colored("class Perro extends Animal {}", "ts")).toEqual([
      "keyword:class",
      "type:Perro",
      "keyword:extends",
      "type:Animal",
    ]);
  });

  it("lo de adentro de ${} en un template string no es string", () => {
    expect(colored("`hola ${nombre}`", "js")).toEqual([
      "string:`hola ",
      "string:`",
    ]);
  });

  it("acepta los nombres cortos y en mayusculas", () => {
    for (const name of [
      "js",
      "TS",
      "py",
      "c++",
      "c#",
      "sh",
      "html",
      "kt",
      "rs",
      "golang",
    ]) {
      expect(isHighlightLanguage(name)).toBe(true);
    }
  });

  it("un lenguaje que no esta soportado no se colorea", () => {
    expect(highlightCode("x = 1", "cobol")).toBeNull();
    expect(isHighlightLanguage("hola")).toBe(false);
  });

  it("un bloque demasiado largo no se colorea", () => {
    const code = "a".repeat(CODE_HIGHLIGHT_MAX_LENGTH + 1);
    expect(highlightCode(code, "js")).toBeNull();
  });
});

import { describe, expect, it } from "vitest";

import { splitHighlight } from "./search-highlight";

describe("splitHighlight", () => {
  it("marca cada aparicion sin distinguir mayusculas", () => {
    expect(splitHighlight("El Deploy y el deploy", "deploy")).toEqual([
      { text: "El ", isMatch: false },
      { text: "Deploy", isMatch: true },
      { text: " y el ", isMatch: false },
      { text: "deploy", isMatch: true },
    ]);
  });

  it("encuentra partes de palabras y escapa caracteres especiales", () => {
    expect(splitHighlight("redeployed", "eplo")).toEqual([
      { text: "red", isMatch: false },
      { text: "eplo", isMatch: true },
      { text: "yed", isMatch: false },
    ]);
    expect(splitHighlight("a.*b", ".*")).toEqual([
      { text: "a", isMatch: false },
      { text: ".*", isMatch: true },
      { text: "b", isMatch: false },
    ]);
  });

  it("sin termino devuelve el texto entero", () => {
    expect(splitHighlight("hola", "  ")).toEqual([
      { text: "hola", isMatch: false },
    ]);
    expect(splitHighlight("", "x")).toEqual([]);
  });
});

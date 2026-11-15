import { describe, expect, it } from "vitest";

import { normalizeVanityCode, validateVanityCode } from "./vanity";

const SERVERS_VANITY_RULE = /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/;

describe("validateVanityCode", () => {
  it("acepta lo que acepta servers", () => {
    for (const code of ["club-lectura", "abc", "a1b", "x".repeat(32)]) {
      expect(validateVanityCode(code)).toBeUndefined();
      expect(code).toMatch(SERVERS_VANITY_RULE);
    }
  });

  it("pasa a minúsculas y recorta antes de validar", () => {
    expect(normalizeVanityCode("  Club-Lectura ")).toBe("club-lectura");
    expect(validateVanityCode("  Club-Lectura ")).toBeUndefined();
  });

  it("rechaza caracteres fuera de la regla", () => {
    expect(validateVanityCode("club_lectura")).toBe(
      "Usá solo minúsculas, números y guiones.",
    );
    expect(validateVanityCode("club lectura")).toBe(
      "Usá solo minúsculas, números y guiones.",
    );
  });

  it("no deja un guion en las puntas", () => {
    expect(validateVanityCode("-club")).toBe(
      "No puede empezar ni terminar con guion.",
    );
    expect(validateVanityCode("club-")).toBe(
      "No puede empezar ni terminar con guion.",
    );
  });

  it("controla el largo", () => {
    expect(validateVanityCode("ab")).toBe(
      "Tiene que tener entre 3 y 32 caracteres.",
    );
    expect(validateVanityCode("x".repeat(33))).toBe(
      "Tiene que tener entre 3 y 32 caracteres.",
    );
  });

  it("pide algo si está vacío", () => {
    expect(validateVanityCode("   ")).toBe("Escribí el link que querés usar.");
  });

  it("todo lo que pasa cumple la regla de servers", () => {
    for (const code of ["a-b", "--", "a--b", "ñandu", "123", "a"]) {
      if (validateVanityCode(code) === undefined) {
        expect(normalizeVanityCode(code)).toMatch(SERVERS_VANITY_RULE);
      }
    }
  });
});

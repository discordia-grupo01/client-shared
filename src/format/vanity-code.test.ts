import { describe, expect, it } from "vitest";

import { VANITY_CODE_FALLBACK, vanitySlug } from "./vanity-code";

const SERVERS_VANITY_RULE = /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/;

describe("vanitySlug", () => {
  it("pasa el nombre a minúsculas, sin tildes y con guiones", () => {
    expect(vanitySlug("Club de Lectura")).toBe("club-de-lectura");
    expect(vanitySlug("Álgebra & Análisis")).toBe("algebra-analisis");
    expect(vanitySlug("  ¡Ñandú!  ")).toBe("nandu");
  });

  it("corta en 32 caracteres sin dejar un guion al final", () => {
    const slug = vanitySlug(`${"a".repeat(31)} b`);
    expect(slug).toBe("a".repeat(31));
    expect(slug).toMatch(SERVERS_VANITY_RULE);
  });

  it("usa el código de reserva si el nombre no deja uno válido", () => {
    expect(vanitySlug("!!")).toBe(VANITY_CODE_FALLBACK);
    expect(vanitySlug("Yo")).toBe(VANITY_CODE_FALLBACK);
    expect(VANITY_CODE_FALLBACK).toMatch(SERVERS_VANITY_RULE);
  });

  it("siempre cumple la regla de servers", () => {
    for (const name of ["Discordia", "IDS 2 · Grupo 1", "x", "a-b"]) {
      expect(vanitySlug(name)).toMatch(SERVERS_VANITY_RULE);
    }
  });
});

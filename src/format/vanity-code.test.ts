import { describe, expect, it } from "vitest";

import {
  displayInviteLink,
  VANITY_CODE_FALLBACK,
  vanityInviteLink,
  vanitySlug,
} from "./vanity-code";

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

describe("vanityInviteLink", () => {
  it("usa la misma ruta que las invitaciones", () => {
    expect(vanityInviteLink("club-lectura", "https://discordia.app/")).toBe(
      "https://discordia.app/invite/club-lectura",
    );
  });

  it("se muestra sin el protocolo", () => {
    expect(displayInviteLink("https://discordia.app/invite/club-lectura")).toBe(
      "discordia.app/invite/club-lectura",
    );
    expect(displayInviteLink("/invite/club-lectura")).toBe(
      "/invite/club-lectura",
    );
  });
});

import { describe, expect, it } from "vitest";

import { buildInviteLink, normalizeInviteCode } from "./invite-link";

describe("buildInviteLink", () => {
  it("arma el link absoluto con la base que le pasen", () => {
    expect(buildInviteLink("abc123", "https://discordia.app")).toBe(
      "https://discordia.app/invite/abc123",
    );
  });

  it("no duplica la barra cuando la base termina en /", () => {
    expect(buildInviteLink("abc123", "http://localhost:3000/")).toBe(
      "http://localhost:3000/invite/abc123",
    );
  });

  it("devuelve la ruta relativa cuando no hay base", () => {
    expect(buildInviteLink("abc123", null)).toBe("/invite/abc123");
  });
});

describe("normalizeInviteCode", () => {
  it("saca el código del final de un link", () => {
    expect(
      normalizeInviteCode("https://discordia.app/invite/xY7z2Qab_9kL"),
    ).toBe("xY7z2Qab_9kL");
    expect(normalizeInviteCode("discordia://invite/taller")).toBe("taller");
  });

  it("acepta URLs personalizadas de 3 a 32 caracteres", () => {
    expect(normalizeInviteCode("https://discordia.app/invite/abc")).toBe("abc");
    const long = "club-de-lectura-de-los-jueves-32";
    expect(long).toHaveLength(32);
    expect(normalizeInviteCode(`discordia://invite/${long}`)).toBe(long);
    expect(normalizeInviteCode(long)).toBe(long);
  });

  it("si no parece un código devuelve lo que entró, para que rechace el back", () => {
    expect(normalizeInviteCode(` ${"a".repeat(40)} `)).toBe("a".repeat(40));
  });
});

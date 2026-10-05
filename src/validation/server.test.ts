import { describe, expect, it } from "vitest";

import { matchesServerNameForDeletion, validateServerName } from "./server";

describe("validateServerName", () => {
  it("rechaza un nombre vacío", () => {
    expect(validateServerName("   ")).toBeDefined();
  });

  it("acepta un nombre válido", () => {
    expect(validateServerName("Discordia HQ")).toBeUndefined();
  });
});

describe("matchesServerNameForDeletion", () => {
  it("matchea cuando lo tipeado es exactamente el nombre del servidor", () => {
    expect(matchesServerNameForDeletion("Discordia HQ", "Discordia HQ")).toBe(
      true,
    );
  });

  it("recorta espacios alrededor de lo tipeado, no del nombre real", () => {
    expect(
      matchesServerNameForDeletion("Discordia HQ", "  Discordia HQ  "),
    ).toBe(true);
  });

  it("es sensible a mayúsculas, igual que el back", () => {
    expect(matchesServerNameForDeletion("Discordia HQ", "discordia hq")).toBe(
      false,
    );
  });

  it("no matchea un nombre parcial", () => {
    expect(matchesServerNameForDeletion("Discordia HQ", "Discordia")).toBe(
      false,
    );
  });

  it("no matchea un campo vacío", () => {
    expect(matchesServerNameForDeletion("Discordia HQ", "")).toBe(false);
  });
});

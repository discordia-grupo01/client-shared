import { describe, expect, it } from "vitest";

import { matchesSearch, normalizeSearchText } from "./search";

describe("normalizeSearchText", () => {
  it("saca tildes y mayusculas", () => {
    expect(normalizeSearchText("  Andrés ")).toBe("andres");
  });
});

describe("matchesSearch", () => {
  it("una busqueda vacia coincide con todo", () => {
    expect(matchesSearch("Nova", "")).toBe(true);
    expect(matchesSearch("Nova", "   ")).toBe(true);
  });

  it("busca por fragmento sin importar mayusculas ni tildes", () => {
    expect(matchesSearch("Andrés_99", "ANDRES")).toBe(true);
    expect(matchesSearch("Andrés_99", "res_9")).toBe(true);
  });

  it("no coincide si el fragmento no esta", () => {
    expect(matchesSearch("Nova", "luna")).toBe(false);
  });
});

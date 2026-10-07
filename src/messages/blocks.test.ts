import { describe, expect, it } from "vitest";

import { BLOCK_ERROR_MESSAGES, blockErrorFor } from "./blocks";
import { UNEXPECTED_ERROR_MESSAGE } from "./errors";

describe("blockErrorFor", () => {
  it("traduce cada codigo que devuelve messaging", () => {
    for (const [code, message] of Object.entries(BLOCK_ERROR_MESSAGES)) {
      expect(blockErrorFor(code)).toBe(message);
    }
  });

  it("cae al generico con un codigo desconocido o que no es texto", () => {
    expect(blockErrorFor("OTRA_COSA")).toBe(UNEXPECTED_ERROR_MESSAGE);
    expect(blockErrorFor(undefined)).toBe(UNEXPECTED_ERROR_MESSAGE);
    expect(blockErrorFor(404)).toBe(UNEXPECTED_ERROR_MESSAGE);
  });

  it("no confunde un codigo con una propiedad heredada del objeto", () => {
    expect(blockErrorFor("toString", "propio")).toBe("propio");
  });

  it("acepta un fallback propio", () => {
    expect(blockErrorFor("???", "propio")).toBe("propio");
  });
});

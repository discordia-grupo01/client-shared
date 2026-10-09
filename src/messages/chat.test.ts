import { describe, expect, it } from "vitest";

import { UNEXPECTED_ERROR_MESSAGE } from "./errors";
import { MESSAGE_ERROR_MESSAGES, messageErrorFor } from "./chat";

describe("messageErrorFor", () => {
  it("traduce cada codigo que devuelve messaging", () => {
    for (const code of Object.keys(MESSAGE_ERROR_MESSAGES)) {
      expect(messageErrorFor(code)).toBe(
        MESSAGE_ERROR_MESSAGES[code as keyof typeof MESSAGE_ERROR_MESSAGES],
      );
    }
  });

  it("MENTIONS_UNAVAILABLE explica que se puede reintentar", () => {
    expect(messageErrorFor("MENTIONS_UNAVAILABLE")).toContain(
      "Intentá de nuevo",
    );
  });

  it("el limite de largo aparece en el texto", () => {
    expect(messageErrorFor("MESSAGE_TOO_LONG")).toContain("2000");
  });

  it("cae al generico con un codigo desconocido o que no es texto", () => {
    expect(messageErrorFor("OTRA_COSA")).toBe(UNEXPECTED_ERROR_MESSAGE);
    expect(messageErrorFor(undefined)).toBe(UNEXPECTED_ERROR_MESSAGE);
    expect(messageErrorFor(404)).toBe(UNEXPECTED_ERROR_MESSAGE);
  });

  it("acepta un fallback propio", () => {
    expect(messageErrorFor("???", "propio")).toBe("propio");
  });
});

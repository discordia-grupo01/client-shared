import { describe, expect, it } from "vitest";

import { MAX_MESSAGE_LENGTH } from "../constants/limits";

import { validateMessageContent } from "./message";

describe("validateMessageContent", () => {
  it("acepta un mensaje normal", () => {
    expect(validateMessageContent("hola")).toBeUndefined();
  });

  it("rechaza un mensaje vacio o solo con espacios", () => {
    expect(validateMessageContent("")).toBeDefined();
    expect(validateMessageContent("   \n ")).toBeDefined();
  });

  it("cuenta runas, no unidades UTF-16", () => {
    expect(
      validateMessageContent("😀".repeat(MAX_MESSAGE_LENGTH)),
    ).toBeUndefined();
    expect(
      validateMessageContent("a".repeat(MAX_MESSAGE_LENGTH + 1)),
    ).toBeDefined();
  });
});

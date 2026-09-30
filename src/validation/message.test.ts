import { describe, expect, it } from "vitest";

import { MAX_MESSAGE_LENGTH } from "../constants/limits";

import { validateMentionEveryone, validateMessageContent } from "./message";

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

describe("validateMentionEveryone", () => {
  it("deja pasar un mensaje sin @everyone sin importar el permiso", () => {
    expect(validateMentionEveryone("hola a todos", false)).toBeUndefined();
  });

  it("deja pasar @everyone si el usuario tiene el permiso", () => {
    expect(validateMentionEveryone("@everyone hola", true)).toBeUndefined();
  });

  it("rechaza @everyone sin el permiso", () => {
    expect(validateMentionEveryone("@everyone hola", false)).toBeDefined();
  });

  it("rechaza @here sin el permiso", () => {
    expect(validateMentionEveryone("hola @here", false)).toBeDefined();
  });

  it("no confunde un mail con una mencion", () => {
    expect(
      validateMentionEveryone("escribime a everyone@test.com", false),
    ).toBeUndefined();
  });
});

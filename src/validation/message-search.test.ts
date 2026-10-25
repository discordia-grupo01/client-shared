import { describe, expect, it } from "vitest";

import {
  MESSAGE_SEARCH_EMPTY_QUERY,
  MESSAGE_SEARCH_TEXT_TOO_LONG,
} from "../messages/message-search";
import { messageSearchParams, validateMessageSearch } from "./message-search";

describe("validateMessageSearch", () => {
  it("pide texto o autor", () => {
    expect(validateMessageSearch({ text: "   ", authorId: null })).toBe(
      MESSAGE_SEARCH_EMPTY_QUERY,
    );
    expect(validateMessageSearch({ text: "", authorId: "u1" })).toBeUndefined();
    expect(
      validateMessageSearch({ text: "hola", authorId: null }),
    ).toBeUndefined();
  });

  it("corta en 100 caracteres, despues de recortar", () => {
    expect(
      validateMessageSearch({ text: ` ${"a".repeat(100)} `, authorId: null }),
    ).toBeUndefined();
    expect(
      validateMessageSearch({ text: "a".repeat(101), authorId: null }),
    ).toBe(MESSAGE_SEARCH_TEXT_TOO_LONG);
  });
});

describe("messageSearchParams", () => {
  it("manda solo lo que tiene valor", () => {
    expect(messageSearchParams({ text: " deploy ", authorId: null })).toEqual({
      q: "deploy",
      limit: "25",
    });
    expect(messageSearchParams({ text: "", authorId: "u1" }, "m20")).toEqual({
      author_id: "u1",
      before: "m20",
      limit: "25",
    });
  });
});

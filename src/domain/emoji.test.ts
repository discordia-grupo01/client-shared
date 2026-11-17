import { describe, expect, it } from "vitest";

import {
  emojiNameTaken,
  emojiSlotsLeft,
  hasEmojiSlots,
  type ServerEmoji,
  type ServerEmojiPage,
} from "./emoji";

const emoji = (name: string): ServerEmoji => ({
  id: `e-${name}`,
  server_id: "s1",
  name,
  animated: false,
  image_url: `/emojis/${name}.png`,
  created_by: "u1",
  created_at: "2026-11-03T12:00:00Z",
});

const page = (names: string[], maxEmojis: number): ServerEmojiPage => ({
  emojis: names.map(emoji),
  max_emojis: maxEmojis,
});

describe("lugares de emojis", () => {
  it("cuenta los que quedan contra el tope del back", () => {
    expect(emojiSlotsLeft(page(["festejo", "mate"], 50))).toBe(48);
    expect(hasEmojiSlots(page(["festejo"], 50))).toBe(true);
  });

  it("sin lugares no deja subir", () => {
    const full = page(["festejo", "mate"], 2);
    expect(emojiSlotsLeft(full)).toBe(0);
    expect(hasEmojiSlots(full)).toBe(false);
  });

  it("un servidor que bajo de nivel no queda en negativo", () => {
    const overflow = page(["a", "b", "c"], 2);
    expect(emojiSlotsLeft(overflow)).toBe(0);
    expect(hasEmojiSlots(overflow)).toBe(false);
  });
});

describe("emojiNameTaken", () => {
  const current = page(["festejo", "mate"], 50);

  it("no distingue mayusculas ni espacios de los bordes, igual que el back", () => {
    expect(emojiNameTaken(current, "Festejo")).toBe(true);
    expect(emojiNameTaken(current, "  mate  ")).toBe(true);
  });

  it("un nombre nuevo o vacio no esta tomado", () => {
    expect(emojiNameTaken(current, "asado")).toBe(false);
    expect(emojiNameTaken(current, "   ")).toBe(false);
  });
});

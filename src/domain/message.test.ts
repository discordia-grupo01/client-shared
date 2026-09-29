import { describe, expect, it } from "vitest";

import {
  type Message,
  type MessageReaction,
  startsMessageGroup,
  toggleReaction,
} from "./message";

function mensaje(cambios: Partial<Message> & { id: string }): Message {
  return {
    channel_id: "ch1",
    author_id: "u1",
    content: "hola",
    created_at: "2026-09-29T15:00:00Z",
    reactions: [],
    ...cambios,
  };
}

describe("startsMessageGroup", () => {
  it("el primer mensaje abre grupo", () => {
    expect(startsMessageGroup(undefined, mensaje({ id: "1" }))).toBe(true);
  });

  it("otro autor abre grupo", () => {
    const anterior = mensaje({ id: "1" });
    const actual = mensaje({ id: "2", author_id: "u2" });
    expect(startsMessageGroup(anterior, actual)).toBe(true);
  });

  it("el mismo autor dentro de la ventana sigue el grupo", () => {
    const anterior = mensaje({ id: "1" });
    const actual = mensaje({ id: "2", created_at: "2026-09-29T15:06:00Z" });
    expect(startsMessageGroup(anterior, actual)).toBe(false);
  });

  it("el mismo autor fuera de la ventana abre grupo", () => {
    const anterior = mensaje({ id: "1" });
    const actual = mensaje({ id: "2", created_at: "2026-09-29T15:08:00Z" });
    expect(startsMessageGroup(anterior, actual)).toBe(true);
  });
});

describe("toggleReaction", () => {
  const ajena: MessageReaction = {
    emoji: "🔥",
    count: 2,
    reacted_by_me: false,
  };

  it("agrega una reaccion nueva", () => {
    expect(toggleReaction([], "👍")).toEqual([
      { emoji: "👍", count: 1, reacted_by_me: true },
    ]);
  });

  it("suma al contador de una reaccion ajena", () => {
    expect(toggleReaction([ajena], "🔥")).toEqual([
      { emoji: "🔥", count: 3, reacted_by_me: true },
    ]);
  });

  it("resta si ya habia reaccionado", () => {
    const propia = { ...ajena, count: 3, reacted_by_me: true };
    expect(toggleReaction([propia], "🔥")).toEqual([ajena]);
  });

  it("saca la reaccion cuando queda en 0", () => {
    const sola = { emoji: "👍", count: 1, reacted_by_me: true };
    expect(toggleReaction([ajena, sola], "👍")).toEqual([ajena]);
  });

  it("no muta el array original", () => {
    const original = [ajena];
    toggleReaction(original, "🔥");
    expect(original).toEqual([ajena]);
  });
});

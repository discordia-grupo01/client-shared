import { describe, expect, it } from "vitest";

import {
  canDeleteMessage,
  canEditMessage,
  deleteMessage,
  editMessageContent,
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
    edited_at: null,
    deleted_at: null,
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

describe("canEditMessage", () => {
  it("el autor puede editar el suyo", () => {
    expect(canEditMessage(mensaje({ id: "1", author_id: "u1" }), "u1")).toBe(
      true,
    );
  });

  it("nadie mas puede editar un mensaje ajeno", () => {
    expect(canEditMessage(mensaje({ id: "1", author_id: "u1" }), "u2")).toBe(
      false,
    );
  });
});

describe("canDeleteMessage", () => {
  it("el autor puede borrar el suyo sin necesitar el permiso", () => {
    const msg = mensaje({ id: "1", author_id: "u1" });
    expect(canDeleteMessage(msg, "u1", false)).toBe(true);
  });

  it("sin autoria ni permiso no puede borrar uno ajeno", () => {
    const msg = mensaje({ id: "1", author_id: "u1" });
    expect(canDeleteMessage(msg, "u2", false)).toBe(false);
  });

  it("canManageMessages habilita borrar uno ajeno", () => {
    const msg = mensaje({ id: "1", author_id: "u1" });
    expect(canDeleteMessage(msg, "u2", true)).toBe(true);
  });
});

describe("editMessageContent", () => {
  it("actualiza el contenido y marca edited_at", () => {
    const msg = mensaje({ id: "1", content: "hola" });
    const editado = editMessageContent(msg, "chau", "2026-09-29T16:00:00Z");
    expect(editado.content).toBe("chau");
    expect(editado.edited_at).toBe("2026-09-29T16:00:00Z");
    expect(msg.edited_at).toBeNull();
  });
});

describe("deleteMessage", () => {
  it("vacia el contenido y marca deleted_at", () => {
    const msg = mensaje({ id: "1", content: "hola" });
    const borrado = deleteMessage(msg, "2026-09-29T16:00:00Z");
    expect(borrado.content).toBe("");
    expect(borrado.deleted_at).toBe("2026-09-29T16:00:00Z");
    expect(msg.deleted_at).toBeNull();
  });
});

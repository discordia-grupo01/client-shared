import { describe, expect, it } from "vitest";

import {
  canDeleteMessage,
  canEditMessage,
  editMessageContent,
  type Message,
  type MessageReaction,
  mergeMessages,
  removeMessages,
  startsMessageGroup,
  toggleReaction,
} from "./message";

function mensaje(cambios: Partial<Message> & { id: string }): Message {
  return {
    channel_id: "ch1",
    server_id: "s1",
    user_id: "u1",
    content: "hola",
    inserted_at: "2026-09-29T15:00:00Z",
    edited_at: null,
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
    const actual = mensaje({ id: "2", user_id: "u2" });
    expect(startsMessageGroup(anterior, actual)).toBe(true);
  });

  it("el mismo autor dentro de la ventana sigue el grupo", () => {
    const anterior = mensaje({ id: "1" });
    const actual = mensaje({ id: "2", inserted_at: "2026-09-29T15:06:00Z" });
    expect(startsMessageGroup(anterior, actual)).toBe(false);
  });

  it("el mismo autor fuera de la ventana abre grupo", () => {
    const anterior = mensaje({ id: "1" });
    const actual = mensaje({ id: "2", inserted_at: "2026-09-29T15:08:00Z" });
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
    expect(canEditMessage(mensaje({ id: "1", user_id: "u1" }), "u1")).toBe(
      true,
    );
  });

  it("nadie mas puede editar un mensaje ajeno", () => {
    expect(canEditMessage(mensaje({ id: "1", user_id: "u1" }), "u2")).toBe(
      false,
    );
  });
});

describe("canDeleteMessage", () => {
  it("el autor puede borrar el suyo sin necesitar el permiso", () => {
    const msg = mensaje({ id: "1", user_id: "u1" });
    expect(canDeleteMessage(msg, "u1", false)).toBe(true);
  });

  it("sin autoria ni permiso no puede borrar uno ajeno", () => {
    const msg = mensaje({ id: "1", user_id: "u1" });
    expect(canDeleteMessage(msg, "u2", false)).toBe(false);
  });

  it("canManageMessages habilita borrar uno ajeno", () => {
    const msg = mensaje({ id: "1", user_id: "u1" });
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

describe("removeMessages", () => {
  it("saca los mensajes eliminados sin mutar la lista", () => {
    const lista = [
      mensaje({ id: "1" }),
      mensaje({ id: "2" }),
      mensaje({ id: "3" }),
    ];
    const resultado = removeMessages(lista, ["1", "3"]);
    expect(resultado.map((m) => m.id)).toEqual(["2"]);
    expect(lista).toHaveLength(3);
  });

  it("devuelve la misma lista si ninguno estaba", () => {
    const lista = [mensaje({ id: "1" })];
    expect(removeMessages(lista, ["9"])).toBe(lista);
    expect(removeMessages(lista, [])).toBe(lista);
  });
});

describe("mergeMessages", () => {
  it("agrega mensajes nuevos de mas viejo a mas nuevo", () => {
    const viejo = mensaje({ id: "a", inserted_at: "2026-09-29T15:00:00Z" });
    const nuevo = mensaje({ id: "b", inserted_at: "2026-09-29T15:01:00Z" });

    const resultado = mergeMessages([nuevo], [viejo]);

    expect(resultado.map((m) => m.id)).toEqual(["a", "b"]);
  });

  it("no duplica un mensaje que ya estaba (historial + vivo + missed_messages)", () => {
    const actual = [mensaje({ id: "a" })];

    const resultado = mergeMessages(actual, [mensaje({ id: "a" })]);

    expect(resultado).toHaveLength(1);
  });

  it("devuelve la misma lista si no hay nada nuevo (evita re-render)", () => {
    const actual = [mensaje({ id: "a" })];

    expect(mergeMessages(actual, [mensaje({ id: "a" })])).toBe(actual);
    expect(mergeMessages(actual, [])).toBe(actual);
  });

  it("conserva el mensaje que ya habia, aunque el repetido traiga otra precision de fecha", () => {
    const delHistorial = mensaje({
      id: "a",
      inserted_at: "2026-09-29T15:00:00.789Z",
    });
    const envivo = mensaje({
      id: "a",
      inserted_at: "2026-09-29T15:00:00.789123Z",
    });

    const resultado = mergeMessages([delHistorial], [envivo]);

    expect(resultado[0]).toBe(delHistorial);
  });

  it("compara las fechas como fecha y no como texto", () => {
    const sinMicro = mensaje({
      id: "z",
      inserted_at: "2026-09-29T15:00:00.700Z",
    });
    const conMicro = mensaje({
      id: "a",
      inserted_at: "2026-09-29T15:00:00.789123Z",
    });

    const resultado = mergeMessages([conMicro], [sinMicro]);

    expect(resultado.map((m) => m.id)).toEqual(["z", "a"]);
  });

  it("a igual instante ordena por id para que el orden sea estable", () => {
    const b = mensaje({ id: "b" });
    const a = mensaje({ id: "a" });

    expect(mergeMessages([b], [a]).map((m) => m.id)).toEqual(["a", "b"]);
  });

  it("no muta la lista original", () => {
    const actual = [mensaje({ id: "b", inserted_at: "2026-09-29T15:01:00Z" })];
    const copia = [...actual];

    mergeMessages(actual, [mensaje({ id: "a" })]);

    expect(actual).toEqual(copia);
  });
});

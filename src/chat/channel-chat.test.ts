import { describe, expect, it, vi } from "vitest";

import type { Message } from "../domain/message";
import {
  catchUpMessages,
  chatStatusAfterConnectionLoss,
  chatStatusForLoadError,
  joinMessageChannel,
  type MessageChannelHandlers,
  NOT_FOUND_ATTEMPTS,
  pushMessageEvent,
  type RealtimeChannel,
} from "./channel-chat";

class FakePush {
  private hooks: Record<string, (response?: unknown) => void> = {};
  receive(status: string, callback: (response?: unknown) => void) {
    this.hooks[status] = callback;
    return this;
  }
  fire(status: string, response?: unknown) {
    this.hooks[status]?.(response);
  }
}

function createRoom() {
  const events: Record<string, (payload: unknown) => void> = {};
  const joinPush = new FakePush();
  const pushes: { event: string; payload: object; push: FakePush }[] = [];
  const room = {
    events,
    joinPush,
    pushes,
    errorHandler: null as null | (() => void),
    on: vi.fn((event: string, callback: (payload: unknown) => void) => {
      events[event] = callback;
    }),
    onError: vi.fn((callback: () => void) => {
      room.errorHandler = callback;
    }),
    join: vi.fn(() => joinPush),
    leave: vi.fn(),
    push: vi.fn((event: string, payload: object) => {
      const push = new FakePush();
      pushes.push({ event, payload, push });
      return push;
    }),
  };
  return room;
}

function message(id: string, insertedAt: string): Message {
  return {
    id,
    channel_id: "c1",
    server_id: "s1",
    user_id: "u1",
    content: id,
    inserted_at: insertedAt,
  };
}

const M1 = message("m1", "2026-10-01T12:00:00.000Z");
const M2 = message("m2", "2026-10-01T12:01:00.000Z");

function createHandlers() {
  let messages: Message[] = [];
  const handlers = {
    updateMessages: vi.fn((update: (current: Message[]) => Message[]) => {
      messages = update(messages);
    }),
    catchUp: vi.fn(),
    resync: vi.fn(),
    connectionLost: vi.fn(),
    joined: vi.fn(),
    rejected: vi.fn(),
  } satisfies MessageChannelHandlers;
  return { handlers, getMessages: () => messages };
}

describe("estados del chat", () => {
  it("un corte de conexion no pisa un estado terminal", () => {
    expect(chatStatusAfterConnectionLoss("ready")).toBe("reconnecting");
    expect(chatStatusAfterConnectionLoss("loading")).toBe("reconnecting");
    expect(chatStatusAfterConnectionLoss("forbidden")).toBe("forbidden");
    expect(chatStatusAfterConnectionLoss("notFound")).toBe("notFound");
    expect(chatStatusAfterConnectionLoss("sessionExpired")).toBe(
      "sessionExpired",
    );
  });

  it("traduce el codigo de un fallo de carga al estado del chat", () => {
    expect(chatStatusForLoadError("FORBIDDEN")).toBe("forbidden");
    expect(chatStatusForLoadError("CHANNEL_NOT_FOUND")).toBe("notFound");
    expect(chatStatusForLoadError("CHANNEL_NOT_TEXT")).toBe("notFound");
    expect(chatStatusForLoadError("INVALID_CURSOR")).toBe("error");
    expect(chatStatusForLoadError(undefined)).toBe("error");
  });
});

describe("catchUpMessages", () => {
  it("pide paginas con `after` hasta que no hay cursor", async () => {
    const fetchAfter = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, messages: [M1], nextCursor: "m1" })
      .mockResolvedValueOnce({ ok: true, messages: [M2], nextCursor: null });
    const onPage = vi.fn();

    await catchUpMessages(fetchAfter, "m0", onPage, () => false);

    expect(fetchAfter.mock.calls).toEqual([["m0"], ["m1"]]);
    expect(onPage.mock.calls).toEqual([[[M1]], [[M2]]]);
  });

  it("corta si falla una pagina o se cancela", async () => {
    const failing = vi.fn().mockResolvedValue({ ok: false, message: "x" });
    const onPage = vi.fn();
    await catchUpMessages(failing, "m0", onPage, () => false);
    expect(onPage).not.toHaveBeenCalled();

    const fetchAfter = vi
      .fn()
      .mockResolvedValue({ ok: true, messages: [M1], nextCursor: "m1" });
    await catchUpMessages(fetchAfter, "m0", onPage, () => true);
    expect(onPage).not.toHaveBeenCalled();
    expect(fetchAfter).toHaveBeenCalledTimes(1);
  });
});

describe("joinMessageChannel", () => {
  function join() {
    const room = createRoom();
    const joinParams = {};
    const { handlers, getMessages } = createHandlers();
    joinMessageChannel(
      room as unknown as RealtimeChannel,
      joinParams,
      handlers,
    );
    return { room, joinParams, handlers, getMessages };
  }

  it("aplica los eventos del canal a la lista de mensajes", () => {
    const { room, getMessages } = join();

    room.events.new_message(M2);
    room.events.new_message(M1);
    expect(getMessages().map((m) => m.id)).toEqual(["m1", "m2"]);

    room.events.message_updated({ ...M1, content: "editado" });
    expect(getMessages()[0].content).toBe("editado");

    room.events.message_deleted({ id: "m2" });
    expect(getMessages().map((m) => m.id)).toEqual(["m1"]);

    room.events.changed_messages({ messages: [], deleted_ids: ["m1"] });
    expect(getMessages()).toEqual([]);
  });

  it("missed_messages mezcla y sigue por REST si hay mas", () => {
    const { room, handlers, getMessages } = join();

    room.events.missed_messages({ messages: [M1], next_cursor: "m1" });

    expect(getMessages()).toEqual([M1]);
    expect(handlers.catchUp).toHaveBeenCalledWith("m1");
  });

  it("resync_required y los errores del canal se delegan", () => {
    const { room, handlers } = join();

    room.events.resync_required(undefined);
    room.errorHandler?.();

    expect(handlers.resync).toHaveBeenCalledTimes(1);
    expect(handlers.connectionLost).toHaveBeenCalledTimes(1);
  });

  it("al confirmar el join guarda changes_since y avisa si es el primero", () => {
    const { room, joinParams, handlers } = join();

    room.joinPush.fire("ok", { server_time: "t1" });
    room.joinPush.fire("ok", { server_time: "t2" });

    expect(joinParams).toEqual({ changes_since: "t2" });
    expect(handlers.joined.mock.calls).toEqual([[true], [false]]);
  });

  it("un join rechazado a proposito corta y avisa", () => {
    const { room, handlers } = join();

    room.joinPush.fire("error", { error: { code: "FORBIDDEN" } });

    expect(room.leave).toHaveBeenCalledTimes(1);
    expect(handlers.rejected).toHaveBeenCalledWith(
      "forbidden",
      expect.any(String),
    );
  });

  it("CHANNEL_NOT_FOUND se tolera hasta NOT_FOUND_ATTEMPTS intentos", () => {
    const { room, handlers } = join();
    const notFound = { error: { code: "CHANNEL_NOT_FOUND" } };

    for (let i = 1; i < NOT_FOUND_ATTEMPTS; i++) {
      room.joinPush.fire("error", notFound);
    }
    expect(handlers.rejected).not.toHaveBeenCalled();
    expect(room.leave).not.toHaveBeenCalled();

    room.joinPush.fire("error", notFound);
    expect(handlers.rejected).toHaveBeenCalledWith(
      "notFound",
      expect.any(String),
    );
  });

  it("un error sin codigo conocido o un timeout es un corte de conexion", () => {
    const { room, handlers } = join();

    room.joinPush.fire("error", { error: { code: "algo raro" } });
    room.joinPush.fire("timeout");

    expect(handlers.connectionLost).toHaveBeenCalledTimes(2);
    expect(room.leave).not.toHaveBeenCalled();
  });
});

describe("pushMessageEvent", () => {
  const options = { failedMessage: "fallo" };

  function push(status: "ready" | "reconnecting" = "ready", extra = {}) {
    const room = createRoom();
    const result = pushMessageEvent(
      room as unknown as RealtimeChannel,
      status,
      "new_message",
      { content: "hola" },
      { ...options, ...extra },
    );
    return { room, result };
  }

  it("no manda nada si el canal no esta unido", async () => {
    const { room, result } = push("reconnecting");

    expect(await result).toEqual({ ok: false, message: "fallo" });
    expect(room.push).not.toHaveBeenCalled();
    expect(await pushMessageEvent(null, "ready", "e", {}, options)).toEqual({
      ok: false,
      message: "fallo",
    });
  });

  it("resuelve ok y entrega la respuesta a onOk", async () => {
    const onOk = vi.fn();
    const { room, result } = push("ready", { onOk });

    expect(room.pushes[0].event).toBe("new_message");
    expect(room.pushes[0].payload).toEqual({ content: "hola" });
    room.pushes[0].push.fire("ok", { id: "m1" });

    expect(await result).toEqual({ ok: true });
    expect(onOk).toHaveBeenCalledWith({ id: "m1" });
  });

  it("traduce el codigo de error y avisa si el mensaje ya no existe", async () => {
    const onMessageNotFound = vi.fn();
    const { room, result } = push("ready", { onMessageNotFound });

    room.pushes[0].push.fire("error", { error: { code: "MESSAGE_NOT_FOUND" } });

    const resolved = await result;
    expect(resolved.ok).toBe(false);
    expect(resolved.ok === false && resolved.message).not.toBe("fallo");
    expect(onMessageNotFound).toHaveBeenCalledTimes(1);
  });

  it("un error desconocido o un timeout usa el mensaje de fallo", async () => {
    const unknown = push();
    unknown.room.pushes[0].push.fire("error", { error: { code: "???" } });
    expect(await unknown.result).toEqual({ ok: false, message: "fallo" });

    const timeout = push();
    timeout.room.pushes[0].push.fire("timeout");
    expect(await timeout.result).toEqual({ ok: false, message: "fallo" });
  });
});

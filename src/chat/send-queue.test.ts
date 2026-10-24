import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Message } from "../domain/message";
import type { MessageActionResult } from "./channel-chat";
import {
  createSendQueue,
  PENDING_TTL_MS,
  SEND_MAX_ATTEMPTS,
  SEND_SLOW_MS,
  type PendingMessage,
  withPendingMessages,
} from "./send-queue";

const OK: MessageActionResult = { ok: true };
const fail = (
  message = "No se pudo",
  retryable = true,
): MessageActionResult => ({ ok: false, message, retryable });

function setup(
  options: {
    ready?: boolean;
    initial?: PendingMessage[];
    now?: () => number;
  } = {},
) {
  let ready = options.ready ?? true;
  let counter = 0;
  const resolvers: ((result: MessageActionResult) => void)[] = [];
  const send = vi.fn(
    () =>
      new Promise<MessageActionResult>((resolve) => {
        resolvers.push(resolve);
      }),
  );
  const persisted: PendingMessage[][] = [];
  const queue = createSendQueue({
    send,
    isReady: () => ready,
    newId: () => `c${++counter}`,
    initial: options.initial,
    now: options.now,
    onPersist: (entries) => persisted.push([...entries]),
  });
  return {
    queue,
    send,
    resolvers,
    persisted,
    setReady(value: boolean) {
      ready = value;
    },
  };
}

const status = (queue: ReturnType<typeof createSendQueue>, index = 0) =>
  queue.getEntries()[index]?.status;

function msg(id: string, clientId?: string): Message {
  return {
    id,
    channel_id: "c1",
    server_id: "",
    user_id: "me",
    content: id,
    inserted_at: "2026-10-01T12:00:00.000Z",
    ...(clientId ? { client_id: clientId } : {}),
  };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("createSendQueue", () => {
  it("el mensaje queda enviando al instante y se manda con su client id", async () => {
    const { queue, send } = setup();

    queue.enqueue("hola");

    expect(send).toHaveBeenCalledWith("hola", "c1");
    expect(queue.getEntries()[0]).toMatchObject({
      clientId: "c1",
      content: "hola",
      status: "sending",
      attempts: 1,
    });
  });

  it("al confirmarse queda como confirmado y no se persiste", async () => {
    const { queue, resolvers, persisted } = setup();
    queue.enqueue("hola");

    await vi.advanceTimersByTimeAsync(0);
    resolvers[0](OK);
    await vi.advanceTimersByTimeAsync(0);

    expect(queue.getEntries()[0].acked).toBe(true);
    expect(persisted.at(-1)).toEqual([]);
  });

  it("un confirmado sin eco se descarta pasado un rato", async () => {
    const { queue, resolvers } = setup();
    queue.enqueue("hola");
    resolvers[0](OK);
    await vi.advanceTimersByTimeAsync(0);

    await vi.advanceTimersByTimeAsync(30_000);

    expect(queue.getEntries()).toEqual([]);
  });

  it("reintenta solo con espera creciente y sale bien al tercer intento", async () => {
    const { queue, send, resolvers } = setup();
    queue.enqueue("hola");

    resolvers[0](fail());
    await vi.advanceTimersByTimeAsync(999);
    expect(send).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(send).toHaveBeenCalledTimes(2);

    resolvers[1](fail());
    await vi.advanceTimersByTimeAsync(3_000);
    expect(send).toHaveBeenCalledTimes(3);
    expect(send).toHaveBeenLastCalledWith("hola", "c1");

    resolvers[2](OK);
    await vi.advanceTimersByTimeAsync(0);
    expect(queue.getEntries()[0]).toMatchObject({ acked: true, attempts: 3 });
  });

  it("tras 3 intentos queda fallido con el motivo", async () => {
    const { queue, send, resolvers } = setup();
    queue.enqueue("hola");

    resolvers[0](fail("uno"));
    await vi.advanceTimersByTimeAsync(1_000);
    resolvers[1](fail("dos"));
    await vi.advanceTimersByTimeAsync(3_000);
    resolvers[2](fail("tres"));
    await vi.advanceTimersByTimeAsync(10_000);

    expect(send).toHaveBeenCalledTimes(SEND_MAX_ATTEMPTS);
    expect(queue.getEntries()[0]).toMatchObject({
      status: "failed",
      error: "tres",
      attempts: SEND_MAX_ATTEMPTS,
    });
  });

  it("un rechazo del back no se reintenta", async () => {
    const { queue, send, resolvers } = setup();
    queue.enqueue("hola");

    resolvers[0](fail("Palabra prohibida", false));
    await vi.advanceTimersByTimeAsync(10_000);

    expect(send).toHaveBeenCalledTimes(1);
    expect(status(queue)).toBe("failed");
  });

  it("sin conexion queda en cola sin gastar intentos y sale al volver", async () => {
    const { queue, send, resolvers, setReady } = setup({ ready: false });

    queue.enqueue("hola");
    await vi.advanceTimersByTimeAsync(0);
    expect(send).not.toHaveBeenCalled();
    expect(queue.getEntries()[0]).toMatchObject({
      status: "queued",
      attempts: 0,
    });

    setReady(true);
    queue.notifyReady();
    expect(send).toHaveBeenCalledWith("hola", "c1");
    expect(queue.getEntries()[0]).toMatchObject({
      status: "sending",
      attempts: 1,
    });
    resolvers[0](OK);
  });

  it("si se cae la conexion entre intentos vuelve a la cola sin gastar otro intento", async () => {
    const { queue, send, resolvers, setReady } = setup();
    queue.enqueue("hola");
    resolvers[0](fail());
    await vi.advanceTimersByTimeAsync(0);

    setReady(false);
    await vi.advanceTimersByTimeAsync(1_000);

    expect(send).toHaveBeenCalledTimes(1);
    expect(queue.getEntries()[0]).toMatchObject({
      status: "queued",
      attempts: 1,
    });
  });

  it("manda de a uno y en orden", async () => {
    const { queue, send, resolvers } = setup();

    queue.enqueue("a");
    queue.enqueue("b");
    expect(send).toHaveBeenCalledTimes(1);

    resolvers[0](OK);
    await vi.advanceTimersByTimeAsync(0);
    expect(send).toHaveBeenCalledTimes(2);
    expect(send).toHaveBeenLastCalledWith("b", "c2");
  });

  it("reintentar un fallido lo manda de nuevo con el mismo client id", async () => {
    const { queue, send, resolvers } = setup();
    queue.enqueue("hola");
    resolvers[0](fail("x", false));
    await vi.advanceTimersByTimeAsync(0);

    queue.retry("c1");

    expect(send).toHaveBeenCalledTimes(2);
    expect(send).toHaveBeenLastCalledWith("hola", "c1");
    expect(queue.getEntries()[0]).toMatchObject({
      status: "sending",
      attempts: 1,
      error: null,
    });
  });

  it("reintentar dos veces seguidas manda una sola vez", async () => {
    const { queue, send, resolvers } = setup();
    queue.enqueue("hola");
    resolvers[0](fail("x", false));
    await vi.advanceTimersByTimeAsync(0);

    queue.retry("c1");
    queue.retry("c1");

    expect(send).toHaveBeenCalledTimes(2);
  });

  it("reintentar algo que no esta fallido no hace nada", () => {
    const { queue, send } = setup();
    queue.enqueue("hola");

    queue.retry("c1");

    expect(send).toHaveBeenCalledTimes(1);
  });

  it("eliminar saca un fallido; un enviando no se puede eliminar", async () => {
    const { queue, resolvers } = setup();
    queue.enqueue("hola");

    queue.discard("c1");
    expect(queue.getEntries()).toHaveLength(1);

    resolvers[0](fail("x", false));
    await vi.advanceTimersByTimeAsync(0);
    queue.discard("c1");

    expect(queue.getEntries()).toEqual([]);
  });

  it("lo persistido incluye lo que sigue sin confirmar", async () => {
    const { queue, persisted } = setup();

    queue.enqueue("hola");

    expect(persisted.at(-1)).toMatchObject([
      { clientId: "c1", content: "hola", status: "sending" },
    ]);
  });

  it("descarta lo que supero las 2 h", async () => {
    let now = Date.parse("2026-10-01T12:00:00.000Z");
    const { queue, send, setReady } = setup({ ready: false, now: () => now });
    queue.enqueue("viejo");

    now += PENDING_TTL_MS + 1;
    setReady(true);
    queue.notifyReady();

    expect(queue.getEntries()).toEqual([]);
    expect(send).not.toHaveBeenCalled();
  });

  it("restore suma lo leido despues, en orden de envio y sin repetir", () => {
    const { queue } = setup({ ready: false });
    queue.enqueue("nuevo");
    const old: PendingMessage = {
      clientId: "viejo",
      content: "viejo",
      status: "failed",
      attempts: SEND_MAX_ATTEMPTS,
      error: null,
      createdAt: "2000-01-01T00:00:00.000Z",
      acked: false,
      slow: false,
    };

    queue.restore([old, { ...old, clientId: "c1" }]);
    queue.restore([old]);

    expect(queue.getEntries().map((entry) => entry.clientId)).toEqual([
      "viejo",
      "c1",
    ]);
  });

  it("prune saca los mensajes cuyo eco ya llego", () => {
    const { queue } = setup({ ready: false });
    queue.enqueue("a");
    queue.enqueue("b");

    queue.prune(new Set(["c1"]));

    expect(queue.getEntries().map((entry) => entry.clientId)).toEqual(["c2"]);
  });

  it("avisa a quienes se suscribieron en cada cambio, y deja de hacerlo al desuscribirse", () => {
    const { queue } = setup({ ready: false });
    const listener = vi.fn();
    const unsubscribe = queue.subscribe(listener);

    queue.enqueue("a");
    expect(listener).toHaveBeenCalled();

    unsubscribe();
    listener.mockClear();
    queue.enqueue("b");
    expect(listener).not.toHaveBeenCalled();
  });

  it("detenida no manda ni reintenta, y al retomarla sigue donde quedo", async () => {
    const { queue, send, resolvers } = setup();
    queue.enqueue("hola");
    resolvers[0](fail());
    await vi.advanceTimersByTimeAsync(0);

    queue.stop();
    await vi.advanceTimersByTimeAsync(10_000);
    queue.enqueue("otro");
    expect(send).toHaveBeenCalledTimes(1);
    expect(queue.getEntries()).toHaveLength(1);

    queue.start();
    expect(send).toHaveBeenCalledTimes(2);
    expect(send).toHaveBeenLastCalledWith("hola", "c1");
  });

  it("configure cambia como se envia sin perder la cola", async () => {
    const { queue, send, setReady } = setup({ ready: false });
    queue.enqueue("hola");
    const other = vi.fn(() => Promise.resolve(OK));

    queue.configure({ send: other, isReady: () => true });
    setReady(true);
    queue.notifyReady();

    expect(other).toHaveBeenCalledWith("hola", "c1");
    expect(send).not.toHaveBeenCalled();
  });

  it("pasados 2 s sin confirmar el envio se marca lento; si se confirma antes, no", async () => {
    const { queue, resolvers } = setup();
    queue.enqueue("a");

    await vi.advanceTimersByTimeAsync(SEND_SLOW_MS - 1);
    expect(queue.getEntries()[0].slow).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(queue.getEntries()[0].slow).toBe(true);

    resolvers[0](OK);
    queue.enqueue("b");
    await vi.advanceTimersByTimeAsync(0);
    resolvers[1]?.(OK);
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(SEND_SLOW_MS);
    expect(queue.getEntries().find((e) => e.content === "b")?.slow).toBe(false);
  });

  it("Reintentar vuelve a empezar la cuenta de lentitud", async () => {
    const { queue, resolvers } = setup();
    queue.enqueue("a");
    await vi.advanceTimersByTimeAsync(SEND_SLOW_MS);
    resolvers[0](fail("x", false));
    await vi.advanceTimersByTimeAsync(0);

    queue.retry("c1");

    expect(queue.getEntries()[0].slow).toBe(false);
  });

  it("start sin haber parado no repite el envio en curso", () => {
    const { queue, send } = setup();
    queue.enqueue("hola");

    queue.start();

    expect(send).toHaveBeenCalledTimes(1);
  });
});

describe("withPendingMessages", () => {
  const pending = (
    clientId: string,
    overrides: Partial<PendingMessage> = {},
  ): PendingMessage => ({
    clientId,
    content: clientId,
    status: "sending",
    attempts: 1,
    error: null,
    createdAt: "2026-10-01T12:00:00.000Z",
    acked: false,
    slow: false,
    ...overrides,
  });

  it("sin pendientes devuelve los mensajes tal cual", () => {
    expect(withPendingMessages([msg("m1")], [], "me", "c1")).toEqual([
      msg("m1"),
    ]);
  });

  it("los pendientes van al final, como mensajes propios, en orden de envio", () => {
    const shown = withPendingMessages(
      [msg("m1"), msg("m2")],
      [pending("a"), pending("b", { status: "failed", error: "No se pudo" })],
      "me",
      "c1",
    );

    expect(shown.map((m) => m.id)).toEqual([
      "m1",
      "m2",
      "pending:a",
      "pending:b",
    ]);
    expect(shown[2]).toMatchObject({
      user_id: "me",
      channel_id: "c1",
      content: "a",
      client_id: "a",
      delivery: "sending",
    });
    expect(shown[3]).toMatchObject({
      delivery: "failed",
      delivery_error: "No se pudo",
    });
  });

  it("un pendiente queda en el lugar donde se escribio, por hora; uno nuevo va al final", () => {
    const old = (id: string, inserted_at: string): Message => ({
      ...msg(id),
      inserted_at,
    });
    const shown = withPendingMessages(
      [
        old("ayer-1", "2026-10-23T15:00:00.000Z"),
        old("ayer-2", "2026-10-23T17:00:00.000Z"),
        old("hoy-1", "2026-10-24T06:00:00.000Z"),
      ],
      [
        pending("fallido-ayer", {
          status: "failed",
          createdAt: "2026-10-23T16:15:00.000Z",
        }),
        pending("recien", { createdAt: "2026-10-24T06:30:00.000Z" }),
      ],
      "me",
      "c1",
    );

    expect(shown.map((m) => m.id)).toEqual([
      "ayer-1",
      "pending:fallido-ayer",
      "ayer-2",
      "hoy-1",
      "pending:recien",
    ]);
  });

  it("varios pendientes de la misma hora mantienen el orden de envio", () => {
    const shown = withPendingMessages(
      [msg("m1")],
      [pending("a"), pending("b")],
      "me",
      "c1",
    );

    expect(shown.map((m) => m.id)).toEqual(["m1", "pending:a", "pending:b"]);
  });

  it("un envio normal no avisa nada; si es lento, esta en cola o ya se reintento, avisa que se demora", () => {
    const delivery = (overrides: Partial<PendingMessage>) =>
      withPendingMessages([], [pending("a", overrides)], "me", "c1")[0]
        .delivery;

    expect(delivery({ status: "sending", attempts: 1 })).toBe("sending");
    expect(delivery({ status: "sending", attempts: 1, slow: true })).toBe(
      "waiting",
    );
    expect(delivery({ status: "sending", attempts: 2 })).toBe("waiting");
    expect(delivery({ status: "queued", attempts: 0 })).toBe("waiting");
  });

  it("se oculta el pendiente cuyo mensaje ya llego con su client id", () => {
    const shown = withPendingMessages(
      [msg("m1", "a")],
      [pending("a"), pending("b")],
      "me",
      "c1",
    );

    expect(shown.map((m) => m.id)).toEqual(["m1", "pending:b"]);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createSocketManager,
  type SocketLifecycleControls,
  type SocketManager,
  type SocketTicketResult,
} from "./socket-manager";

class FakeSocket {
  params: () => { ticket: string };
  openCallback: (() => void) | null = null;
  closeCallback: (() => void) | null = null;
  connected = false;
  connect = vi.fn();
  disconnect = vi.fn((callback?: () => void) => callback?.());
  constructor(params: () => { ticket: string }) {
    this.params = params;
  }
  onOpen(callback: () => void) {
    this.openCallback = callback;
  }
  onClose(callback: () => void) {
    this.closeCallback = callback;
  }
  isConnected() {
    return this.connected;
  }
}

function ticket(value: string): SocketTicketResult {
  return { ok: true, ticket: value };
}

const TRANSIENT: SocketTicketResult = { ok: false, sessionExpired: false };
const SESSION_DEAD: SocketTicketResult = { ok: false, sessionExpired: true };

let sockets: FakeSocket[];
let fetchTicket: ReturnType<typeof vi.fn<() => Promise<SocketTicketResult>>>;
let controls: SocketLifecycleControls<FakeSocket> | null;
let stopLifecycle: ReturnType<typeof vi.fn<() => void>>;
let manager: SocketManager<FakeSocket>;

function lastSocket() {
  return sockets[0];
}

beforeEach(() => {
  vi.useFakeTimers();
  sockets = [];
  controls = null;
  stopLifecycle = vi.fn<() => void>();
  fetchTicket = vi.fn<() => Promise<SocketTicketResult>>();
  fetchTicket.mockResolvedValue(ticket("A"));
  manager = createSocketManager<FakeSocket>({
    createSocket: (params) => {
      const socket = new FakeSocket(params);
      sockets.push(socket);
      return socket;
    },
    fetchTicket,
    watchLifecycle: (received) => {
      controls = received;
      return stopLifecycle;
    },
  });
});

afterEach(() => {
  manager.closeSocket();
  vi.useRealTimers();
});

describe("acquireSocket", () => {
  it("abre un solo socket aunque lo pidan varios a la vez", async () => {
    const [a, b] = await Promise.all([
      manager.acquireSocket(),
      manager.acquireSocket(),
    ]);

    expect(a.ok && b.ok).toBe(true);
    expect(fetchTicket).toHaveBeenCalledTimes(1);
    expect(sockets).toHaveLength(1);
    expect(lastSocket().connect).toHaveBeenCalledTimes(1);
  });

  it("el ticket es de un solo uso: se entrega una vez y no se reutiliza", async () => {
    await manager.acquireSocket();

    expect(lastSocket().params()).toEqual({ ticket: "A" });
    expect(lastSocket().params()).toEqual({ ticket: "" });
  });

  it("si no hay sesion para pedir el ticket no abre el socket", async () => {
    fetchTicket.mockResolvedValue(SESSION_DEAD);

    expect(await manager.acquireSocket()).toEqual({
      ok: false,
      sessionExpired: true,
    });
    expect(sockets).toHaveLength(0);
  });

  it("un fallo transitorio se distingue de una sesion muerta", async () => {
    fetchTicket.mockResolvedValue(TRANSIENT);

    expect(await manager.acquireSocket()).toEqual({
      ok: false,
      sessionExpired: false,
    });
  });
});

describe("release", () => {
  it("cierra el socket cuando nadie lo usa, no antes", async () => {
    const a = await manager.acquireSocket();
    const b = await manager.acquireSocket();
    if (!a.ok || !b.ok) throw new Error("no abrio");

    a.release();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(lastSocket().disconnect).not.toHaveBeenCalled();

    b.release();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(lastSocket().disconnect).toHaveBeenCalledTimes(1);
  });

  it("no cierra si alguien lo vuelve a pedir enseguida (cambio de canal)", async () => {
    const first = await manager.acquireSocket();
    if (!first.ok) throw new Error("no abrio");
    first.release();

    await vi.advanceTimersByTimeAsync(1_000);
    const second = await manager.acquireSocket();
    await vi.advanceTimersByTimeAsync(20_000);

    expect(second.ok).toBe(true);
    expect(sockets).toHaveLength(1);
    expect(lastSocket().disconnect).not.toHaveBeenCalled();
  });

  it("es idempotente: soltar dos veces no resta de mas", async () => {
    const a = await manager.acquireSocket();
    const b = await manager.acquireSocket();
    if (!a.ok || !b.ok) throw new Error("no abrio");

    a.release();
    a.release();
    await vi.advanceTimersByTimeAsync(10_000);

    expect(lastSocket().disconnect).not.toHaveBeenCalled();
  });
});

describe("reconexion con un ticket nuevo", () => {
  async function openAndClose() {
    await manager.acquireSocket();
    const socket = lastSocket();
    socket.params(); // Phoenix consume el ticket al conectar
    socket.connect.mockClear();
    socket.disconnect.mockClear();
    return socket;
  }

  it("al cerrarse pide un ticket nuevo y vuelve a conectar con el", async () => {
    const socket = await openAndClose();
    fetchTicket.mockResolvedValue(ticket("B"));

    socket.closeCallback?.();
    await vi.advanceTimersByTimeAsync(0);

    expect(socket.disconnect).toHaveBeenCalledTimes(1);
    expect(socket.connect).toHaveBeenCalledTimes(1);
    expect(socket.params()).toEqual({ ticket: "B" });
  });

  it("cada reconexion usa un ticket distinto", async () => {
    const socket = await openAndClose();

    fetchTicket.mockResolvedValue(ticket("B"));
    socket.closeCallback?.();
    await vi.advanceTimersByTimeAsync(0);
    expect(socket.params()).toEqual({ ticket: "B" });
    socket.openCallback?.();

    fetchTicket.mockResolvedValue(ticket("C"));
    socket.closeCallback?.();
    await vi.advanceTimersByTimeAsync(0);
    expect(socket.params()).toEqual({ ticket: "C" });
  });

  it("ignora un segundo cierre mientras la reconexion esta en curso", async () => {
    const socket = await openAndClose();
    fetchTicket.mockReturnValue(new Promise(() => {}));

    socket.closeCallback?.();
    socket.closeCallback?.();
    socket.closeCallback?.();
    await vi.advanceTimersByTimeAsync(0);

    expect(socket.disconnect).toHaveBeenCalledTimes(1);
    expect(fetchTicket).toHaveBeenCalledTimes(2); // 1 de apertura + 1
  });

  it("si el ticket falla por la red reintenta con backoff hasta lograrlo", async () => {
    const socket = await openAndClose();
    fetchTicket
      .mockResolvedValueOnce(TRANSIENT)
      .mockResolvedValueOnce(TRANSIENT)
      .mockResolvedValueOnce(ticket("B"));

    socket.closeCallback?.();
    await vi.advanceTimersByTimeAsync(0);
    expect(socket.connect).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1_000);
    expect(socket.connect).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(2_000);
    expect(socket.connect).toHaveBeenCalledTimes(1);
    expect(socket.params()).toEqual({ ticket: "B" });
  });

  it("si el servidor rechaza el handshake una y otra vez, espera cada vez mas", async () => {
    const socket = await openAndClose();
    fetchTicket.mockResolvedValue(ticket("X"));

    // 1er cierre: enseguida.
    socket.closeCallback?.();
    await vi.advanceTimersByTimeAsync(0);
    expect(socket.connect).toHaveBeenCalledTimes(1);

    // 2do cierre sin haber abierto: espera 1 s.
    socket.closeCallback?.();
    await vi.advanceTimersByTimeAsync(500);
    expect(socket.connect).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(500);
    expect(socket.connect).toHaveBeenCalledTimes(2);

    // 3er cierre: espera 2 s.
    socket.closeCallback?.();
    await vi.advanceTimersByTimeAsync(1_500);
    expect(socket.connect).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(500);
    expect(socket.connect).toHaveBeenCalledTimes(3);
  });

  it("el backoff vuelve a cero cuando el socket llega a abrir", async () => {
    const socket = await openAndClose();
    fetchTicket.mockResolvedValue(ticket("X"));

    socket.closeCallback?.();
    await vi.advanceTimersByTimeAsync(0);
    socket.closeCallback?.();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(socket.connect).toHaveBeenCalledTimes(2);

    socket.openCallback?.();
    socket.closeCallback?.();
    await vi.advanceTimersByTimeAsync(0);

    expect(socket.connect).toHaveBeenCalledTimes(3);
  });

  it("si la sesion murio al pedir el ticket cierra el socket y avisa", async () => {
    const socket = await openAndClose();
    const listener = vi.fn();
    manager.onSocketSessionExpired(listener);
    fetchTicket.mockResolvedValue(SESSION_DEAD);

    socket.closeCallback?.();
    await vi.advanceTimersByTimeAsync(0);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(socket.connect).not.toHaveBeenCalled();
  });

  it("no reconecta cuando el cierre lo provoca el propio manager", async () => {
    const socket = await openAndClose();
    fetchTicket.mockClear();

    manager.closeSocket();
    socket.closeCallback?.();
    await vi.advanceTimersByTimeAsync(5_000);

    expect(fetchTicket).not.toHaveBeenCalled();
    expect(socket.connect).not.toHaveBeenCalled();
  });
});

describe("ciclo de vida de la plataforma", () => {
  async function openAndClose() {
    await manager.acquireSocket();
    const socket = lastSocket();
    socket.params();
    socket.connect.mockClear();
    return socket;
  }

  it("no reconecta mientras la plataforma pide suspender la reconexion", async () => {
    const socket = await openAndClose();
    fetchTicket.mockClear();

    controls?.suspendReconnect(true);
    socket.closeCallback?.();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(fetchTicket).not.toHaveBeenCalled();

    controls?.suspendReconnect(false);
    fetchTicket.mockResolvedValue(ticket("B"));
    socket.closeCallback?.();
    await vi.advanceTimersByTimeAsync(0);

    expect(socket.params()).toEqual({ ticket: "B" });
  });

  it("reconnectIfDisconnected reconecta solo si el socket no esta abierto", async () => {
    const socket = await openAndClose();
    fetchTicket.mockResolvedValue(ticket("B"));

    socket.connected = true;
    controls?.reconnectIfDisconnected();
    await vi.advanceTimersByTimeAsync(0);
    expect(socket.connect).not.toHaveBeenCalled();

    socket.connected = false;
    controls?.reconnectIfDisconnected();
    await vi.advanceTimersByTimeAsync(0);
    expect(socket.connect).toHaveBeenCalledTimes(1);
    expect(socket.params()).toEqual({ ticket: "B" });
  });

  it("desengancha los eventos de la plataforma al cerrar", async () => {
    await manager.acquireSocket();
    manager.closeSocket();

    expect(stopLifecycle).toHaveBeenCalledTimes(1);
  });
});

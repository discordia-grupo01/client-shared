import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PresenceEntry } from "../domain/presence";
import { OWN_STATUS_FAILED } from "../messages/presence";

import type { RealtimeChannel } from "./channel-chat";
import {
  changeOwnStatus,
  createIdleTracker,
  createPresenceStore,
  DEFAULT_IDLE_AFTER_MS,
  displayedPresenceOf,
  joinPresenceChannel,
  loadPresence,
  mergePresence,
  NO_PRESENCE,
  presenceIdBatches,
  presenceOf,
  reportActivity,
  type UserRoomPush,
  watchServerPresence,
} from "./presence";

function entry(
  userId: string,
  status: PresenceEntry["status"],
  version: number,
): PresenceEntry {
  return { user_id: userId, status, version };
}

describe("mergePresence", () => {
  it("suma estados nuevos", () => {
    const map = mergePresence(NO_PRESENCE, [entry("a", "online", 1)]);
    expect(map).toEqual({ a: { status: "online", version: 1 } });
  });

  it("ignora un dato con version menor (llego tarde)", () => {
    const map = mergePresence(NO_PRESENCE, [entry("a", "idle", 5)]);
    expect(mergePresence(map, [entry("a", "online", 4)])).toBe(map);
  });

  it("devuelve el mismo mapa si nada cambio", () => {
    const map = mergePresence(NO_PRESENCE, [entry("a", "online", 2)]);
    expect(mergePresence(map, [entry("a", "online", 2)])).toBe(map);
  });

  it("aplica la misma version con otro estado (por ejemplo, un bloqueo)", () => {
    const map = mergePresence(NO_PRESENCE, [entry("a", "online", 2)]);
    expect(mergePresence(map, [entry("a", "offline", 2)]).a.status).toBe(
      "offline",
    );
  });
});

describe("presenceOf", () => {
  it("quien no esta en el mapa esta desconectado", () => {
    expect(presenceOf(NO_PRESENCE, "a")).toBe("offline");
  });
});

describe("presenceIdBatches", () => {
  it("parte en tandas y saca repetidos", () => {
    expect(presenceIdBatches(["a", "b", "a", "c"], 2)).toEqual([
      ["a", "b"],
      ["c"],
    ]);
  });

  it("sin ids no hay tandas", () => {
    expect(presenceIdBatches([])).toEqual([]);
  });
});

describe("createPresenceStore", () => {
  it("al unirse la sala personal toma tu eleccion y el tiempo de inactividad", () => {
    const store = createPresenceStore("me");
    expect(store.getState().idleAfterMs).toBe(DEFAULT_IDLE_AFTER_MS);

    store.userRoomJoined({ status: "dnd", idle_after_ms: 1000 });

    expect(store.getState()).toMatchObject({
      ownChoice: "dnd",
      idleAfterMs: 1000,
      isOwnConnected: true,
      userRoomJoins: 1,
    });
  });

  it("tu estado sale de lo que elegiste, no de lo que publica el back", () => {
    const store = createPresenceStore("me");
    store.applyEntries([entry("me", "offline", 9)]);
    expect(displayedPresenceOf(store.getState(), "me")).toBe("offline");

    store.userRoomJoined({ status: "online" });
    expect(displayedPresenceOf(store.getState(), "me")).toBe("online");

    store.setOwnChoice("invisible");
    expect(displayedPresenceOf(store.getState(), "me")).toBe("offline");
  });

  it("sin la sala personal te ves desconectado", () => {
    const store = createPresenceStore("me");
    store.userRoomJoined({ status: "dnd" });
    store.userRoomLost();
    expect(displayedPresenceOf(store.getState(), "me")).toBe("offline");
  });

  it("own_status_updated cambia tu eleccion", () => {
    const store = createPresenceStore("me");
    store.userRoomJoined({ status: "online" });
    store.ownStatusUpdated({ status: "idle", version: 3 });
    expect(store.getState().ownChoice).toBe("idle");
  });

  it("avisa a los suscriptores solo si algo cambio", () => {
    const store = createPresenceStore("me");
    const listener = vi.fn();
    store.subscribe(listener);

    store.applyEntries([entry("a", "online", 1)]);
    store.applyEntries([entry("a", "online", 1)]);

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("al re-unirse a un servidor, quien ya no esta en la foto se desconecto", () => {
    const store = createPresenceStore("me");
    store.applyServerSnapshot("s1", [entry("a", "online", 3)]);
    store.applyServerUpdate("s1", entry("b", "dnd", 1));

    store.applyServerSnapshot("s1", [entry("b", "dnd", 1)]);

    const { presences } = store.getState();
    expect(presenceOf(presences, "a")).toBe("offline");
    expect(presenceOf(presences, "b")).toBe("dnd");
  });

  it("la foto de un servidor no desconecta a quien se vio en otro", () => {
    const store = createPresenceStore("me");
    store.applyServerSnapshot("s1", [entry("a", "online", 3)]);
    store.applyServerSnapshot("s2", []);
    expect(presenceOf(store.getState().presences, "a")).toBe("online");
  });
});

describe("changeOwnStatus", () => {
  it("cambia al instante y manda set_status", async () => {
    const store = createPresenceStore("me");
    store.userRoomJoined({ status: "online" });
    const push = vi.fn<UserRoomPush>(async () => ({ ok: true }));

    const pending = changeOwnStatus(store, push, "dnd");
    expect(store.getState().ownChoice).toBe("dnd");

    expect(await pending).toEqual({ ok: true });
    expect(push).toHaveBeenCalledWith(
      "set_status",
      { status: "dnd" },
      expect.objectContaining({ failedMessage: OWN_STATUS_FAILED }),
    );
  });

  it("si el back lo rechaza vuelve al anterior", async () => {
    const store = createPresenceStore("me");
    store.userRoomJoined({ status: "online" });
    const push = vi.fn<UserRoomPush>(async () => ({
      ok: false,
      message: "falló",
    }));

    const result = await changeOwnStatus(store, push, "invisible");

    expect(result).toEqual({ ok: false, message: "falló" });
    expect(store.getState().ownChoice).toBe("online");
  });

  it("elegir lo mismo no manda nada", async () => {
    const store = createPresenceStore("me");
    store.userRoomJoined({ status: "dnd" });
    const push = vi.fn<UserRoomPush>();
    await changeOwnStatus(store, push, "dnd");
    expect(push).not.toHaveBeenCalled();
  });
});

describe("reportActivity", () => {
  it("manda activity con idle o active", async () => {
    const push = vi.fn<UserRoomPush>(async () => ({ ok: true }));
    await reportActivity(push, true);
    await reportActivity(push, false);
    expect(push.mock.calls.map(([event, payload]) => [event, payload])).toEqual(
      [
        ["activity", { state: "idle" }],
        ["activity", { state: "active" }],
      ],
    );
  });
});

class FakePush {
  hooks: Record<string, (response?: unknown) => void> = {};
  receive(status: string, callback: (response?: unknown) => void) {
    this.hooks[status] = callback;
    return this;
  }
}

function createRoom() {
  const events: Record<string, (payload: unknown) => void> = {};
  const joinPush = new FakePush();
  return {
    events,
    joinPush,
    on: vi.fn((event: string, cb: (payload: unknown) => void) => {
      events[event] = cb;
    }),
    onError: vi.fn(),
    onClose: vi.fn(),
    join: vi.fn(() => joinPush),
    leave: vi.fn(),
    push: vi.fn(),
  };
}

describe("joinPresenceChannel", () => {
  it("entrega la foto de cada join y los avisos en vivo", () => {
    const room = createRoom();
    const handlers = { snapshot: vi.fn(), updated: vi.fn() };
    joinPresenceChannel(room as unknown as RealtimeChannel, handlers);

    room.joinPush.hooks.ok({ presences: [entry("a", "online", 1)] });
    room.events.presence_updated(entry("a", "idle", 2));
    room.joinPush.hooks.ok(undefined);

    expect(handlers.snapshot.mock.calls).toEqual([
      [[entry("a", "online", 1)]],
      [[]],
    ]);
    expect(handlers.updated).toHaveBeenCalledWith(entry("a", "idle", 2));
  });

  it("si no sos miembro deja la sala (no reintenta)", () => {
    const room = createRoom();
    joinPresenceChannel(room as unknown as RealtimeChannel, {
      snapshot: vi.fn(),
      updated: vi.fn(),
    });
    room.joinPush.hooks.error({ error: { code: "FORBIDDEN" } });
    expect(room.leave).toHaveBeenCalled();
  });

  it("un error pasajero no deja la sala (Phoenix reintenta)", () => {
    const room = createRoom();
    joinPresenceChannel(room as unknown as RealtimeChannel, {
      snapshot: vi.fn(),
      updated: vi.fn(),
    });
    room.joinPush.hooks.error({ error: { code: "PRESENCE_UNAVAILABLE" } });
    expect(room.leave).not.toHaveBeenCalled();
  });

  it("deja la sala si te sacan del servidor", () => {
    const room = createRoom();
    joinPresenceChannel(room as unknown as RealtimeChannel, {
      snapshot: vi.fn(),
      updated: vi.fn(),
    });
    room.events.access_revoked({ server_id: "s", reason: "member_left" });
    expect(room.leave).toHaveBeenCalled();
  });
});

describe("createIdleTracker", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("avisa ausente al cumplirse el tiempo sin interaccion", () => {
    const onChange = vi.fn();
    const tracker = createIdleTracker({ idleAfterMs: 1000, onChange });

    vi.advanceTimersByTime(999);
    expect(onChange).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onChange).toHaveBeenCalledWith(true);
    expect(tracker.isIdle()).toBe(true);
    tracker.stop();
  });

  it("cada interaccion reinicia la cuenta", () => {
    const onChange = vi.fn();
    const tracker = createIdleTracker({ idleAfterMs: 1000, onChange });

    vi.advanceTimersByTime(800);
    tracker.activity();
    vi.advanceTimersByTime(800);
    expect(onChange).not.toHaveBeenCalled();
    vi.advanceTimersByTime(200);
    expect(onChange).toHaveBeenCalledWith(true);
    tracker.stop();
  });

  it("al volver a interactuar avisa que volvio, una sola vez", () => {
    const onChange = vi.fn();
    const tracker = createIdleTracker({ idleAfterMs: 1000, onChange });
    vi.advanceTimersByTime(1000);

    tracker.activity();
    tracker.activity();

    expect(onChange.mock.calls).toEqual([[true], [false]]);
    vi.advanceTimersByTime(1000);
    expect(onChange.mock.calls).toEqual([[true], [false], [true]]);
    tracker.stop();
  });

  it("detenido no avisa nada", () => {
    const onChange = vi.fn();
    const tracker = createIdleTracker({ idleAfterMs: 1000, onChange });
    tracker.stop();
    vi.advanceTimersByTime(5000);
    tracker.activity();
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("watchServerPresence", () => {
  it("se une a presence:<server> y vuelca la foto en el store", async () => {
    const room = createRoom();
    const release = vi.fn();
    const socket = { channel: vi.fn(() => room as unknown as RealtimeChannel) };
    const store = createPresenceStore("me");

    const stop = watchServerPresence(
      async () => ({ ok: true as const, socket, release }),
      store,
      "s1",
    );
    await Promise.resolve();
    room.joinPush.hooks.ok({ presences: [entry("a", "dnd", 1)] });

    expect(socket.channel).toHaveBeenCalledWith("presence:s1");
    expect(presenceOf(store.getState().presences, "a")).toBe("dnd");

    stop();
    expect(room.leave).toHaveBeenCalled();
    expect(release).toHaveBeenCalled();
  });

  it("si se deja antes de tener el socket, lo suelta sin unirse", async () => {
    const release = vi.fn();
    const socket = { channel: vi.fn() };
    const stop = watchServerPresence(
      async () => ({ ok: true as const, socket, release }),
      createPresenceStore("me"),
      "s1",
    );
    stop();
    await Promise.resolve();
    expect(socket.channel).not.toHaveBeenCalled();
    expect(release).toHaveBeenCalled();
  });
});

describe("loadPresence", () => {
  it("pide en tandas y suma lo que llego bien", async () => {
    const store = createPresenceStore("me");
    const ids = Array.from({ length: 101 }, (_, i) => `u${i}`);
    const request = vi.fn(async (batch: string[]) =>
      batch[0] === "u0"
        ? { ok: true as const, presences: [entry("u0", "idle", 1)] }
        : { ok: false as const, message: "falló" },
    );

    await loadPresence(store, ids, request);

    expect(request).toHaveBeenCalledTimes(2);
    expect(presenceOf(store.getState().presences, "u0")).toBe("idle");
  });
});

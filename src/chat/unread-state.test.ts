import { describe, expect, it, vi } from "vitest";

import type {
  UnreadSnapshotPayload,
  UnreadUpdatedPayload,
} from "../domain/unread-state";
import {
  applyUnreadSnapshot,
  applyUnreadUpdate,
  createUnreadTracker,
  hasAnyUnread,
  markUnreadChannelRead,
  markUnreadServerRead,
  NO_UNREAD,
  snapshotHasUnreadChannel,
  unreadFlagsByChannel,
  unreadChannelIdsInServer,
  unreadFlagsByServer,
} from "./unread-state";

const flags = (unread: boolean, mentionCount = 0) => ({
  unread,
  mention: mentionCount > 0,
  mention_count: mentionCount,
  notify: false,
  muted: false,
});

const snapshot: UnreadSnapshotPayload = {
  servers: [
    {
      server_id: "S1",
      ...flags(true, 2),
      channels: [
        { channel_id: "C1", ...flags(true) },
        { channel_id: "C2", ...flags(true, 2) },
      ],
    },
    {
      server_id: "S2",
      ...flags(true),
      channels: [{ channel_id: "C3", ...flags(true) }],
    },
  ],
};

const update = (
  channelId: string,
  serverId: string | null,
  unread: boolean,
  mentionCount = 0,
): UnreadUpdatedPayload => ({
  channel_id: channelId,
  server_id: serverId,
  ...flags(unread, mentionCount),
  server: flags(unread, mentionCount),
});

describe("applyUnreadSnapshot", () => {
  it("guarda cada canal sin leer con su servidor y sus menciones", () => {
    expect(applyUnreadSnapshot(snapshot, null)).toEqual({
      C1: { serverId: "S1", unread: true, mentionCount: 0 },
      C2: { serverId: "S1", unread: true, mentionCount: 2 },
      C3: { serverId: "S2", unread: true, mentionCount: 0 },
    });
  });

  it("deja afuera el canal abierto", () => {
    expect(applyUnreadSnapshot(snapshot, "C2")).not.toHaveProperty("C2");
  });
});

describe("applyUnreadUpdate", () => {
  it("enciende un canal nuevo", () => {
    expect(
      applyUnreadUpdate(NO_UNREAD, update("C1", "S1", true), null),
    ).toEqual({ C1: { serverId: "S1", unread: true, mentionCount: 0 } });
  });

  it("actualiza la cantidad de menciones", () => {
    const state = applyUnreadSnapshot(snapshot, null);
    expect(
      applyUnreadUpdate(state, update("C1", "S1", true, 1), null).C1,
    ).toEqual({ serverId: "S1", unread: true, mentionCount: 1 });
  });

  it("devuelve el mismo estado si no cambió nada", () => {
    const state = applyUnreadSnapshot(snapshot, null);
    expect(applyUnreadUpdate(state, update("C2", "S1", true, 2), null)).toBe(
      state,
    );
  });

  it("apaga el canal cuando llega leído", () => {
    const state = applyUnreadSnapshot(snapshot, null);
    expect(
      applyUnreadUpdate(state, update("C1", "S1", false), null),
    ).not.toHaveProperty("C1");
  });

  it("ignora el canal abierto", () => {
    expect(applyUnreadUpdate(NO_UNREAD, update("C1", "S1", true), "C1")).toBe(
      NO_UNREAD,
    );
  });

  it("sin servidor conocido no enciende nada", () => {
    expect(applyUnreadUpdate(NO_UNREAD, update("C9", null, true), null)).toBe(
      NO_UNREAD,
    );
  });
});

describe("markUnreadChannelRead", () => {
  it("saca el canal y no toca el resto", () => {
    const state = applyUnreadSnapshot(snapshot, null);
    expect(Object.keys(markUnreadChannelRead(state, "C1"))).toEqual([
      "C2",
      "C3",
    ]);
  });

  it("devuelve el mismo estado si ya estaba leído", () => {
    expect(markUnreadChannelRead(NO_UNREAD, "C1")).toBe(NO_UNREAD);
  });
});

describe("canales sin leer de un servidor", () => {
  const state = applyUnreadSnapshot(snapshot, null);

  it("lista solo los canales de ese servidor", () => {
    expect(unreadChannelIdsInServer(state, "S1")).toEqual(["C1", "C2"]);
    expect(unreadChannelIdsInServer(state, "S9")).toEqual([]);
  });

  it("marcar el servidor saca sus canales y no toca los demás", () => {
    expect(Object.keys(markUnreadServerRead(state, "S1"))).toEqual(["C3"]);
  });

  it("devuelve el mismo estado si el servidor no tenía nada", () => {
    expect(markUnreadServerRead(state, "S9")).toBe(state);
  });
});

describe("hasAnyUnread", () => {
  it("dice si queda algún canal sin leer", () => {
    expect(hasAnyUnread(applyUnreadSnapshot(snapshot, null))).toBe(true);
    expect(hasAnyUnread(NO_UNREAD)).toBe(false);
  });
});

describe("snapshotHasUnreadChannel", () => {
  it("dice si el canal viene sin leer", () => {
    expect(snapshotHasUnreadChannel(snapshot, "C3")).toBe(true);
    expect(snapshotHasUnreadChannel(snapshot, "C9")).toBe(false);
  });
});

describe("flags por canal y por servidor", () => {
  const state = applyUnreadSnapshot(snapshot, null);

  it("expone los flags de cada canal", () => {
    expect(unreadFlagsByChannel(state).C2).toEqual({
      unread: true,
      mentionCount: 2,
    });
  });

  it("el servidor suma las menciones de sus canales", () => {
    expect(unreadFlagsByServer(state)).toEqual({
      S1: { unread: true, mentionCount: 2 },
      S2: { unread: true, mentionCount: 0 },
    });
  });

  it("un servidor sin canales sin leer no aparece", () => {
    expect(
      unreadFlagsByServer(markUnreadChannelRead(state, "C3")),
    ).not.toHaveProperty("S2");
  });
});

describe("createUnreadTracker", () => {
  function setup(markAllReadResult = true) {
    const markRead = vi.fn();
    const markAllRead = vi.fn(() => Promise.resolve(markAllReadResult));
    const onChange = vi.fn();
    const tracker = createUnreadTracker({ markRead, markAllRead, onChange });
    const latest = () => onChange.mock.lastCall?.[0];
    return { tracker, markRead, markAllRead, onChange, latest };
  }

  it("aplica el snapshot y los cambios en vivo", () => {
    const { tracker, markRead, latest } = setup();
    tracker.applySnapshot(snapshot);
    tracker.applyUpdate(update("C1", "S1", false));

    expect(Object.keys(latest())).toEqual(["C2", "C3"]);
    expect(markRead).not.toHaveBeenCalled();
  });

  it("abrir un canal lo apaga y lo marca leído", () => {
    const { tracker, markRead, latest } = setup();
    tracker.applySnapshot(snapshot);
    tracker.setOpenChannel("C2");

    expect(latest()).not.toHaveProperty("C2");
    expect(markRead).toHaveBeenCalledWith("C2");
  });

  it("abrir el mismo canal dos veces no lo marca de nuevo", () => {
    const { tracker, markRead } = setup();
    tracker.setOpenChannel("C1");
    tracker.setOpenChannel("C1");
    expect(markRead).toHaveBeenCalledTimes(1);
  });

  it("si el canal abierto se enciende, lo vuelve a marcar sin mostrarlo", () => {
    const { tracker, markRead, onChange } = setup();
    tracker.setOpenChannel("C1");
    markRead.mockClear();
    tracker.applyUpdate(update("C1", "S1", true));

    expect(markRead).toHaveBeenCalledWith("C1");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("si el snapshot trae el canal abierto, lo marca leído", () => {
    const { tracker, markRead, latest } = setup();
    tracker.setOpenChannel("C3");
    markRead.mockClear();
    tracker.applySnapshot(snapshot);

    expect(markRead).toHaveBeenCalledWith("C3");
    expect(latest()).not.toHaveProperty("C3");
  });

  it("marcar todo apaga todos los canales y avisa al servidor", async () => {
    const { tracker, markAllRead, latest } = setup();
    tracker.applySnapshot(snapshot);

    await expect(tracker.markAllRead()).resolves.toBe(true);
    expect(markAllRead).toHaveBeenCalledTimes(1);
    expect(latest()).toBe(NO_UNREAD);
  });

  it("si marcar todo falla, vuelven a aparecer los canales", async () => {
    const { tracker, latest } = setup(false);
    tracker.applySnapshot(snapshot);

    await expect(tracker.markAllRead()).resolves.toBe(false);
    expect(Object.keys(latest())).toEqual(["C1", "C2", "C3"]);
  });

  it("si falla, conserva lo que llegó mientras esperaba", async () => {
    let finish: (ok: boolean) => void = () => {};
    const onChange = vi.fn();
    const tracker = createUnreadTracker({
      markRead: vi.fn(),
      markAllRead: () => new Promise((resolve) => (finish = resolve)),
      onChange,
    });
    tracker.applySnapshot(snapshot);

    const pending = tracker.markAllRead();
    tracker.applyUpdate(update("C4", "S2", true, 1));
    finish(false);
    await pending;

    expect(onChange.mock.lastCall?.[0]).toMatchObject({
      C1: { serverId: "S1" },
      C4: { serverId: "S2", mentionCount: 1 },
    });
  });

  it("marcar un servidor apaga sus canales y avisa uno por uno", () => {
    const { tracker, markRead, latest } = setup();
    tracker.applySnapshot(snapshot);

    expect(tracker.markServerRead("S1")).toEqual(["C1", "C2"]);
    expect(Object.keys(latest())).toEqual(["C3"]);
    expect(markRead).toHaveBeenCalledTimes(2);
    expect(markRead).toHaveBeenCalledWith("C1");
    expect(markRead).toHaveBeenCalledWith("C2");
  });

  it("marcar un servidor sin nada sin leer no hace nada", () => {
    const { tracker, markRead, onChange } = setup();
    tracker.applySnapshot(snapshot);
    onChange.mockClear();

    expect(tracker.markServerRead("S9")).toEqual([]);
    expect(onChange).not.toHaveBeenCalled();
    expect(markRead).not.toHaveBeenCalled();
  });
});

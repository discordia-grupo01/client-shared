import { describe, expect, it } from "vitest";

import type {
  UnreadSnapshotPayload,
  UnreadUpdatedPayload,
} from "../domain/unread-state";
import {
  applyUnreadSnapshot,
  applyUnreadUpdate,
  markUnreadChannelRead,
  NO_UNREAD,
  snapshotHasUnreadChannel,
  unreadFlagsByChannel,
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

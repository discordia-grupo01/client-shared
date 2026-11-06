import { describe, expect, it } from "vitest";

import type { ServerSummary } from "./server";
import {
  markServerSuspended,
  suspendedServerIds,
  withoutSuspendedEntries,
  withoutSuspendedServers,
} from "./server-suspension";

function server(id: string, extra: Partial<ServerSummary> = {}): ServerSummary {
  return {
    id,
    name: id,
    icon_url: null,
    banner_url: null,
    owner_id: "owner",
    created_at: "2026-01-01T00:00:00Z",
    channels: [{ id: `${id}-general` } as ServerSummary["channels"][number]],
    categories: [],
    ...extra,
  };
}

describe("suspendedServerIds", () => {
  it("devuelve solo los suspendidos", () => {
    const ids = suspendedServerIds([
      server("a"),
      server("b", { suspended: true }),
      server("c", { suspended: false }),
    ]);
    expect([...ids]).toEqual(["b"]);
  });
});

describe("withoutSuspendedServers", () => {
  const items = [
    { id: 1, server_id: "a" },
    { id: 2, server_id: "b" },
    { id: 3, server_id: null },
  ];

  it("saca lo de los servidores suspendidos y deja los DMs", () => {
    expect(withoutSuspendedServers(items, new Set(["b"]))).toEqual([
      { id: 1, server_id: "a" },
      { id: 3, server_id: null },
    ]);
  });

  it("sin suspendidos devuelve la misma lista", () => {
    expect(withoutSuspendedServers(items, new Set())).toBe(items);
    expect(withoutSuspendedServers(items, new Set(["zzz"]))).toBe(items);
  });
});

describe("withoutSuspendedEntries", () => {
  const state = {
    "c-1": { serverId: "a", unread: true },
    "c-2": { serverId: "b", unread: true },
  };

  it("saca las entradas de servidores suspendidos", () => {
    expect(withoutSuspendedEntries(state, new Set(["b"]))).toEqual({
      "c-1": { serverId: "a", unread: true },
    });
  });

  it("si no hay nada que sacar devuelve el mismo objeto", () => {
    expect(withoutSuspendedEntries(state, new Set(["zzz"]))).toBe(state);
  });
});

describe("markServerSuspended", () => {
  it("lo marca y le saca canales y categorías, sin tocar al resto", () => {
    const [a, b] = markServerSuspended([server("a"), server("b")], "a");
    expect(a).toMatchObject({ suspended: true, channels: [], categories: [] });
    expect(b.suspended).toBeUndefined();
    expect(b.channels).toHaveLength(1);
  });
});

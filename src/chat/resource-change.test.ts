import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ResourceChangedPayload } from "../domain/resource-change";
import {
  createChangeBus,
  createRefreshCoalescer,
  isResourceChangedPayload,
  matchesChange,
} from "./resource-change";

const change = (
  overrides: Partial<ResourceChangedPayload> = {},
): ResourceChangedPayload => ({ resource: "members", ...overrides });

describe("isResourceChangedPayload", () => {
  it("acepta un recurso conocido", () => {
    expect(isResourceChangedPayload({ resource: "roles" })).toBe(true);
  });

  it("rechaza lo que no es un aviso", () => {
    expect(isResourceChangedPayload(null)).toBe(false);
    expect(isResourceChangedPayload("roles")).toBe(false);
    expect(isResourceChangedPayload({})).toBe(false);
    expect(isResourceChangedPayload({ resource: "otro" })).toBe(false);
  });
});

describe("matchesChange", () => {
  it("exige que el recurso esté entre los pedidos", () => {
    expect(matchesChange(change(), { resources: ["members"] })).toBe(true);
    expect(matchesChange(change(), { resources: ["roles"] })).toBe(false);
  });

  it("descarta otro servidor pero deja pasar un aviso sin servidor", () => {
    const filter = { resources: ["members" as const], serverId: "s1" };
    expect(matchesChange(change({ server_id: "s1" }), filter)).toBe(true);
    expect(matchesChange(change({ server_id: "s2" }), filter)).toBe(false);
    expect(matchesChange(change(), filter)).toBe(true);
  });

  it("descarta otro usuario pero deja pasar un aviso sin usuario", () => {
    const filter = { resources: ["profile" as const], userId: "u1" };
    expect(
      matchesChange(change({ resource: "profile", user_id: "u1" }), filter),
    ).toBe(true);
    expect(
      matchesChange(change({ resource: "profile", user_id: "u2" }), filter),
    ).toBe(false);
    expect(matchesChange(change({ resource: "profile" }), filter)).toBe(true);
  });

  it("filtra el backoffice por tipo", () => {
    const filter = {
      resources: ["backoffice" as const],
      kinds: ["reports" as const],
    };
    expect(
      matchesChange(
        change({ resource: "backoffice", kind: "reports" }),
        filter,
      ),
    ).toBe(true);
    expect(
      matchesChange(change({ resource: "backoffice", kind: "users" }), filter),
    ).toBe(false);
    expect(matchesChange(change({ resource: "backoffice" }), filter)).toBe(
      true,
    );
  });
});

describe("createChangeBus", () => {
  it("avisa solo a quien pidió ese recurso", () => {
    const bus = createChangeBus();
    const members = vi.fn();
    const roles = vi.fn();
    bus.subscribe({ resources: ["members"] }, members);
    bus.subscribe({ resources: ["roles"] }, roles);
    bus.publish(change({ server_id: "s1" }));
    expect(members).toHaveBeenCalledWith({
      resource: "members",
      server_id: "s1",
    });
    expect(roles).not.toHaveBeenCalled();
  });

  it("deja de avisar al darse de baja", () => {
    const bus = createChangeBus();
    const listener = vi.fn();
    const unsubscribe = bus.subscribe({ resources: ["members"] }, listener);
    unsubscribe();
    bus.publish(change());
    expect(listener).not.toHaveBeenCalled();
  });

  it("permite darse de baja desde el propio aviso", () => {
    const bus = createChangeBus();
    const second = vi.fn();
    const unsubscribe = bus.subscribe({ resources: ["members"] }, () =>
      unsubscribe(),
    );
    bus.subscribe({ resources: ["members"] }, second);
    bus.publish(change());
    bus.publish(change());
    expect(second).toHaveBeenCalledTimes(2);
  });
});

describe("createChangeBus.refreshAll", () => {
  it("avisa a todos los suscriptos, sin mirar el filtro", () => {
    const bus = createChangeBus();
    const members = vi.fn();
    const points = vi.fn();
    bus.subscribe({ resources: ["members"], serverId: "s1" }, members);
    bus.subscribe({ resources: ["points"] }, points);
    bus.refreshAll();
    expect(members).toHaveBeenCalledTimes(1);
    expect(points).toHaveBeenCalledTimes(1);
  });
});

describe("createRefreshCoalescer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("junta una ráfaga en una sola recarga", async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    const coalescer = createRefreshCoalescer(run, 100);
    coalescer.trigger();
    coalescer.trigger();
    coalescer.trigger();
    await vi.advanceTimersByTimeAsync(100);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("repite una vez si llega un aviso mientras recarga", async () => {
    let release: () => void = () => {};
    const run = vi
      .fn()
      .mockImplementationOnce(
        () => new Promise<void>((resolve) => (release = resolve)),
      )
      .mockResolvedValue(undefined);
    const coalescer = createRefreshCoalescer(run, 100);
    coalescer.trigger();
    await vi.advanceTimersByTimeAsync(100);
    expect(run).toHaveBeenCalledTimes(1);
    coalescer.trigger();
    await vi.advanceTimersByTimeAsync(100);
    expect(run).toHaveBeenCalledTimes(1);
    release();
    await vi.advanceTimersByTimeAsync(100);
    expect(run).toHaveBeenCalledTimes(2);
  });

  it("sigue andando aunque una recarga falle", async () => {
    const run = vi
      .fn()
      .mockRejectedValueOnce(new Error("sin red"))
      .mockResolvedValue(undefined);
    const coalescer = createRefreshCoalescer(run, 100);
    coalescer.trigger();
    await vi.advanceTimersByTimeAsync(100);
    coalescer.trigger();
    await vi.advanceTimersByTimeAsync(100);
    expect(run).toHaveBeenCalledTimes(2);
  });

  it("cancel descarta lo pendiente", async () => {
    const run = vi.fn();
    const coalescer = createRefreshCoalescer(run, 100);
    coalescer.trigger();
    coalescer.cancel();
    await vi.advanceTimersByTimeAsync(500);
    expect(run).not.toHaveBeenCalled();
  });
});

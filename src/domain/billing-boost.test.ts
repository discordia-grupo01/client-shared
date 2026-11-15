import { describe, expect, it } from "vitest";

import {
  activeBoostCount,
  balanceAfterBoost,
  type Boost,
  boostBlockReason,
  boostedServersPageParams,
  boostsPageParams,
  boostLevelChange,
  canAffordBoost,
  groupBoostsByServer,
  levelChangeIfBoosted,
  lostPerksIfRemoved,
  pointsMissingForBoost,
  serverBoosts,
} from "./billing-boost";

const boost = (
  id: string,
  serverId: string,
  status: Boost["status"],
): Boost => ({
  id,
  server_id: serverId,
  points: 100,
  status,
  status_detail: "",
  created_at: "2026-11-14T12:00:00Z",
  updated_at: "2026-11-14T12:00:00Z",
});

const boosts = [
  boost("b1", "club", "active"),
  boost("b2", "otro", "pending"),
  boost("b3", "club", "failed"),
  boost("b4", "club", "removed"),
  boost("b5", "club", "active"),
];

describe("serverBoosts", () => {
  it("deja los boosts del servidor sin los retirados", () => {
    expect(serverBoosts(boosts, "club").map((b) => b.id)).toEqual([
      "b1",
      "b3",
      "b5",
    ]);
  });
});

describe("activeBoostCount", () => {
  it("cuenta solo los activos, en un servidor o en todos", () => {
    expect(activeBoostCount(boosts, "club")).toBe(2);
    expect(activeBoostCount(boosts, "otro")).toBe(0);
    expect(activeBoostCount(boosts)).toBe(2);
  });
});

describe("groupBoostsByServer", () => {
  it("agrupa en el orden en que aparece cada servidor y saca los retirados", () => {
    expect(
      groupBoostsByServer(boosts).map((g) => [
        g.serverId,
        g.boosts.map((b) => b.id),
      ]),
    ).toEqual([
      ["club", ["b1", "b3", "b5"]],
      ["otro", ["b2"]],
    ]);
  });

  it("sin boosts no hay grupos", () => {
    expect(groupBoostsByServer([boost("b", "club", "removed")])).toEqual([]);
  });
});

describe("saldo para boostear", () => {
  it("alcanza con 100 puntos justos", () => {
    expect(canAffordBoost(100)).toBe(true);
    expect(pointsMissingForBoost(100)).toBe(0);
    expect(balanceAfterBoost(550)).toBe(450);
  });

  it("dice cuánto falta si no alcanza", () => {
    expect(canAffordBoost(40)).toBe(false);
    expect(pointsMissingForBoost(40)).toBe(60);
    expect(balanceAfterBoost(40)).toBe(0);
  });
});

describe("boostBlockReason", () => {
  it("deja boostear con saldo y lugar", () => {
    expect(boostBlockReason({ boostCount: 29, balance: 100 })).toBeNull();
  });

  it("frena por saldo", () => {
    expect(boostBlockReason({ boostCount: 7, balance: 40 })).toBe("balance");
  });

  it("el tope gana al saldo", () => {
    expect(boostBlockReason({ boostCount: 30, balance: 40 })).toBe("cap");
    expect(boostBlockReason({ boostCount: 30, balance: 500 })).toBe("cap");
  });
});

describe("boostLevelChange", () => {
  it("el boost 15 sube al nivel 2 y suma banner y 25 MB", () => {
    expect(levelChangeIfBoosted(14)).toEqual({
      from: 1,
      to: 2,
      gained: ["custom_banner", "larger_attachments"],
      lost: [],
    });
  });

  it("sin cruzar un umbral no cambia nada", () => {
    expect(levelChangeIfBoosted(7)).toEqual({
      from: 1,
      to: 1,
      gained: [],
      lost: [],
    });
  });

  it("retirar el boost 5 baja al nivel 0 y pierde los del nivel 1", () => {
    expect(lostPerksIfRemoved(5)).toEqual({
      from: 1,
      to: 0,
      gained: [],
      lost: ["extra_emoji_slots", "animated_icon"],
    });
  });

  it("no baja de cero boosts", () => {
    expect(boostLevelChange(0, -1)).toEqual({
      from: 0,
      to: 0,
      gained: [],
      lost: [],
    });
  });
});

describe("boostsPageParams", () => {
  it("pide la página de un servidor con offset 0-based", () => {
    expect(boostsPageParams("club", 1)).toEqual({
      server_id: "club",
      limit: "10",
      offset: "0",
    });
    expect(boostsPageParams("club", 2).offset).toBe("10");
    expect(boostsPageParams("club", 0).offset).toBe("0");
  });
});

describe("boostedServersPageParams", () => {
  it("pide 10 servidores por página", () => {
    expect(boostedServersPageParams(1)).toEqual({ limit: "10", offset: "0" });
    expect(boostedServersPageParams(3)).toEqual({ limit: "10", offset: "20" });
  });
});

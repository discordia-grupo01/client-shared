import { describe, expect, it } from "vitest";

import {
  BOOST_LEVEL_THRESHOLDS,
  BOOST_MAX_COUNT,
  BOOST_PERKS,
  boostLevelFor,
  boostPerksAddedAt,
  boostProgress,
  boostsRequiredFor,
  toServerBoostSummary,
  boostsMissingFor,
  nextBoostLevel,
  boostPerksForLevel,
  canSetServerBanner,
  canSetVanityUrl,
  canUseAnimatedServerIcon,
  hasBoostedBadge,
  hasBoostPerk,
  isBoostCapReached,
  isBoostPerk,
  requiredBoostLevelOf,
  toBoostLevel,
} from "./boost";
import { serverBoostCount, serverBoostLevel } from "./server";

describe("boostLevelFor", () => {
  it.each([
    [0, 0],
    [4, 0],
    [5, 1],
    [14, 1],
    [15, 2],
    [29, 2],
    [30, 3],
    [120, 3],
  ])("%i boosts dan nivel %i", (count, level) => {
    expect(boostLevelFor(count)).toBe(level);
  });
});

describe("toBoostLevel", () => {
  it.each([
    [undefined, 0],
    [null, 0],
    ["2", 0],
    [Number.NaN, 0],
    [-1, 0],
    [0, 0],
    [1, 1],
    [2.7, 2],
    [3, 3],
    [9, 3],
  ])("%s -> %i", (value, level) => {
    expect(toBoostLevel(value)).toBe(level);
  });
});

describe("serverBoostLevel", () => {
  it("toma 0 si servers todavía no manda el nivel", () => {
    expect(serverBoostLevel({})).toBe(0);
  });

  it("lee boost_level", () => {
    expect(serverBoostLevel({ boost_level: 2 })).toBe(2);
  });
});

describe("beneficios por nivel", () => {
  it("nivel 0 no desbloquea nada", () => {
    expect(boostPerksForLevel(0)).toEqual([]);
  });

  it("cada nivel suma los del anterior (mismo orden que servers)", () => {
    expect(boostPerksForLevel(1)).toEqual([
      "extra_emoji_slots",
      "animated_icon",
    ]);
    expect(boostPerksForLevel(2)).toEqual([
      "extra_emoji_slots",
      "animated_icon",
      "custom_banner",
      "larger_attachments",
    ]);
    expect(boostPerksForLevel(3)).toEqual([...BOOST_PERKS]);
  });

  it("ícono animado desde el nivel 1", () => {
    expect(canUseAnimatedServerIcon(0)).toBe(false);
    expect(canUseAnimatedServerIcon(1)).toBe(true);
  });

  it("banner (y sus fondos fijos) desde el nivel 2", () => {
    expect(canSetServerBanner(1)).toBe(false);
    expect(canSetServerBanner(2)).toBe(true);
    expect(canSetServerBanner(3)).toBe(true);
  });

  it("URL personalizada solo en el nivel 3", () => {
    expect(canSetVanityUrl(2)).toBe(false);
    expect(canSetVanityUrl(3)).toBe(true);
  });

  it("hasBoostPerk respeta el nivel de cada beneficio", () => {
    expect(hasBoostPerk(2, "boosted_badge")).toBe(false);
    expect(hasBoostPerk(3, "boosted_badge")).toBe(true);
  });

  it("isBoostPerk reconoce los valores de perks_unlocked", () => {
    expect(isBoostPerk("vanity_url")).toBe(true);
    expect(isBoostPerk("nitro")).toBe(false);
  });
});

describe("requiredBoostLevelOf", () => {
  it("lee el nivel de un 403 boost_level_required", () => {
    expect(
      requiredBoostLevelOf({
        reason: "boost_level_required",
        required_level: 2,
      }),
    ).toBe(2);
  });

  it("ignora otros errores", () => {
    expect(requiredBoostLevelOf({ reason: "name_taken" })).toBeUndefined();
    expect(requiredBoostLevelOf(undefined)).toBeUndefined();
  });

  it("ignora un nivel ausente o inválido", () => {
    expect(
      requiredBoostLevelOf({ reason: "boost_level_required" }),
    ).toBeUndefined();
    expect(
      requiredBoostLevelOf({
        reason: "boost_level_required",
        required_level: 0,
      }),
    ).toBeUndefined();
  });
});

describe("boostsMissingFor", () => {
  it("cuenta lo que falta para el umbral del nivel", () => {
    expect(boostsMissingFor(1, 3)).toBe(2);
    expect(boostsMissingFor(2, 3)).toBe(12);
    expect(boostsMissingFor(3, 29)).toBe(1);
  });

  it("no da negativo si ya llegó", () => {
    expect(boostsMissingFor(2, 20)).toBe(0);
  });
});

describe("serverBoostCount", () => {
  it("toma 0 si servers todavía no manda el contador", () => {
    expect(serverBoostCount({})).toBe(0);
    expect(serverBoostCount({ boost_count: 7 })).toBe(7);
  });
});

describe("nextBoostLevel", () => {
  it("da el nivel siguiente y nada en el máximo", () => {
    expect(nextBoostLevel(0)).toBe(1);
    expect(nextBoostLevel(2)).toBe(3);
    expect(nextBoostLevel(3)).toBeUndefined();
  });
});

describe("boostsRequiredFor", () => {
  it("da el umbral de cada nivel", () => {
    expect(
      [0, 1, 2, 3].map((level) => boostsRequiredFor(toBoostLevel(level))),
    ).toEqual([0, 5, 15, 30]);
  });
});

describe("boostPerksAddedAt", () => {
  it("da solo los beneficios que suma ese nivel", () => {
    expect(boostPerksAddedAt(2)).toEqual([
      "custom_banner",
      "larger_attachments",
    ]);
    expect(boostPerksAddedAt(0)).toEqual([]);
  });
});

describe("toServerBoostSummary", () => {
  it("lee la respuesta de servers", () => {
    expect(
      toServerBoostSummary({
        boost_count: 7,
        level: 1,
        perks_unlocked: ["extra_emoji_slots", "animated_icon", "otro"],
        next_level: { level: 2, boosts_required: 15, boosts_missing: 8 },
      }),
    ).toEqual({
      boost_count: 7,
      level: 1,
      perks_unlocked: ["extra_emoji_slots", "animated_icon"],
      next_level: { level: 2, boosts_required: 15, boosts_missing: 8 },
    });
  });

  it("en el nivel 3 no hay próximo nivel", () => {
    expect(
      toServerBoostSummary({ boost_count: 31, level: 3 }).next_level,
    ).toBeNull();
  });

  it("calcula lo que falta si la respuesta viene incompleta", () => {
    expect(toServerBoostSummary({ boost_count: 16 })).toEqual({
      boost_count: 16,
      level: 2,
      perks_unlocked: [
        "extra_emoji_slots",
        "animated_icon",
        "custom_banner",
        "larger_attachments",
      ],
      next_level: { level: 3, boosts_required: 30, boosts_missing: 14 },
    });
    expect(toServerBoostSummary(null).level).toBe(0);
  });
});

describe("boostProgress", () => {
  it("mide el camino hacia el próximo nivel desde cero boosts", () => {
    expect(boostProgress({ boost_count: 7, level: 1 })).toEqual({
      level: 1,
      boostCount: 7,
      nextLevel: 2,
      target: 15,
      missing: 8,
      ratio: 7 / 15,
    });
  });

  it("queda completo en el nivel máximo", () => {
    expect(boostProgress({ boost_count: 40, level: 3 })).toMatchObject({
      nextLevel: undefined,
      target: undefined,
      missing: 0,
      ratio: 1,
    });
  });
});

describe("tope de boosts", () => {
  it("es el umbral del último nivel", () => {
    expect(BOOST_MAX_COUNT).toBe(30);
    expect(BOOST_LEVEL_THRESHOLDS[BOOST_LEVEL_THRESHOLDS.length - 1]).toBe(
      BOOST_MAX_COUNT,
    );
  });

  it("se alcanza con 30 boosts y se libera al bajar de 30", () => {
    expect(isBoostCapReached(29)).toBe(false);
    expect(isBoostCapReached(30)).toBe(true);
    expect(isBoostCapReached(31)).toBe(true);
  });
});

describe("hasBoostedBadge", () => {
  it("solo en el nivel 3", () => {
    expect(hasBoostedBadge(2)).toBe(false);
    expect(hasBoostedBadge(3)).toBe(true);
  });
});

import { describe, expect, it } from "vitest";

import {
  BOOST_PERKS,
  boostLevelFor,
  boostPerksForLevel,
  canSetServerBanner,
  canSetVanityUrl,
  canUseAnimatedServerIcon,
  hasBoostPerk,
  isBoostPerk,
  requiredBoostLevelOf,
  toBoostLevel,
} from "./boost";
import { serverBoostLevel } from "./server";

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

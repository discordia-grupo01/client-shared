import { describe, expect, it } from "vitest";

import { BOOST_PERKS } from "../domain/boost";

import {
  BOOST_PERK_LABELS,
  boostLevelLabel,
  boostLevelRequiredMessageFor,
  boostPerkAvailableFrom,
} from "./boost";

describe("textos de boosts", () => {
  it("cada beneficio tiene nombre", () => {
    for (const perk of BOOST_PERKS) {
      expect(BOOST_PERK_LABELS[perk]).not.toBe("");
    }
  });

  it("el de adjuntos sale del límite real", () => {
    expect(BOOST_PERK_LABELS.larger_attachments).toBe(
      "Adjuntos de hasta 25 MB",
    );
  });

  it("nombra el nivel", () => {
    expect(boostLevelLabel(2)).toBe("Nivel 2");
  });

  it("dice desde qué nivel está disponible cada beneficio", () => {
    expect(boostPerkAvailableFrom("custom_banner")).toBe(
      "Disponible desde el nivel 2 de boosts.",
    );
    expect(boostPerkAvailableFrom("animated_icon")).toBe(
      "Disponible desde el nivel 1 de boosts.",
    );
  });

  it("traduce el 403 boost_level_required con el nivel que pide", () => {
    expect(
      boostLevelRequiredMessageFor({
        reason: "boost_level_required",
        required_level: 2,
      }),
    ).toBe("Este servidor necesita el nivel 2 de boosts para eso.");
  });

  it("no traduce otros 403", () => {
    expect(
      boostLevelRequiredMessageFor({ reason: "forbidden" }),
    ).toBeUndefined();
  });
});

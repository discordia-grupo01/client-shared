import { describe, expect, it } from "vitest";

import { BOOST_PERKS } from "../domain/boost";

import {
  BOOST_PERK_LABELS,
  boostCountLabel,
  boostLevelLabel,
  boostLevelRequiredMessageFor,
  boostPerkAvailableFrom,
  boostPerkLevelLabel,
  boostPerkUnlockProgress,
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

  it("dice cuánto falta para desbloquear un beneficio", () => {
    expect(boostPerkUnlockProgress("custom_banner", 3)).toBe(
      "Faltan 12 boosts para el nivel 2",
    );
    expect(boostPerkUnlockProgress("animated_icon", 4)).toBe(
      "Falta 1 boost para el nivel 1",
    );
    expect(boostPerkUnlockProgress("custom_banner", 15)).toBe(
      "Se desbloquea en el nivel 2",
    );
  });

  it("nombra el nivel al que pertenece un beneficio", () => {
    expect(boostPerkLevelLabel("animated_icon")).toBe("Beneficio del nivel 1");
    expect(boostPerkLevelLabel("custom_banner")).toBe("Beneficio del nivel 2");
  });

  it("cuenta boosts en singular y plural", () => {
    expect(boostCountLabel(1)).toBe("1 boost");
    expect(boostCountLabel(3)).toBe("3 boosts");
  });
});

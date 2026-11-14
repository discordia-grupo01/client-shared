import { describe, expect, it } from "vitest";

import { BOOST_PERKS } from "../domain/boost";

import {
  BOOST_PERK_LABELS,
  BOOST_SHOWCASE_COPY,
  BOOST_TABLE_NOTE,
  BOOST_TABLE_ROW_LABELS,
  boostActivePerksLabel,
  boostCountLabel,
  boostLevelColumnDetail,
  boostLevelUnlocks,
  boostLockedChipLabel,
  boostProgressAriaLabel,
  boostProgressCountLabel,
  boostsToNextLevelParts,
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

describe("textos de la sección Boosts", () => {
  it("nombra los beneficios activos con la conjunción correcta", () => {
    expect(boostActivePerksLabel(0)).toBe(
      "Todavía no tiene beneficios de boosts.",
    );
    expect(boostActivePerksLabel(1)).toBe(
      "Activos: más emojis e ícono animado.",
    );
    expect(boostActivePerksLabel(2)).toBe(
      "Activos: más emojis, ícono animado, banner del servidor y adjuntos de 25 MB.",
    );
    expect(boostActivePerksLabel(3)).toBe(
      "Activos: todos los beneficios de boosts.",
    );
  });

  it("parte lo que falta para resaltar la cantidad", () => {
    expect(boostsToNextLevelParts(2, 7)).toEqual({
      lead: "Faltan",
      amount: "8 boosts",
      tail: "para llegar al nivel 2",
    });
    expect(boostsToNextLevelParts(1, 4).lead).toBe("Falta");
  });

  it("cuenta el progreso", () => {
    expect(boostProgressCountLabel(7, 15)).toBe("7 / 15");
    expect(boostProgressAriaLabel(2, 7)).toBe("7 de 15 boosts para el nivel 2");
  });

  it("lista lo que destraba el próximo nivel", () => {
    expect(boostLevelUnlocks(2)).toEqual({
      lead: "Destraba en el nivel 2:",
      perks: "banner del servidor · adjuntos de 25 MB",
    });
  });

  it("describe cada columna de la tabla", () => {
    expect(boostLevelColumnDetail(0, false)).toBe("Sin boosts");
    expect(boostLevelColumnDetail(1, true)).toBe("5 boosts · actual");
    expect(boostLevelColumnDetail(3, false)).toBe("30 boosts");
  });

  it("tiene textos para cada fila y cada tarjeta", () => {
    for (const perk of BOOST_PERKS) {
      expect(BOOST_TABLE_ROW_LABELS[perk].label).not.toBe("");
      expect(BOOST_TABLE_ROW_LABELS[perk].shortLabel).not.toBe("");
      expect(BOOST_SHOWCASE_COPY[perk].title).not.toBe("");
    }
    expect(BOOST_TABLE_NOTE).toContain("50 MB");
  });

  it("arma el chip de un beneficio bloqueado", () => {
    expect(boostLockedChipLabel(2, 7)).toBe("Nivel 2 · faltan 8");
    expect(boostLockedChipLabel(3, 29)).toBe("Nivel 3 · falta 1");
    expect(boostLockedChipLabel(2, 7, true)).toBe("Faltan 8");
  });
});

import { describe, expect, it } from "vitest";

import { BOOST_PERKS } from "../domain/boost";

import {
  ANIMATED_SERVER_ICON_COPY,
  BOOST_PROGRESS_STRIP_COPY,
  boostBenefitChip,
  boostBenefitLockedLabel,
  boostsForLevelParts,
  BOOSTED_BADGE_COPY,
  boostedBadgeTooltip,
  BOOST_MAX_LEVEL_NOTE,
  BOOST_PERK_LABELS,
  BOOST_SHOWCASE_ART_COPY,
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
  boostPerksSentence,
  boostsSectionTitleFor,
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

  it("los dibujos de las tarjetas usan los límites reales", () => {
    expect(BOOST_SHOWCASE_ART_COPY.extraEmojiSlots).toBe("+20");
    expect(BOOST_SHOWCASE_ART_COPY.attachmentLimit).toBe("25 MB");
    expect(BOOST_SHOWCASE_ART_COPY.invitePath).toBe("/invite/");
  });

  it("la insignia describe la marca en el perfil", () => {
    expect(BOOST_SHOWCASE_COPY.boosted_badge.detail).toBe(
      "Una marca permanente distingue al servidor en su perfil.",
    );
  });

  it("nombra el servidor en el título de la sección", () => {
    expect(boostsSectionTitleFor("Taller")).toBe("Boosts de Taller");
  });

  it("une los beneficios en una frase", () => {
    expect(boostPerksSentence(["custom_banner", "larger_attachments"])).toBe(
      "banner del servidor y adjuntos de 25 MB",
    );
    expect(boostPerksSentence(["animated_icon"])).toBe("ícono animado");
  });

  it("arma el chip de un beneficio bloqueado", () => {
    expect(boostLockedChipLabel(2, 7)).toBe("Nivel 2 · faltan 8");
    expect(boostLockedChipLabel(3, 29)).toBe("Nivel 3 · falta 1");
    expect(boostLockedChipLabel(2, 7, true)).toBe("Faltan 8");
    expect(boostLockedChipLabel(3, 29, true)).toBe("Falta 1");
  });
});

describe("ficha de nivel de un beneficio", () => {
  it("bloqueada: nivel que pide y cuántos boosts faltan", () => {
    expect(boostBenefitChip("custom_banner", 1, 7)).toEqual({
      level: 2,
      locked: true,
      label: "Nivel 2",
      detail: "· faltan 8",
      title: "Disponible desde el nivel 2 de boosts.",
      accessibilityLabel: "Faltan 8 boosts para el nivel 2",
    });
  });

  it("usa el singular cuando falta un solo boost", () => {
    const chip = boostBenefitChip("vanity_url", 2, 29);
    expect(chip.detail).toBe("· falta 1");
    expect(chip.accessibilityLabel).toBe("Falta 1 boost para el nivel 3");
  });

  it("desbloqueada: solo el nivel, sin detalle", () => {
    expect(boostBenefitChip("animated_icon", 1, 7)).toEqual({
      level: 1,
      locked: false,
      label: "Nivel 1",
      detail: "",
      title: "Beneficio del nivel 1",
      accessibilityLabel: "Beneficio del nivel 1",
    });
  });

  it("sigue bloqueada sin decir 'faltan 0' si el nivel va atrasado", () => {
    const chip = boostBenefitChip("custom_banner", 1, 15);
    expect(chip.locked).toBe(true);
    expect(chip.detail).toBe("");
    expect(chip.accessibilityLabel).toBe("Se desbloquea en el nivel 2");
  });

  it("nombra el beneficio bloqueado para el grupo accesible", () => {
    expect(boostBenefitLockedLabel("custom_banner")).toBe(
      "Banner del servidor: se desbloquea en el nivel 2",
    );
    expect(boostBenefitLockedLabel("vanity_url")).toBe(
      "URL de invitación personalizada: se desbloquea en el nivel 3",
    );
  });
});

describe("franja de progreso del perfil", () => {
  it("parte la frase corta para resaltar los boosts que faltan", () => {
    expect(boostsForLevelParts(2, 7)).toEqual({
      lead: "Faltan",
      amount: "8 boosts",
      tail: "para el nivel 2",
    });
    expect(boostsForLevelParts(3, 29).lead).toBe("Falta");
  });

  it("mantiene la frase larga de la tarjeta de estado", () => {
    expect(boostsToNextLevelParts(2, 7).tail).toBe("para llegar al nivel 2");
  });

  it("tiene el link a los beneficios", () => {
    expect(BOOST_PROGRESS_STRIP_COPY.benefitsLink).toBe(
      "Ver qué suma cada nivel",
    );
  });
});

describe("ícono animado en el perfil", () => {
  it("dice desde qué nivel se puede usar un GIF", () => {
    expect(ANIMATED_SERVER_ICON_COPY.locked).toBe(
      "En el nivel 1, la foto del servidor puede ser un GIF que se mueve en la lista de servidores.",
    );
  });
});

describe("nivel máximo", () => {
  it("avisa que retirar un boost vuelve a habilitar boostear", () => {
    expect(BOOST_MAX_LEVEL_NOTE).toBe(
      "Si alguien retira un boost, el servidor baja al nivel 2 y se puede volver a boostear.",
    );
  });
});

describe("insignia Servidor Boosteado", () => {
  it("se nombra igual en el cartel y en el aria-label", () => {
    expect(BOOSTED_BADGE_COPY.label).toBe("Servidor Boosteado");
    expect(boostedBadgeTooltip(3)).toBe("Servidor Boosteado · Nivel 3");
  });
});

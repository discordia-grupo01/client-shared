import {
  BOOSTED_MAX_ATTACHMENT_MB,
  PREMIUM_MAX_ATTACHMENT_MB,
} from "../constants/attachments";
import { BASE_EMOJI_SLOTS, BOOSTED_EMOJI_SLOTS } from "../constants/boost";
import type { ApiErrorDetails } from "../domain/errors";
import { INVITE_PATH } from "../format/invite-link";
import {
  BOOST_PERK_LEVEL,
  type BoostLevel,
  type BoostPerk,
  boostPerksAddedAt,
  boostPerksForLevel,
  boostsMissingFor,
  boostsRequiredFor,
  hasBoostPerk,
  MAX_BOOST_LEVEL,
  requiredBoostLevelOf,
} from "../domain/boost";

export const BOOST_PERK_LABELS: Readonly<Record<BoostPerk, string>> = {
  extra_emoji_slots: "20 emojis personalizados más",
  animated_icon: "Ícono animado",
  custom_banner: "Banner del servidor",
  larger_attachments: `Adjuntos de hasta ${BOOSTED_MAX_ATTACHMENT_MB} MB`,
  vanity_url: "URL de invitación personalizada",
  boosted_badge: "Insignia Servidor Boosteado",
};

export function boostLevelLabel(level: BoostLevel): string {
  return `Nivel ${level}`;
}

export function boostPerkAvailableFrom(perk: BoostPerk): string {
  return `Disponible desde el nivel ${BOOST_PERK_LEVEL[perk]} de boosts.`;
}

export function boostsUntilLevelLabel(
  level: Exclude<BoostLevel, 0>,
  boostCount: number,
): string {
  const missing = boostsMissingFor(level, boostCount);
  if (missing === 0) return `Se desbloquea en el nivel ${level}`;
  if (missing === 1) return `Falta 1 boost para el nivel ${level}`;
  return `Faltan ${missing} boosts para el nivel ${level}`;
}

export function boostPerkUnlockProgress(
  perk: BoostPerk,
  boostCount: number,
): string {
  return boostsUntilLevelLabel(BOOST_PERK_LEVEL[perk], boostCount);
}

export function boostCountLabel(boostCount: number): string {
  return boostCount === 1 ? "1 boost" : `${boostCount} boosts`;
}

export function boostPerkLevelLabel(perk: BoostPerk): string {
  return `Beneficio del nivel ${BOOST_PERK_LEVEL[perk]}`;
}

export const ANIMATED_SERVER_ICON_UNLOCKED =
  "El ícono también puede ser un GIF.";

export const ANIMATED_SERVER_ICON_LOCKED = `El ícono animado (GIF) se desbloquea en el nivel ${BOOST_PERK_LEVEL.animated_icon} de boosts.`;

export function boostLevelRequiredMessage(
  level: Exclude<BoostLevel, 0>,
): string {
  return `Este servidor necesita el nivel ${level} de boosts para eso.`;
}

export function boostLevelRequiredMessageFor(
  details: ApiErrorDetails | undefined,
): string | undefined {
  const level = requiredBoostLevelOf(details);
  return level === undefined ? undefined : boostLevelRequiredMessage(level);
}

export function boostsSectionTitleFor(serverName: string): string {
  return `Boosts de ${serverName}`;
}

export const BOOSTS_SECTION_DESCRIPTION =
  "Cada boost suma al servidor y desbloquea beneficios para todos los miembros.";
export const BOOSTS_LOAD_ERROR = "No pudimos cargar los boosts del servidor.";

export const BOOST_PERK_SHORT_LABELS: Readonly<Record<BoostPerk, string>> = {
  extra_emoji_slots: "más emojis",
  animated_icon: "ícono animado",
  custom_banner: "banner del servidor",
  larger_attachments: `adjuntos de ${BOOSTED_MAX_ATTACHMENT_MB} MB`,
  vanity_url: "URL personalizada",
  boosted_badge: "insignia Servidor Boosteado",
};

function joinWithAnd(items: readonly string[]): string {
  if (items.length <= 1) return items.join("");
  const last = items[items.length - 1];
  const conjunction = /^(i|í|hi(?![aeo]))/i.test(last) ? "e" : "y";
  return `${items.slice(0, -1).join(", ")} ${conjunction} ${last}`;
}

export function boostPerksSentence(perks: readonly BoostPerk[]): string {
  return joinWithAnd(perks.map((perk) => BOOST_PERK_SHORT_LABELS[perk]));
}

export function boostActivePerksLabel(level: BoostLevel): string {
  if (level === 0) return "Todavía no tiene beneficios de boosts.";
  if (level === 3) return "Activos: todos los beneficios de boosts.";
  return `Activos: ${boostPerksSentence(boostPerksForLevel(level))}.`;
}

export const BOOST_MAX_LEVEL_DETAIL =
  "Este servidor tiene todos los beneficios de boosts.";

export const BOOSTED_BADGE_COPY = {
  label: "Servidor Boosteado",
  caption: "Insignia",
} as const;

/** "Servidor Boosteado · Nivel 3" */
export function boostedBadgeTooltip(level: BoostLevel): string {
  return `${BOOSTED_BADGE_COPY.label} · ${boostLevelLabel(level)}`;
}

export const BOOST_MAX_LEVEL_NOTE = `Si alguien retira un boost, el servidor baja al nivel ${MAX_BOOST_LEVEL - 1} y se puede volver a boostear.`;

export interface BoostsMissingParts {
  lead: string;
  amount: string;
  tail: string;
}

function boostsMissingParts(
  level: Exclude<BoostLevel, 0>,
  boostCount: number,
  tail: string,
): BoostsMissingParts {
  const missing = boostsMissingFor(level, boostCount);
  return {
    lead: missing === 1 ? "Falta" : "Faltan",
    amount: boostCountLabel(missing),
    tail,
  };
}

export function boostsToNextLevelParts(
  level: Exclude<BoostLevel, 0>,
  boostCount: number,
): BoostsMissingParts {
  return boostsMissingParts(level, boostCount, `para llegar al nivel ${level}`);
}

export function boostsForLevelParts(
  level: Exclude<BoostLevel, 0>,
  boostCount: number,
): BoostsMissingParts {
  return boostsMissingParts(level, boostCount, `para el nivel ${level}`);
}

export const BOOST_PROGRESS_STRIP_COPY = {
  ariaLabel: "Beneficios de boosts",
  benefitsLink: "Ver qué suma cada nivel",
} as const;

/** "7 / 15" */
export function boostProgressCountLabel(
  boostCount: number,
  target: number,
): string {
  return `${boostCount} / ${target}`;
}

export function boostProgressAriaLabel(
  level: Exclude<BoostLevel, 0>,
  boostCount: number,
): string {
  return `${boostCount} de ${boostsRequiredFor(level)} boosts para el nivel ${level}`;
}

export function boostLevelUnlocks(level: Exclude<BoostLevel, 0>): {
  lead: string;
  perks: string;
} {
  return {
    lead: `Destraba en el nivel ${level}:`,
    perks: boostPerksAddedAt(level)
      .map((perk) => BOOST_PERK_SHORT_LABELS[perk])
      .join(" · "),
  };
}

export const BOOST_TABLE_ROW_LABELS: Readonly<
  Record<BoostPerk, { label: string; shortLabel: string }>
> = {
  extra_emoji_slots: { label: "Emojis personalizados", shortLabel: "Emojis" },
  animated_icon: { label: "Ícono animado (GIF)", shortLabel: "Ícono animado" },
  custom_banner: { label: "Banner del servidor", shortLabel: "Banner" },
  larger_attachments: {
    label: "Adjuntos en canales",
    shortLabel: "Adjuntos",
  },
  vanity_url: {
    label: "URL de invitación personalizada",
    shortLabel: "URL propia",
  },
  boosted_badge: {
    label: "Insignia Servidor Boosteado",
    shortLabel: "Insignia",
  },
};

export function boostLevelShortLabel(level: BoostLevel): string {
  return `Nv. ${level}`;
}

export function boostLevelColumnDetail(
  level: BoostLevel,
  isCurrent: boolean,
): string {
  const base =
    level === 0 ? "Sin boosts" : boostCountLabel(boostsRequiredFor(level));
  return isCurrent ? `${base} · actual` : base;
}

export const BOOST_TABLE_NOTE = `Los ${BOOSTED_MAX_ATTACHMENT_MB} MB valen en los canales del servidor. Si un miembro tiene Premium, se aplica siempre el límite mayor: ${PREMIUM_MAX_ATTACHMENT_MB} MB.`;
export const BOOST_TABLE_NOTE_SHORT = `Con Premium, cada miembro tiene siempre ${PREMIUM_MAX_ATTACHMENT_MB} MB de adjuntos.`;

export const BOOST_SHOWCASE_COPY: Readonly<
  Record<BoostPerk, { title: string; detail: string }>
> = {
  extra_emoji_slots: {
    title: "20 emojis personalizados más",
    detail: "El servidor puede tener hasta 70 emojis propios en vez de 50.",
  },
  animated_icon: {
    title: "Ícono del servidor animado",
    detail: "El ícono se mueve en la lista de servidores.",
  },
  custom_banner: {
    title: "Banner personalizado",
    detail: "Una imagen propia arriba de la lista de canales.",
  },
  larger_attachments: {
    title: `Adjuntos de hasta ${BOOSTED_MAX_ATTACHMENT_MB} MB`,
    detail: "Para todos los miembros, en los canales del servidor.",
  },
  vanity_url: {
    title: "URL de invitación personalizada",
    detail: "Un link corto y fácil de recordar para invitar.",
  },
  boosted_badge: {
    title: "Insignia Servidor Boosteado",
    detail: "Una marca permanente distingue al servidor en su perfil.",
  },
};

export const BOOST_SHOWCASE_ART_COPY = {
  extraEmojiSlots: `+${BOOSTED_EMOJI_SLOTS - BASE_EMOJI_SLOTS}`,
  serverList: "Lista de servidores",
  animatedIconHint: "El ícono puede ser un GIF",
  attachmentKind: "PDF",
  attachmentName: "apuntes.pdf",
  attachmentUsed: "20 MB de",
  attachmentLimit: `${BOOSTED_MAX_ATTACHMENT_MB} MB`,
  invite: "Invitación",
  invitePath: `${INVITE_PATH}/`,
  badge: "Servidor Boosteado",
} as const;

function missingBoostsLabel(missing: number): string {
  return missing === 1 ? "falta 1" : `faltan ${missing}`;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function boostLockedChipLabel(
  level: Exclude<BoostLevel, 0>,
  boostCount: number,
  short = false,
): string {
  const missing = missingBoostsLabel(boostsMissingFor(level, boostCount));
  if (short) return capitalize(missing);
  return `${boostLevelLabel(level)} · ${missing}`;
}

export interface BoostBenefitChipCopy {
  level: Exclude<BoostLevel, 0>;
  locked: boolean;
  label: string;
  detail: string;
  title: string;
  accessibilityLabel: string;
}

export function boostBenefitChip(
  perk: BoostPerk,
  level: BoostLevel,
  boostCount: number,
): BoostBenefitChipCopy {
  const perkLevel = BOOST_PERK_LEVEL[perk];
  const label = boostLevelLabel(perkLevel);
  if (hasBoostPerk(level, perk)) {
    const title = boostPerkLevelLabel(perk);
    return {
      level: perkLevel,
      locked: false,
      label,
      detail: "",
      title,
      accessibilityLabel: title,
    };
  }
  const missing = boostsMissingFor(perkLevel, boostCount);
  return {
    level: perkLevel,
    locked: true,
    label,
    detail: missing === 0 ? "" : `· ${missingBoostsLabel(missing)}`,
    title: boostPerkAvailableFrom(perk),
    accessibilityLabel: boostsUntilLevelLabel(perkLevel, boostCount),
  };
}

export function boostBenefitLockedLabel(perk: BoostPerk): string {
  return `${BOOST_PERK_LABELS[perk]}: se desbloquea en el nivel ${BOOST_PERK_LEVEL[perk]}`;
}

export const SERVER_BANNER_BENEFIT_COPY = {
  title: BOOST_PERK_LABELS.custom_banner,
  locked: "Mostrá una imagen propia arriba de la lista de canales.",
} as const;

export const ANIMATED_SERVER_ICON_COPY = {
  title: "Ícono del servidor animado",
  unlocked:
    "Ya podés usar un GIF como foto del servidor. Se mueve en la lista de servidores.",
  locked: `En el nivel ${BOOST_PERK_LEVEL.animated_icon}, la foto del servidor puede ser un GIF que se mueve en la lista de servidores.`,
  badge: "GIF",
  upload: "Subir un GIF",
} as const;

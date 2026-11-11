import { BOOSTED_MAX_ATTACHMENT_MB } from "../constants/attachments";
import type { ApiErrorDetails } from "../domain/errors";
import {
  BOOST_PERK_LEVEL,
  type BoostLevel,
  type BoostPerk,
  boostsMissingFor,
  requiredBoostLevelOf,
} from "../domain/boost";

export const BOOST_PERK_LABELS: Readonly<Record<BoostPerk, string>> = {
  extra_emoji_slots: "20 lugares más para emojis",
  animated_icon: "Ícono animado",
  custom_banner: "Banner del servidor",
  larger_attachments: `Adjuntos de hasta ${BOOSTED_MAX_ATTACHMENT_MB} MB`,
  vanity_url: "URL de invitación personalizada",
  boosted_badge: "Insignia «Servidor Boosteado»",
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

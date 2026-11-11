import type { ApiErrorDetails } from "./errors";
import { reasonOf } from "./errors";

/**
 * Nivel de boost de un servidor
 */
export type BoostLevel = 0 | 1 | 2 | 3;

export const MAX_BOOST_LEVEL: BoostLevel = 3;

const BOOST_LEVELS: readonly BoostLevel[] = [0, 1, 2, 3];

export const BOOST_LEVEL_THRESHOLDS = [5, 15, 30] as const;

export const BOOST_PERKS = [
  "extra_emoji_slots",
  "animated_icon",
  "custom_banner",
  "larger_attachments",
  "vanity_url",
  "boosted_badge",
] as const;

export type BoostPerk = (typeof BOOST_PERKS)[number];

export const BOOST_PERK_LEVEL: Readonly<
  Record<BoostPerk, Exclude<BoostLevel, 0>>
> = {
  extra_emoji_slots: 1,
  animated_icon: 1,
  custom_banner: 2,
  larger_attachments: 2,
  vanity_url: 3,
  boosted_badge: 3,
};

export function isBoostPerk(value: string): value is BoostPerk {
  return (BOOST_PERKS as readonly string[]).includes(value);
}

export function toBoostLevel(value: unknown): BoostLevel {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return BOOST_LEVELS[Math.min(Math.floor(value), MAX_BOOST_LEVEL)] ?? 0;
}

export function boostLevelFor(boostCount: number): BoostLevel {
  const reached = BOOST_LEVEL_THRESHOLDS.filter(
    (threshold) => boostCount >= threshold,
  ).length;
  return toBoostLevel(reached);
}

export function nextBoostLevel(
  level: BoostLevel,
): Exclude<BoostLevel, 0> | undefined {
  if (level === 0) return 1;
  if (level === 1) return 2;
  if (level === 2) return 3;
  return undefined;
}

export function boostsMissingFor(
  level: Exclude<BoostLevel, 0>,
  boostCount: number,
): number {
  return Math.max(0, BOOST_LEVEL_THRESHOLDS[level - 1] - boostCount);
}

export function hasBoostPerk(level: BoostLevel, perk: BoostPerk): boolean {
  return level >= BOOST_PERK_LEVEL[perk];
}

export function boostPerksForLevel(level: BoostLevel): BoostPerk[] {
  return BOOST_PERKS.filter((perk) => hasBoostPerk(level, perk));
}

export function canUseAnimatedServerIcon(level: BoostLevel): boolean {
  return hasBoostPerk(level, "animated_icon");
}

export function canSetServerBanner(level: BoostLevel): boolean {
  return hasBoostPerk(level, "custom_banner");
}

export function canSetVanityUrl(level: BoostLevel): boolean {
  return hasBoostPerk(level, "vanity_url");
}

export function requiredBoostLevelOf(
  details: ApiErrorDetails | undefined,
): Exclude<BoostLevel, 0> | undefined {
  if (reasonOf(details) !== "boost_level_required") return undefined;
  const level = toBoostLevel(details?.required_level);
  return level === 0 ? undefined : level;
}

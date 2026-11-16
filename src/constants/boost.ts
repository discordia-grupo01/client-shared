import {
  BOOST_LEVELS,
  BOOST_PERKS,
  type BoostLevel,
  type BoostPerk,
  hasBoostPerk,
} from "../domain/boost";

import {
  BOOSTED_MAX_ATTACHMENT_MB,
  MAX_ATTACHMENT_MB,
  PREMIUM_MAX_ATTACHMENT_MB,
} from "./attachments";

export const BOOST_COST_POINTS = 100;

export const BOOST_STATUS_POLL_MS = 4_000;

export const BOOST_STATUS_TIMEOUT_MS = 30_000;

export const BOOSTS_LIST_MAX_LIMIT = 100;

export const BOOSTS_PAGE_SIZE = 10;

export const BOOSTED_SERVERS_PAGE_SIZE = 10;

export const BOOST_SECTION_TABS = ["boost", "benefits"] as const;

export type BoostSectionTab = (typeof BOOST_SECTION_TABS)[number];

export const BASE_EMOJI_SLOTS = 50;
export const BOOSTED_EMOJI_SLOTS = 70;

export function emojiSlotsFor(level: BoostLevel): number {
  return hasBoostPerk(level, "extra_emoji_slots")
    ? BOOSTED_EMOJI_SLOTS
    : BASE_EMOJI_SLOTS;
}

export function serverAttachmentMbFor(
  level: BoostLevel,
  premium = false,
): number {
  if (premium) return PREMIUM_MAX_ATTACHMENT_MB;
  return hasBoostPerk(level, "larger_attachments")
    ? BOOSTED_MAX_ATTACHMENT_MB
    : MAX_ATTACHMENT_MB;
}

export interface AttachmentLimitOptions {
  premium?: boolean;
  serverLevel?: BoostLevel;
}

export function attachmentLimitMbFor({
  premium = false,
  serverLevel,
}: AttachmentLimitOptions = {}): number {
  if (serverLevel === undefined) {
    return premium ? PREMIUM_MAX_ATTACHMENT_MB : MAX_ATTACHMENT_MB;
  }
  return serverAttachmentMbFor(serverLevel, premium);
}

export function canBoostAttachmentLimit({
  premium = false,
  serverLevel,
}: AttachmentLimitOptions = {}): boolean {
  return (
    !premium &&
    serverLevel !== undefined &&
    !hasBoostPerk(serverLevel, "larger_attachments")
  );
}

export type BoostTableCell =
  { kind: "amount"; value: string } | { kind: "check"; included: boolean };

export interface BoostTableRow {
  perk: BoostPerk;
  cells: readonly BoostTableCell[];
}

function cellFor(perk: BoostPerk, level: BoostLevel): BoostTableCell {
  if (perk === "extra_emoji_slots") {
    return { kind: "amount", value: String(emojiSlotsFor(level)) };
  }
  if (perk === "larger_attachments") {
    return { kind: "amount", value: `${serverAttachmentMbFor(level)} MB` };
  }
  return { kind: "check", included: hasBoostPerk(level, perk) };
}

export const BOOST_TABLE_ROWS: readonly BoostTableRow[] = BOOST_PERKS.map(
  (perk) => ({
    perk,
    cells: BOOST_LEVELS.map((level) => cellFor(perk, level)),
  }),
);

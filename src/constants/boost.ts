import {
  BOOST_LEVELS,
  BOOST_PERKS,
  type BoostLevel,
  type BoostPerk,
  hasBoostPerk,
} from "../domain/boost";

import { BOOSTED_MAX_ATTACHMENT_MB, MAX_ATTACHMENT_MB } from "./attachments";

export const BASE_EMOJI_SLOTS = 50;
export const BOOSTED_EMOJI_SLOTS = 70;

export function emojiSlotsFor(level: BoostLevel): number {
  return hasBoostPerk(level, "extra_emoji_slots")
    ? BOOSTED_EMOJI_SLOTS
    : BASE_EMOJI_SLOTS;
}

export function serverAttachmentMbFor(level: BoostLevel): number {
  return hasBoostPerk(level, "larger_attachments")
    ? BOOSTED_MAX_ATTACHMENT_MB
    : MAX_ATTACHMENT_MB;
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

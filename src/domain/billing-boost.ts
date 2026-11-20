import { BOOST_COST_POINTS } from "../constants/boost";
import { DEFAULT_PAGE_SIZE } from "../format/pagination";
import type { BillingTone } from "./billing";
import {
  type BoostLevel,
  type BoostPerk,
  boostLevelFor,
  boostPerksForLevel,
  isBoostCapReached,
} from "./boost";

export type BoostStatus = "pending" | "active" | "failed" | "removed";

export interface Boost {
  id: string;
  server_id: string;
  points: number;
  status: BoostStatus;
  status_detail: string;
  created_at: string;
  updated_at: string;
}

export interface BoostsResponse {
  boosts: Boost[];
}

export interface BoostPage {
  boosts: Boost[];
  total: number;
  active: number;
  limit: number;
  offset: number;
}

export function boostsPageParams(
  serverId: string,
  page: number,
  pageSize: number = DEFAULT_PAGE_SIZE,
): Record<string, string> {
  return {
    server_id: serverId,
    limit: String(pageSize),
    offset: String((Math.max(1, page) - 1) * pageSize),
  };
}

export interface BoostedServer {
  server_id: string;
  active: number;
  pending: number;
  failed: number;
  removed: number;
  last_boost_at: string;
}

export interface BoostedServersPage {
  servers: BoostedServer[];
  total: number;
  limit: number;
  offset: number;
}

export function boostedServersPageParams(
  page: number,
  pageSize: number = DEFAULT_PAGE_SIZE,
): Record<string, string> {
  return {
    limit: String(pageSize),
    offset: String((Math.max(1, page) - 1) * pageSize),
  };
}

export interface BoostRequest {
  server_id: string;
}

export const BOOST_STATUS_TONE: Readonly<Record<BoostStatus, BillingTone>> = {
  pending: "warning",
  active: "success",
  failed: "danger",
  removed: "muted",
};

export function isListedBoost(boost: Pick<Boost, "status">): boolean {
  return boost.status !== "removed";
}

export function serverBoosts(
  boosts: readonly Boost[],
  serverId: string,
): Boost[] {
  return boosts.filter(
    (boost) => boost.server_id === serverId && isListedBoost(boost),
  );
}

export function activeBoostCount(
  boosts: readonly Boost[],
  serverId?: string,
): number {
  return boosts.filter(
    (boost) =>
      boost.status === "active" &&
      (serverId === undefined || boost.server_id === serverId),
  ).length;
}

export interface ServerBoostGroup {
  serverId: string;
  boosts: Boost[];
}

export function groupBoostsByServer(
  boosts: readonly Boost[],
): ServerBoostGroup[] {
  const groups = new Map<string, Boost[]>();
  for (const boost of boosts) {
    if (!isListedBoost(boost)) continue;
    const group = groups.get(boost.server_id);
    if (group) group.push(boost);
    else groups.set(boost.server_id, [boost]);
  }
  return [...groups].map(([serverId, list]) => ({ serverId, boosts: list }));
}

export function canAffordBoost(balance: number): boolean {
  return balance >= BOOST_COST_POINTS;
}

export type BoostBlockReason = "cap" | "balance";

export function boostBlockReason({
  boostCount,
  balance,
}: {
  boostCount: number;
  balance: number;
}): BoostBlockReason | null {
  if (isBoostCapReached(boostCount)) return "cap";
  if (!canAffordBoost(balance)) return "balance";
  return null;
}

export function pointsMissingForBoost(balance: number): number {
  return Math.max(0, BOOST_COST_POINTS - balance);
}

export function balanceAfterBoost(balance: number): number {
  return Math.max(0, balance - BOOST_COST_POINTS);
}

export interface BoostLevelChange {
  from: BoostLevel;
  to: BoostLevel;
  gained: BoostPerk[];
  lost: BoostPerk[];
}

export function boostLevelChange(
  fromCount: number,
  toCount: number,
): BoostLevelChange {
  const from = boostLevelFor(fromCount);
  const to = boostLevelFor(Math.max(0, toCount));
  const before = boostPerksForLevel(from);
  const after = boostPerksForLevel(to);
  return {
    from,
    to,
    gained: after.filter((perk) => !before.includes(perk)),
    lost: before.filter((perk) => !after.includes(perk)),
  };
}

/** Qué pasa con el servidor si se suma un boost más. */
export function levelChangeIfBoosted(boostCount: number): BoostLevelChange {
  return boostLevelChange(boostCount, boostCount + 1);
}

/** Qué pierde el servidor si se retira un boost: para el aviso antes de confirmar. */
export function lostPerksIfRemoved(boostCount: number): BoostLevelChange {
  return boostLevelChange(boostCount, boostCount - 1);
}

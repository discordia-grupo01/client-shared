import { BOOST_STATUS_TIMEOUT_MS } from "../constants/boost";
import { BOOST_STATUS_FAILED } from "../messages/billing-boost";
import type { BillingResult } from "./billing";
import type { Boost } from "./billing-boost";

export type BoostOutcome =
  | "applying"
  | "applied"
  | "rejected"
  | "still_pending"
  | "removed"
  | "not_found";

export interface BoostRequestProgress {
  outcome: BoostOutcome;
  done: boolean;
}

export function boostRequestProgress(
  boost: Boost | null,
  elapsedMs: number,
): BoostRequestProgress {
  if (!boost) return { outcome: "not_found", done: true };
  switch (boost.status) {
    case "active":
      return { outcome: "applied", done: true };
    case "failed":
      return { outcome: "rejected", done: true };
    case "removed":
      return { outcome: "removed", done: true };
    case "pending":
      return elapsedMs < BOOST_STATUS_TIMEOUT_MS
        ? { outcome: "applying", done: false }
        : { outcome: "still_pending", done: true };
  }
}

export interface BoostRequestState {
  progress: BoostRequestProgress;
  boost: Boost | null;
  error: string | null;
}

export function boostRequestStarted(boost: Boost): BoostRequestState {
  return { progress: boostRequestProgress(boost, 0), boost, error: null };
}

export type BoostStep =
  { kind: "progress"; state: BoostRequestState } | { kind: "failed" };

export interface BoostStatusApi {
  getBoost: (boostId: string) => Promise<BillingResult<Boost>>;
}

export async function checkBoostStep(
  boostId: string,
  elapsedMs: number,
  api: BoostStatusApi,
): Promise<BoostStep> {
  const result = await api.getBoost(boostId);
  if (!result.ok && result.code !== "BOOST_NOT_FOUND") {
    return { kind: "failed" };
  }
  const boost = result.ok ? result.data : null;
  return {
    kind: "progress",
    state: {
      progress: boostRequestProgress(boost, elapsedMs),
      boost,
      error: null,
    },
  };
}

export interface AppliedBoostStep {
  state: BoostRequestState;
  finished: boolean;
}

export function applyBoostStep(
  current: BoostRequestState,
  step: BoostStep,
  elapsedMs: number,
): AppliedBoostStep {
  if (step.kind === "progress") {
    return { state: step.state, finished: step.state.progress.done };
  }
  if (elapsedMs >= BOOST_STATUS_TIMEOUT_MS) {
    return {
      state: {
        ...current,
        progress: { outcome: "still_pending", done: true },
        error: BOOST_STATUS_FAILED,
      },
      finished: true,
    };
  }
  return { state: current, finished: false };
}

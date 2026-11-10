import { PAYMENT_RETURN_TIMEOUT_MS } from "../constants/billing";

export interface PointsPackage {
  id: string;
  points: number;
  price_cents: number;
  title: string;
}

export interface PointsPackagesResponse {
  packages: PointsPackage[];
}

export type PurchaseStatus =
  "pending" | "paid" | "failed" | "expired" | "refunded" | "charged_back";

export interface PointPurchase {
  id: string;
  package_id: string;
  points: number;
  price_cents: number;
  status: PurchaseStatus;
  status_detail: string;
  points_unrecovered: number;
  created_at: string;
  updated_at: string;
}

export type LedgerReason = "purchase" | "refund" | "chargeback";

export interface LedgerEntry {
  delta: number;
  reason: LedgerReason;
  created_at: string;
}

export interface PointsOverview {
  balance: number;
  ledger: LedgerEntry[];
  purchases: PointPurchase[];
}

export interface PointsCheckoutRequest {
  package_id: string;
  payer_email?: string;
}

export interface PremiumCheckoutRequest {
  payer_email?: string;
}

export interface CheckoutResponse {
  purchase_id?: string;
  checkout_url: string;
}

export type PremiumState =
  | "none"
  | "processing_first_payment"
  | "active"
  | "active_canceled"
  | "expired";

export interface PremiumView {
  state: PremiumState;
  active: boolean;
  premium_until: string | null;
  renews: boolean;
  mp_status: string;
}

export const BILLING_ERROR_CODES = [
  "INVALID_REQUEST",
  "UNKNOWN_PACKAGE",
  "PAYER_EMAIL_REQUIRED",
  "ALREADY_SUBSCRIBED",
  "NO_LIVE_SUBSCRIPTION",
  "PURCHASE_NOT_FOUND",
  "CHECKOUT_IN_PROGRESS",
  "IDEMPOTENCY_KEY_REUSED",
  "INTERNAL_ERROR",
] as const;

export type BillingErrorCode = (typeof BILLING_ERROR_CODES)[number];

export function isBillingErrorCode(
  code: string | number,
): code is BillingErrorCode {
  return (BILLING_ERROR_CODES as readonly (string | number)[]).includes(code);
}

export type BillingResult<T> =
  { ok: true; data: T } | { ok: false; code: string; message: string };

export type PaymentKind = "points" | "premium";

export function isLiveSubscription(mpStatus: string): boolean {
  return mpStatus === "authorized" || mpStatus === "paused";
}

export interface PremiumActions {
  canSubscribe: boolean;
  canCancel: boolean;
  benefitsActive: boolean;
  awaitingRetry: boolean;
}

export function premiumActions(
  view: Pick<PremiumView, "state" | "mp_status">,
): PremiumActions {
  const live = isLiveSubscription(view.mp_status);
  const benefitsActive =
    view.state === "active" || view.state === "active_canceled";
  return {
    canSubscribe: !live && !benefitsActive,
    canCancel: live,
    benefitsActive,
    awaitingRetry: view.state === "expired" && live,
  };
}

export function reversedPoints(purchase: PointPurchase): number {
  if (purchase.status !== "refunded" && purchase.status !== "charged_back") {
    return 0;
  }
  return purchase.points - purchase.points_unrecovered;
}

export interface PaymentReturnParams {
  kind: PaymentKind;
  purchaseId: string | null;
}

export function parsePaymentReturn(
  params: Readonly<Record<string, string | undefined>>,
): PaymentReturnParams | null {
  if (params.kind === "premium") return { kind: "premium", purchaseId: null };
  if (params.kind === "points" && params.purchase_id) {
    return { kind: "points", purchaseId: params.purchase_id };
  }
  return null;
}

export type PaymentOutcome =
  | "verifying"
  | "points_accredited"
  | "points_rejected"
  | "points_pending"
  | "points_expired"
  | "points_reversed"
  | "points_not_found"
  | "premium_active"
  | "premium_processing"
  | "premium_not_activated";

export interface PaymentProgress {
  outcome: PaymentOutcome;
  done: boolean;
}

function untilTimeout(
  elapsedMs: number,
  waiting: PaymentOutcome,
  final: PaymentOutcome,
): PaymentProgress {
  return elapsedMs < PAYMENT_RETURN_TIMEOUT_MS
    ? { outcome: waiting, done: false }
    : { outcome: final, done: true };
}

export function pointsPaymentProgress(
  purchase: PointPurchase | null,
  elapsedMs: number,
): PaymentProgress {
  if (!purchase) return { outcome: "points_not_found", done: true };
  switch (purchase.status) {
    case "paid":
      return { outcome: "points_accredited", done: true };
    case "failed":
      return { outcome: "points_rejected", done: true };
    case "expired":
      return { outcome: "points_expired", done: true };
    case "refunded":
    case "charged_back":
      return { outcome: "points_reversed", done: true };
    case "pending":
      return untilTimeout(elapsedMs, "verifying", "points_pending");
  }
}

export function premiumPaymentProgress(
  view: Pick<PremiumView, "state" | "mp_status">,
  elapsedMs: number,
): PaymentProgress {
  if (view.state === "active" || view.state === "active_canceled") {
    return { outcome: "premium_active", done: true };
  }
  if (view.state === "processing_first_payment") {
    return untilTimeout(elapsedMs, "premium_processing", "premium_processing");
  }
  if (view.mp_status === "cancelled") {
    return { outcome: "premium_not_activated", done: true };
  }
  return untilTimeout(elapsedMs, "verifying", "premium_not_activated");
}

export type BillingTone = "success" | "warning" | "danger" | "info" | "muted";

export const PREMIUM_STATE_TONE: Readonly<Record<PremiumState, BillingTone>> = {
  none: "muted",
  processing_first_payment: "warning",
  active: "success",
  active_canceled: "warning",
  expired: "danger",
};

export const PURCHASE_STATUS_TONE: Readonly<
  Record<PurchaseStatus, BillingTone>
> = {
  pending: "warning",
  paid: "success",
  failed: "danger",
  expired: "muted",
  refunded: "info",
  charged_back: "danger",
};

export type PaymentOutcomeTone = "progress" | "success" | "warning" | "danger";

export const PAYMENT_OUTCOME_TONE: Readonly<
  Record<PaymentOutcome, PaymentOutcomeTone>
> = {
  verifying: "progress",
  points_accredited: "success",
  premium_active: "success",
  points_pending: "warning",
  premium_processing: "warning",
  points_rejected: "danger",
  points_expired: "danger",
  points_reversed: "danger",
  points_not_found: "danger",
  premium_not_activated: "danger",
};

export type BillingOverviewState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      premium: PremiumView;
      points: PointsOverview;
      packages: PointsPackage[];
    };

export function toBillingOverview(
  premium: BillingResult<PremiumView>,
  points: BillingResult<PointsOverview>,
  packages: BillingResult<PointsPackagesResponse>,
): BillingOverviewState {
  if (!premium.ok) return { status: "error", message: premium.message };
  if (!points.ok) return { status: "error", message: points.message };
  if (!packages.ok) return { status: "error", message: packages.message };
  return {
    status: "ready",
    premium: premium.data,
    points: points.data,
    packages: packages.data.packages,
  };
}

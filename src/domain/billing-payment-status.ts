import { PAYMENT_RETURN_TIMEOUT_MS } from "../constants/billing";
import { PAYMENT_STATUS_FAILED } from "../messages/billing";
import {
  type BillingResult,
  type PaymentProgress,
  type PaymentReturnParams,
  type PointPurchase,
  type PointsOverview,
  pointsPaymentProgress,
  premiumPaymentProgress,
  type PremiumView,
} from "./billing";

/** Lo que muestra la pantalla de vuelta de Mercado Pago mientras consulta. */
export interface PaymentResultState {
  progress: PaymentProgress;
  purchase: PointPurchase | null;
  premium: PremiumView | null;
  balance: number | null;
  error: string | null;
}

export const PAYMENT_RESULT_VERIFYING: PaymentResultState = {
  progress: { outcome: "verifying", done: false },
  purchase: null,
  premium: null,
  balance: null,
  error: null,
};

/** Una consulta: o trae un estado nuevo, o falló y hay que volver a probar. */
export type PaymentStep =
  { kind: "progress"; state: PaymentResultState } | { kind: "failed" };

export interface PaymentStatusApi {
  getPurchase: (purchaseId: string) => Promise<BillingResult<PointPurchase>>;
  getPointsOverview: () => Promise<BillingResult<PointsOverview>>;
  getPremium: (options: {
    refresh: boolean;
  }) => Promise<BillingResult<PremiumView>>;
}

async function checkPoints(
  purchaseId: string,
  elapsedMs: number,
  api: PaymentStatusApi,
): Promise<PaymentStep> {
  const result = await api.getPurchase(purchaseId);
  if (!result.ok && result.code !== "PURCHASE_NOT_FOUND") {
    return { kind: "failed" };
  }
  const purchase = result.ok ? result.data : null;
  const progress = pointsPaymentProgress(purchase, elapsedMs);

  let balance: number | null = null;
  if (progress.outcome === "points_accredited") {
    const overview = await api.getPointsOverview();
    if (overview.ok) balance = overview.data.balance;
  }
  return {
    kind: "progress",
    state: { ...PAYMENT_RESULT_VERIFYING, progress, purchase, balance },
  };
}

async function checkPremium(
  elapsedMs: number,
  api: PaymentStatusApi,
): Promise<PaymentStep> {
  // `refresh` hace que billing le pregunte a Mercado Pago en vez de esperar el
  // webhook, que puede tardar.
  const result = await api.getPremium({ refresh: true });
  if (!result.ok) return { kind: "failed" };
  return {
    kind: "progress",
    state: {
      ...PAYMENT_RESULT_VERIFYING,
      progress: premiumPaymentProgress(result.data, elapsedMs),
      premium: result.data,
    },
  };
}

/** Una vuelta del polling de la pantalla de vuelta de Mercado Pago. */
export function checkPaymentStep(
  params: PaymentReturnParams,
  elapsedMs: number,
  api: PaymentStatusApi,
): Promise<PaymentStep> {
  if (params.kind === "points" && params.purchaseId) {
    return checkPoints(params.purchaseId, elapsedMs, api);
  }
  return checkPremium(elapsedMs, api);
}

export interface AppliedPaymentStep {
  state: PaymentResultState;
  /** `true` si el polling tiene que cortar acá. */
  finished: boolean;
}

/**
 * Decide qué hacer con una consulta. Un fallo no corta el polling hasta que se
 * agota el tiempo: se conserva lo último que se sabía y se agrega el error.
 */
export function applyPaymentStep(
  current: PaymentResultState,
  step: PaymentStep,
  elapsedMs: number,
): AppliedPaymentStep {
  if (step.kind === "progress") {
    return { state: step.state, finished: step.state.progress.done };
  }
  if (elapsedMs >= PAYMENT_RETURN_TIMEOUT_MS) {
    return {
      state: {
        ...current,
        progress: { ...current.progress, done: true },
        error: PAYMENT_STATUS_FAILED,
      },
      finished: true,
    };
  }
  return { state: current, finished: false };
}

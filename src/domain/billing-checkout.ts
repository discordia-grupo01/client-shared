import type {
  BillingResult,
  CheckoutResponse,
  PaymentReturnParams,
} from "./billing";

/** Lo que se está por pagar, tal como lo muestra el modal de confirmación. */
export type CheckoutItem =
  | { kind: "premium"; priceCents: number }
  | { kind: "points"; packageId: string; points: number; priceCents: number };

/** Transporte de cada app: su cliente HTTP y cómo abre Mercado Pago. */
export interface CheckoutDeps {
  startPremium: (
    payerEmail: string,
    idempotencyKey: string,
  ) => Promise<BillingResult<CheckoutResponse>>;
  startPoints: (
    packageId: string,
    idempotencyKey: string,
  ) => Promise<BillingResult<CheckoutResponse>>;
  openCheckout: (url: string) => Promise<void> | void;
}

export type CheckoutOutcome =
  | { ok: true; payment: PaymentReturnParams }
  | { ok: false; code: string; message: string };

/**
 * Pide el checkout al back, abre Mercado Pago y devuelve qué pago hay que
 * seguir al volver. Si el back falla no se abre nada.
 */
export async function runCheckout(
  item: CheckoutItem,
  payerEmail: string,
  idempotencyKey: string,
  deps: CheckoutDeps,
): Promise<CheckoutOutcome> {
  const result =
    item.kind === "premium"
      ? await deps.startPremium(payerEmail, idempotencyKey)
      : await deps.startPoints(item.packageId, idempotencyKey);
  if (!result.ok) {
    return { ok: false, code: result.code, message: result.message };
  }

  await deps.openCheckout(result.data.checkout_url);

  const payment: PaymentReturnParams =
    item.kind === "points"
      ? { kind: "points", purchaseId: result.data.purchase_id ?? null }
      : { kind: "premium", purchaseId: null };
  return { ok: true, payment };
}

const HEX = "0123456789abcdef";

export function newIdempotencyKey(random: () => number = Math.random): string {
  let out = "";
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      out += "-";
    } else if (i === 14) {
      out += "4";
    } else if (i === 19) {
      out += HEX[8 + Math.floor(random() * 4)];
    } else {
      out += HEX[Math.floor(random() * 16)];
    }
  }
  return out;
}

export function shouldRenewIdempotencyKey(outcome: CheckoutOutcome): boolean {
  return outcome.ok || outcome.code === "IDEMPOTENCY_KEY_REUSED";
}

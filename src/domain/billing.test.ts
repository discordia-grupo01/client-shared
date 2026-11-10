import { describe, expect, it } from "vitest";

import { PAYMENT_RETURN_TIMEOUT_MS } from "../constants/billing";
import {
  type BillingResult,
  isBillingErrorCode,
  isLiveSubscription,
  parsePaymentReturn,
  type PointPurchase,
  pointsPaymentProgress,
  premiumActions,
  premiumPaymentProgress,
  type PurchaseStatus,
  type PremiumView,
  reversedPoints,
  toBillingOverview,
} from "./billing";

function purchase(
  status: PurchaseStatus,
  overrides: Partial<PointPurchase> = {},
): PointPurchase {
  return {
    id: "8b0f6a52-0000-4000-8000-000000000001",
    package_id: "points_550",
    points: 550,
    price_cents: 500_000,
    status,
    status_detail: "",
    points_unrecovered: 0,
    created_at: "2026-11-04T20:00:00Z",
    updated_at: "2026-11-04T20:00:00Z",
    ...overrides,
  };
}

describe("isLiveSubscription", () => {
  it("solo authorized y paused siguen cobrando", () => {
    expect(isLiveSubscription("authorized")).toBe(true);
    expect(isLiveSubscription("paused")).toBe(true);
    expect(isLiveSubscription("pending")).toBe(false);
    expect(isLiveSubscription("cancelled")).toBe(false);
    expect(isLiveSubscription("")).toBe(false);
  });
});

describe("premiumActions", () => {
  it("sin Premium se puede suscribir y no cancelar", () => {
    expect(premiumActions({ state: "none", mp_status: "" })).toEqual({
      canSubscribe: true,
      canCancel: false,
      benefitsActive: false,
      awaitingRetry: false,
    });
  });

  it("un checkout sin terminar no bloquea otro", () => {
    expect(
      premiumActions({ state: "none", mp_status: "pending" }).canSubscribe,
    ).toBe(true);
  });

  it("procesando el primer pago solo permite cancelar", () => {
    const actions = premiumActions({
      state: "processing_first_payment",
      mp_status: "authorized",
    });
    expect(actions.canSubscribe).toBe(false);
    expect(actions.canCancel).toBe(true);
    expect(actions.benefitsActive).toBe(false);
  });

  it("activo con renovación permite cancelar", () => {
    const actions = premiumActions({
      state: "active",
      mp_status: "authorized",
    });
    expect(actions).toMatchObject({
      canSubscribe: false,
      canCancel: true,
      benefitsActive: true,
    });
  });

  it("activo sin renovación no permite suscribirse ni cancelar", () => {
    expect(
      premiumActions({ state: "active_canceled", mp_status: "cancelled" }),
    ).toEqual({
      canSubscribe: false,
      canCancel: false,
      benefitsActive: true,
      awaitingRetry: false,
    });
  });

  it("vencido con Mercado Pago reintentando permite cancelar pero no suscribirse", () => {
    expect(
      premiumActions({ state: "expired", mp_status: "authorized" }),
    ).toEqual({
      canSubscribe: false,
      canCancel: true,
      benefitsActive: false,
      awaitingRetry: true,
    });
  });

  it("vencido con la suscripción cancelada permite volver a suscribirse", () => {
    expect(
      premiumActions({ state: "expired", mp_status: "cancelled" }),
    ).toMatchObject({ canSubscribe: true, canCancel: false });
  });
});

describe("reversedPoints", () => {
  it("descuenta lo que no se pudo recuperar", () => {
    expect(
      reversedPoints(purchase("refunded", { points_unrecovered: 200 })),
    ).toBe(350);
    expect(reversedPoints(purchase("charged_back"))).toBe(550);
  });

  it("es cero si la compra no se revirtió", () => {
    expect(reversedPoints(purchase("paid"))).toBe(0);
  });
});

describe("parsePaymentReturn", () => {
  it("lee la vuelta de una compra de puntos", () => {
    expect(
      parsePaymentReturn({
        kind: "points",
        result: "success",
        purchase_id: "abc",
      }),
    ).toEqual({ kind: "points", purchaseId: "abc" });
  });

  it("lee la vuelta de Premium", () => {
    expect(parsePaymentReturn({ kind: "premium" })).toEqual({
      kind: "premium",
      purchaseId: null,
    });
  });

  it("descarta parámetros incompletos o desconocidos", () => {
    expect(parsePaymentReturn({ kind: "points" })).toBeNull();
    expect(parsePaymentReturn({ kind: "otra" })).toBeNull();
    expect(parsePaymentReturn({})).toBeNull();
  });
});

describe("pointsPaymentProgress", () => {
  it("sin compra es no encontrada", () => {
    expect(pointsPaymentProgress(null, 0)).toEqual({
      outcome: "points_not_found",
      done: true,
    });
  });

  it.each([
    ["paid", "points_accredited"],
    ["failed", "points_rejected"],
    ["expired", "points_expired"],
    ["refunded", "points_reversed"],
    ["charged_back", "points_reversed"],
  ] as const)("%s termina como %s", (status, outcome) => {
    expect(pointsPaymentProgress(purchase(status), 0)).toEqual({
      outcome,
      done: true,
    });
  });

  it("pendiente sigue verificando hasta el timeout", () => {
    expect(pointsPaymentProgress(purchase("pending"), 1_000)).toEqual({
      outcome: "verifying",
      done: false,
    });
    expect(
      pointsPaymentProgress(purchase("pending"), PAYMENT_RETURN_TIMEOUT_MS),
    ).toEqual({ outcome: "points_pending", done: true });
  });
});

describe("premiumPaymentProgress", () => {
  it("activo termina enseguida", () => {
    expect(
      premiumPaymentProgress({ state: "active", mp_status: "authorized" }, 0),
    ).toEqual({ outcome: "premium_active", done: true });
  });

  it("procesando se sigue consultando hasta el timeout", () => {
    const view = {
      state: "processing_first_payment",
      mp_status: "authorized",
    } as const;
    expect(premiumPaymentProgress(view, 0)).toEqual({
      outcome: "premium_processing",
      done: false,
    });
    expect(premiumPaymentProgress(view, PAYMENT_RETURN_TIMEOUT_MS)).toEqual({
      outcome: "premium_processing",
      done: true,
    });
  });

  it("si Mercado Pago canceló la suscripción no se activó", () => {
    expect(
      premiumPaymentProgress({ state: "none", mp_status: "cancelled" }, 0),
    ).toEqual({ outcome: "premium_not_activated", done: true });
  });

  it("sin autorizar sigue verificando y al timeout no se activó", () => {
    const view = { state: "none", mp_status: "pending" } as const;
    expect(premiumPaymentProgress(view, 0).outcome).toBe("verifying");
    expect(premiumPaymentProgress(view, PAYMENT_RETURN_TIMEOUT_MS)).toEqual({
      outcome: "premium_not_activated",
      done: true,
    });
  });
});

describe("isBillingErrorCode", () => {
  it("reconoce los códigos de billing, incluidos los de idempotencia", () => {
    expect(isBillingErrorCode("ALREADY_SUBSCRIBED")).toBe(true);
    expect(isBillingErrorCode("CHECKOUT_IN_PROGRESS")).toBe(true);
    expect(isBillingErrorCode("IDEMPOTENCY_KEY_REUSED")).toBe(true);
  });

  it("rechaza códigos ajenos y numéricos", () => {
    expect(isBillingErrorCode("NETWORK_ERROR")).toBe(false);
    expect(isBillingErrorCode(409)).toBe(false);
  });
});

describe("toBillingOverview", () => {
  const premiumView: PremiumView = {
    state: "none",
    active: false,
    premium_until: null,
    renews: false,
    mp_status: "",
  };
  const ok = <T>(data: T): BillingResult<T> => ({ ok: true, data });
  const fail = (message: string): BillingResult<never> => ({
    ok: false,
    code: "INTERNAL_ERROR",
    message,
  });
  const points = { balance: 10, ledger: [], purchases: [] };
  const pack = { id: "points_550", points: 550, price_cents: 1, title: "550" };

  it("con las tres respuestas bien queda lista", () => {
    expect(
      toBillingOverview(ok(premiumView), ok(points), ok({ packages: [pack] })),
    ).toEqual({
      status: "ready",
      premium: premiumView,
      points,
      packages: [pack],
    });
  });

  it("muestra el error de la primera que falló: Premium, puntos, paquetes", () => {
    expect(
      toBillingOverview(fail("premium"), fail("puntos"), fail("paquetes")),
    ).toEqual({ status: "error", message: "premium" });
    expect(
      toBillingOverview(ok(premiumView), fail("puntos"), fail("paquetes")),
    ).toEqual({ status: "error", message: "puntos" });
    expect(
      toBillingOverview(ok(premiumView), ok(points), fail("paquetes")),
    ).toEqual({ status: "error", message: "paquetes" });
  });
});

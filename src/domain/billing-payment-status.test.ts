import { describe, expect, it, vi } from "vitest";

import { PAYMENT_RETURN_TIMEOUT_MS } from "../constants/billing";
import { PAYMENT_STATUS_FAILED } from "../messages/billing";
import type { PointPurchase, PremiumView } from "./billing";
import {
  applyPaymentStep,
  checkPaymentStep,
  PAYMENT_RESULT_VERIFYING,
  type PaymentResultState,
  type PaymentStatusApi,
} from "./billing-payment-status";

const purchase = (status: PointPurchase["status"]): PointPurchase => ({
  id: "p1",
  package_id: "pack",
  points: 500,
  price_cents: 100,
  status,
  status_detail: "",
  points_unrecovered: 0,
  created_at: "2026-11-05T00:00:00Z",
  updated_at: "2026-11-05T00:00:00Z",
});

const premium = (state: PremiumView["state"]): PremiumView => ({
  state,
  active: state === "active",
  premium_until: null,
  renews: true,
  mp_status: "authorized",
});

function api(overrides: Partial<PaymentStatusApi> = {}): PaymentStatusApi {
  return {
    getPurchase: vi
      .fn()
      .mockResolvedValue({ ok: true, data: purchase("pending") }),
    getPointsOverview: vi.fn().mockResolvedValue({
      ok: true,
      data: { balance: 1200, ledger: [], purchases: [] },
    }),
    getPremium: vi.fn().mockResolvedValue({ ok: true, data: premium("none") }),
    ...overrides,
  };
}

describe("checkPaymentStep", () => {
  it("compra pagada: acreditada y con el saldo nuevo", async () => {
    const a = api({
      getPurchase: vi
        .fn()
        .mockResolvedValue({ ok: true, data: purchase("paid") }),
    });

    const step = await checkPaymentStep(
      { kind: "points", purchaseId: "p1" },
      0,
      a,
    );

    expect(a.getPurchase).toHaveBeenCalledWith("p1");
    expect(step).toMatchObject({
      kind: "progress",
      state: {
        progress: { outcome: "points_accredited", done: true },
        balance: 1200,
      },
    });
  });

  it("compra pagada sin poder leer el saldo: acreditada igual, sin saldo", async () => {
    const a = api({
      getPurchase: vi
        .fn()
        .mockResolvedValue({ ok: true, data: purchase("paid") }),
      getPointsOverview: vi
        .fn()
        .mockResolvedValue({ ok: false, code: "NETWORK_ERROR", message: "" }),
    });

    const step = await checkPaymentStep(
      { kind: "points", purchaseId: "p1" },
      0,
      a,
    );

    expect(step).toMatchObject({
      state: { progress: { outcome: "points_accredited" }, balance: null },
    });
  });

  it("compra pendiente: sigue verificando y no pide el saldo", async () => {
    const a = api();

    const step = await checkPaymentStep(
      { kind: "points", purchaseId: "p1" },
      0,
      a,
    );

    expect(a.getPointsOverview).not.toHaveBeenCalled();
    expect(step).toMatchObject({
      state: { progress: { outcome: "verifying", done: false } },
    });
  });

  it("compra que no existe: termina en no encontrada", async () => {
    const a = api({
      getPurchase: vi.fn().mockResolvedValue({
        ok: false,
        code: "PURCHASE_NOT_FOUND",
        message: "",
      }),
    });

    const step = await checkPaymentStep(
      { kind: "points", purchaseId: "p1" },
      0,
      a,
    );

    expect(step).toMatchObject({
      state: { progress: { outcome: "points_not_found", done: true } },
    });
  });

  it("un error de red se informa como fallo para reintentar", async () => {
    const a = api({
      getPurchase: vi
        .fn()
        .mockResolvedValue({ ok: false, code: "NETWORK_ERROR", message: "" }),
    });

    expect(
      await checkPaymentStep({ kind: "points", purchaseId: "p1" }, 0, a),
    ).toEqual({ kind: "failed" });
  });

  it("Premium consulta con refresh y detecta la activación", async () => {
    const getPremium = vi
      .fn()
      .mockResolvedValue({ ok: true, data: premium("active") });

    const step = await checkPaymentStep(
      { kind: "premium", purchaseId: null },
      0,
      api({ getPremium }),
    );

    expect(getPremium).toHaveBeenCalledWith({ refresh: true });
    expect(step).toMatchObject({
      state: {
        progress: { outcome: "premium_active", done: true },
        premium: { state: "active" },
      },
    });
  });

  it("Premium con error del back: fallo para reintentar", async () => {
    const getPremium = vi
      .fn()
      .mockResolvedValue({ ok: false, code: "INTERNAL_ERROR", message: "" });

    expect(
      await checkPaymentStep(
        { kind: "premium", purchaseId: null },
        0,
        api({ getPremium }),
      ),
    ).toEqual({ kind: "failed" });
  });

  it("puntos sin purchaseId: consulta Premium", async () => {
    const a = api();

    await checkPaymentStep({ kind: "points", purchaseId: null }, 0, a);

    expect(a.getPurchase).not.toHaveBeenCalled();
    expect(a.getPremium).toHaveBeenCalled();
  });
});

describe("applyPaymentStep", () => {
  const accredited: PaymentResultState = {
    ...PAYMENT_RESULT_VERIFYING,
    progress: { outcome: "points_accredited", done: true },
    balance: 1200,
  };

  it("un estado terminado corta el polling", () => {
    expect(
      applyPaymentStep(
        PAYMENT_RESULT_VERIFYING,
        { kind: "progress", state: accredited },
        0,
      ),
    ).toEqual({ state: accredited, finished: true });
  });

  it("un estado en curso sigue consultando", () => {
    expect(
      applyPaymentStep(
        PAYMENT_RESULT_VERIFYING,
        { kind: "progress", state: PAYMENT_RESULT_VERIFYING },
        0,
      ),
    ).toEqual({ state: PAYMENT_RESULT_VERIFYING, finished: false });
  });

  it("un fallo antes del timeout conserva lo último y sigue", () => {
    expect(
      applyPaymentStep(
        PAYMENT_RESULT_VERIFYING,
        { kind: "failed" },
        PAYMENT_RETURN_TIMEOUT_MS - 1,
      ),
    ).toEqual({ state: PAYMENT_RESULT_VERIFYING, finished: false });
  });

  it("un fallo al agotar el tiempo termina con el error de consulta", () => {
    const { state, finished } = applyPaymentStep(
      PAYMENT_RESULT_VERIFYING,
      { kind: "failed" },
      PAYMENT_RETURN_TIMEOUT_MS,
    );

    expect(finished).toBe(true);
    expect(state).toEqual({
      ...PAYMENT_RESULT_VERIFYING,
      progress: { outcome: "verifying", done: true },
      error: PAYMENT_STATUS_FAILED,
    });
  });
});

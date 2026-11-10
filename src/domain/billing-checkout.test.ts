import { describe, expect, it, vi } from "vitest";

import {
  type CheckoutDeps,
  newIdempotencyKey,
  runCheckout,
  shouldRenewIdempotencyKey,
} from "./billing-checkout";

function deps(overrides: Partial<CheckoutDeps> = {}): CheckoutDeps {
  return {
    startPremium: vi.fn().mockResolvedValue({
      ok: true,
      data: { checkout_url: "https://mp/premium" },
    }),
    startPoints: vi.fn().mockResolvedValue({
      ok: true,
      data: { purchase_id: "p1", checkout_url: "https://mp/points" },
    }),
    openCheckout: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("runCheckout", () => {
  it("puntos: pide el checkout con la clave, abre MP y devuelve la compra", async () => {
    const d = deps();

    const outcome = await runCheckout(
      { kind: "points", packageId: "pack", points: 500, priceCents: 100 },
      "",
      "key",
      d,
    );

    expect(d.startPoints).toHaveBeenCalledWith("pack", "key");
    expect(d.startPremium).not.toHaveBeenCalled();
    expect(d.openCheckout).toHaveBeenCalledWith("https://mp/points");
    expect(outcome).toEqual({
      ok: true,
      payment: { kind: "points", purchaseId: "p1" },
    });
  });

  it("puntos sin purchase_id en la respuesta: sigue con purchaseId null", async () => {
    const d = deps({
      startPoints: vi.fn().mockResolvedValue({
        ok: true,
        data: { checkout_url: "https://mp/points" },
      }),
    });

    const outcome = await runCheckout(
      { kind: "points", packageId: "pack", points: 500, priceCents: 100 },
      "",
      "key",
      d,
    );

    expect(outcome).toEqual({
      ok: true,
      payment: { kind: "points", purchaseId: null },
    });
  });

  it("Premium: manda el email y devuelve el pago de Premium", async () => {
    const d = deps();

    const outcome = await runCheckout(
      { kind: "premium", priceCents: 499_900 },
      "a@b.com",
      "key",
      d,
    );

    expect(d.startPremium).toHaveBeenCalledWith("a@b.com", "key");
    expect(d.openCheckout).toHaveBeenCalledWith("https://mp/premium");
    expect(outcome).toEqual({
      ok: true,
      payment: { kind: "premium", purchaseId: null },
    });
  });

  it("si el back falla no abre Mercado Pago", async () => {
    const d = deps({
      startPremium: vi.fn().mockResolvedValue({
        ok: false,
        code: "ALREADY_SUBSCRIBED",
        message: "ya tenés",
      }),
    });

    const outcome = await runCheckout(
      { kind: "premium", priceCents: 1 },
      "a@b.com",
      "key",
      d,
    );

    expect(d.openCheckout).not.toHaveBeenCalled();
    expect(outcome).toEqual({
      ok: false,
      code: "ALREADY_SUBSCRIBED",
      message: "ya tenés",
    });
  });
});

describe("newIdempotencyKey", () => {
  const UUID_V4 =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

  it("tiene forma de UUID v4", () => {
    expect(newIdempotencyKey()).toMatch(UUID_V4);
  });

  it("respeta la forma en los extremos del random", () => {
    expect(newIdempotencyKey(() => 0)).toBe(
      "00000000-0000-4000-8000-000000000000",
    );
    expect(newIdempotencyKey(() => 0.9999)).toBe(
      "ffffffff-ffff-4fff-bfff-ffffffffffff",
    );
  });

  it("no se repite entre llamadas", () => {
    const keys = new Set(
      Array.from({ length: 200 }, () => newIdempotencyKey()),
    );
    expect(keys.size).toBe(200);
  });
});

describe("shouldRenewIdempotencyKey", () => {
  it("se renueva cuando el checkout terminó bien", () => {
    expect(
      shouldRenewIdempotencyKey({
        ok: true,
        payment: { kind: "premium", purchaseId: null },
      }),
    ).toBe(true);
  });

  it("se renueva si el back la rechaza por reusada", () => {
    expect(
      shouldRenewIdempotencyKey({
        ok: false,
        code: "IDEMPOTENCY_KEY_REUSED",
        message: "",
      }),
    ).toBe(true);
  });

  it("se conserva ante otros errores, para que el reintento sea idempotente", () => {
    for (const code of ["CHECKOUT_IN_PROGRESS", "NETWORK_ERROR", "500"]) {
      expect(shouldRenewIdempotencyKey({ ok: false, code, message: "" })).toBe(
        false,
      );
    }
  });
});

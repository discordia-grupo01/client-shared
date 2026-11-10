import { describe, expect, it } from "vitest";

import { BILLING_ERROR_CODES, type PaymentOutcome } from "../domain/billing";
import { BILLING_SECTIONS } from "../constants/billing";
import {
  BILLING_COPY,
  BILLING_ERROR_MESSAGES,
  BILLING_SECTION_LABELS,
  billingErrorMessage,
  paymentOutcomeCopy,
  paymentRejectionReason,
  PAYMENT_REJECTED_DEFAULT,
  premiumActionLabels,
  premiumStatusCopy,
} from "./billing";
import { UNEXPECTED_ERROR_MESSAGE } from "./errors";

describe("billingErrorMessage", () => {
  it("tiene un texto para cada código del back", () => {
    for (const code of BILLING_ERROR_CODES) {
      expect(billingErrorMessage(code)).toBe(BILLING_ERROR_MESSAGES[code]);
    }
  });

  it("cae al genérico con códigos desconocidos", () => {
    expect(billingErrorMessage("OTRO")).toBe(UNEXPECTED_ERROR_MESSAGE);
    expect(billingErrorMessage(500)).toBe(UNEXPECTED_ERROR_MESSAGE);
  });
});

describe("paymentRejectionReason", () => {
  it("explica los motivos conocidos de Mercado Pago", () => {
    expect(paymentRejectionReason("insufficient_amount")).toBe(
      "Fondos insuficientes.",
    );
    expect(paymentRejectionReason("rejected_by_issuer")).toBe(
      "El banco rechazó el pago.",
    );
  });

  it("usa el texto genérico para el resto", () => {
    expect(paymentRejectionReason("")).toBe(PAYMENT_REJECTED_DEFAULT);
    expect(paymentRejectionReason("processing_error")).toBe(
      PAYMENT_REJECTED_DEFAULT,
    );
  });
});

describe("premiumStatusCopy", () => {
  it("distingue el vencido que Mercado Pago sigue reintentando", () => {
    const retrying = premiumStatusCopy({
      state: "expired",
      mp_status: "authorized",
      premium_until: "2026-10-01T12:00:00Z",
    });
    const cancelled = premiumStatusCopy({
      state: "expired",
      mp_status: "cancelled",
      premium_until: "2026-10-01T12:00:00Z",
    });
    expect(retrying.label).toContain("reintentando");
    expect(cancelled.label).toBe("Premium vencido");
  });

  it("incluye la fecha paga cuando hay beneficios", () => {
    const copy = premiumStatusCopy({
      state: "active_canceled",
      mp_status: "cancelled",
      premium_until: "2026-12-04T15:00:00Z",
    });
    expect(copy.detail).toContain("4 de diciembre de 2026");
  });
});

describe("paymentOutcomeCopy", () => {
  const outcomes: PaymentOutcome[] = [
    "verifying",
    "points_accredited",
    "points_rejected",
    "points_pending",
    "points_expired",
    "points_reversed",
    "points_not_found",
    "premium_active",
    "premium_processing",
    "premium_not_activated",
  ];

  it.each(outcomes)("%s tiene título y descripción", (outcome) => {
    const copy = paymentOutcomeCopy(outcome);
    expect(copy.title).not.toBe("");
    expect(copy.description.trim()).toMatch(/\.$/);
  });

  it("cuenta los puntos sumados y el saldo nuevo", () => {
    expect(
      paymentOutcomeCopy("points_accredited", { points: 550, balance: 1_200 })
        .description,
    ).toBe("Sumamos 550 puntos. Tu saldo es de 1.200 puntos.");
  });

  it("usa el motivo del rechazo", () => {
    expect(
      paymentOutcomeCopy("points_rejected", {
        statusDetail: "insufficient_amount",
      }).description,
    ).toMatch(/^Fondos insuficientes\./);
  });

  it("separa el pago sin terminar del pendiente", () => {
    expect(
      paymentOutcomeCopy("points_pending", { abandoned: true }).title,
    ).toBe("Pago sin terminar");
    expect(paymentOutcomeCopy("points_pending").title).toBe("Pago pendiente");
  });
});

describe("premiumActionLabels", () => {
  it("con Premium vencido ofrece volver a suscribirse", () => {
    expect(premiumActionLabels({ state: "expired" }).subscribe).toBe(
      BILLING_COPY.resubscribe,
    );
    expect(premiumActionLabels({ state: "none" }).subscribe).toBe(
      BILLING_COPY.subscribeCta,
    );
  });

  it("solo con Premium activo se cancela la renovación", () => {
    expect(premiumActionLabels({ state: "active" }).cancel).toBe(
      BILLING_COPY.cancelRenewal,
    );
    for (const state of [
      "active_canceled",
      "processing_first_payment",
      "expired",
      "none",
    ] as const) {
      expect(premiumActionLabels({ state }).cancel).toBe(
        BILLING_COPY.cancelSubscription,
      );
    }
  });
});

describe("BILLING_SECTION_LABELS", () => {
  it("tiene label y descripción para cada solapa", () => {
    for (const section of BILLING_SECTIONS) {
      expect(BILLING_SECTION_LABELS[section].label).not.toBe("");
      expect(BILLING_SECTION_LABELS[section].description).not.toBe("");
    }
  });
});

describe("BILLING_COPY", () => {
  it("arma los textos con fecha y cantidad", () => {
    expect(BILLING_COPY.activeUntil("5 de diciembre de 2026")).toBe(
      "Activo hasta el 5 de diciembre de 2026",
    );
    expect(BILLING_COPY.buyPackage("550 puntos")).toBe("Comprar 550 puntos");
  });
});

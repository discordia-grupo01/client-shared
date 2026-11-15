import { describe, expect, it } from "vitest";

import {
  BILLING_SECTIONS,
  isBillingSection,
  PAYMENT_RETURN_SECTION,
} from "./billing";

describe("isBillingSection", () => {
  it("reconoce las solapas de Facturación", () => {
    for (const section of BILLING_SECTIONS) {
      expect(isBillingSection(section)).toBe(true);
    }
  });

  it("rechaza las otras secciones de la configuración", () => {
    expect(isBillingSection("appearance")).toBe(false);
    expect(isBillingSection("profile")).toBe(false);
    expect(isBillingSection("")).toBe(false);
  });
});

describe("BILLING_SECTIONS", () => {
  it("pone Boosts de servidor entre Puntos e Historial", () => {
    expect(BILLING_SECTIONS).toEqual([
      "premium",
      "subscriptions",
      "points",
      "boosts",
      "transactions",
    ]);
  });
});

describe("PAYMENT_RETURN_SECTION", () => {
  it("Premium vuelve a Suscripciones y puntos al Historial", () => {
    expect(PAYMENT_RETURN_SECTION).toEqual({
      premium: "subscriptions",
      points: "transactions",
    });
  });
});

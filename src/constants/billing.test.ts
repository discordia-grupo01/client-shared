import { describe, expect, it } from "vitest";

import {
  BILLING_SECTIONS,
  isBillingSection,
  PAYMENT_RETURN_SECTION,
} from "./billing";

describe("isBillingSection", () => {
  it("reconoce las cuatro solapas de Facturación", () => {
    for (const section of BILLING_SECTIONS) {
      expect(isBillingSection(section)).toBe(true);
    }
  });

  it("rechaza las otras secciones de la configuración", () => {
    expect(isBillingSection("appearance")).toBe(false);
    expect(isBillingSection("boosts")).toBe(false);
    expect(isBillingSection("")).toBe(false);
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

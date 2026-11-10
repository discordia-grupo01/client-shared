import { describe, expect, it } from "vitest";

import {
  formatArsFromCents,
  formatBillingDate,
  formatPoints,
  formatPointsDelta,
} from "./billing";

describe("formatArsFromCents", () => {
  it("muestra pesos sin decimales cuando no hay centavos", () => {
    expect(formatArsFromCents(499_900)).toBe("$ 4.999");
    expect(formatArsFromCents(1_000_000)).toBe("$ 10.000");
    expect(formatArsFromCents(0)).toBe("$ 0");
  });

  it("muestra los centavos con coma", () => {
    expect(formatArsFromCents(150)).toBe("$ 1,50");
    expect(formatArsFromCents(123_405)).toBe("$ 1.234,05");
  });

  it("respeta el signo", () => {
    expect(formatArsFromCents(-100_000)).toBe("-$ 1.000");
  });
});

describe("formatPoints", () => {
  it("agrupa miles y concuerda en número", () => {
    expect(formatPoints(1_200)).toBe("1.200 puntos");
    expect(formatPoints(100)).toBe("100 puntos");
    expect(formatPoints(1)).toBe("1 punto");
    expect(formatPoints(0)).toBe("0 puntos");
  });
});

describe("formatPointsDelta", () => {
  it("antepone el signo", () => {
    expect(formatPointsDelta(550)).toBe("+550");
    expect(formatPointsDelta(-1_200)).toBe("−1.200");
    expect(formatPointsDelta(0)).toBe("0");
  });
});

describe("formatBillingDate", () => {
  it("muestra fecha y hora cortas en es-AR", () => {
    const formatted = formatBillingDate("2026-11-05T17:30:00Z");
    expect(formatted).toMatch(/\d{1,2}\/\d{1,2}\/\d{2}/);
    expect(formatted).toMatch(/\d{1,2}:\d{2}/);
  });

  it("devuelve vacío con una fecha inválida", () => {
    expect(formatBillingDate("no-es-fecha")).toBe("");
  });
});

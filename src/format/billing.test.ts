import { describe, expect, it } from "vitest";

import {
  formatArsFromCents,
  formatBillingDate,
  formatDayAndTime,
  formatPoints,
  formatPointsDelta,
  formatShortDate,
  formatShortDateTime,
  formatShortDateTimeRange,
} from "./billing";

const local = (
  month: number,
  day: number,
  hour = 12,
  minute = 0,
  year = 2026,
) => new Date(year, month - 1, day, hour, minute).toISOString();

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

describe("fechas cortas", () => {
  it("muestra día, mes abreviado y año", () => {
    expect(formatShortDate(local(11, 12))).toBe("12 nov 2026");
    expect(formatShortDate("no-es-fecha")).toBe("");
  });

  it("suma la hora", () => {
    expect(formatShortDateTime(local(11, 12, 18, 42))).toBe(
      "12 nov 2026, 18:42",
    );
    expect(formatShortDateTime(local(11, 12, 9, 5))).toBe("12 nov 2026, 9:05");
  });

  it("arma un rango con hora y el año al final", () => {
    expect(
      formatShortDateTimeRange(local(11, 3, 10, 5), local(11, 11, 18, 42)),
    ).toBe("3 nov, 10:05 al 11 nov 2026, 18:42");
    expect(
      formatShortDateTimeRange(local(12, 28, 8, 0, 2025), local(1, 3, 20, 30)),
    ).toBe("28 dic 2025, 8:00 al 3 ene 2026, 20:30");
  });

  it("dice Hoy si es el mismo día", () => {
    const now = new Date(2026, 10, 15, 20, 0);
    expect(formatDayAndTime(local(11, 15, 18, 42), now)).toBe("Hoy, 18:42");
    expect(formatDayAndTime(local(11, 13, 9, 5), now)).toBe(
      "13 nov 2026, 9:05",
    );
  });
});

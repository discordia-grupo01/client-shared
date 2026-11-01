import { describe, expect, it } from "vitest";

import { formatCallDuration } from "./call-duration";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

describe("formatCallDuration", () => {
  it("muestra minutos y segundos durante la primera hora", () => {
    expect(formatCallDuration(0)).toBe("0:00");
    expect(formatCallDuration(7 * SECOND)).toBe("0:07");
    expect(formatCallDuration(59 * SECOND)).toBe("0:59");
    expect(formatCallDuration(MINUTE)).toBe("1:00");
    expect(formatCallDuration(12 * MINUTE + 34 * SECOND)).toBe("12:34");
    expect(formatCallDuration(HOUR - SECOND)).toBe("59:59");
  });

  it("agrega las horas al pasar la hora", () => {
    expect(formatCallDuration(HOUR)).toBe("1:00:00");
    expect(formatCallDuration(HOUR + 2 * MINUTE + 33 * SECOND)).toBe("1:02:33");
    expect(formatCallDuration(25 * HOUR)).toBe("25:00:00");
  });

  it("no redondea para arriba los segundos incompletos", () => {
    expect(formatCallDuration(59_999)).toBe("0:59");
  });

  it("nunca es negativo ni invalido", () => {
    expect(formatCallDuration(-3 * SECOND)).toBe("0:00");
    expect(formatCallDuration(Number.NaN)).toBe("0:00");
  });
});

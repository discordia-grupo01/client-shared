import { describe, expect, it } from "vitest";

import { formatTwoFactorChallengeCountdown } from "./two-factor";

describe("formatTwoFactorChallengeCountdown", () => {
  it("da formato mm:ss con segundos en dos digitos", () => {
    expect(formatTwoFactorChallengeCountdown(125)).toBe("2:05");
  });

  it("no agrega ceros a la izquierda de los minutos", () => {
    expect(formatTwoFactorChallengeCountdown(65)).toBe("1:05");
  });

  it("no baja de 0:00", () => {
    expect(formatTwoFactorChallengeCountdown(-5)).toBe("0:00");
  });

  it("redondea segundos fraccionarios", () => {
    expect(formatTwoFactorChallengeCountdown(59.6)).toBe("1:00");
  });
});

import { describe, expect, it } from "vitest";

import {
  formatTwoFactorChallengeCountdown,
  twoFactorRecoveryCodesRemaining,
} from "./two-factor";

describe("twoFactorRecoveryCodesRemaining", () => {
  it("avisa sin códigos", () => {
    expect(twoFactorRecoveryCodesRemaining(0)).toBe(
      "Te quedaste sin códigos de recuperación. Generá una lista nueva ahora.",
    );
  });

  it("sugiere regenerar con pocos códigos restantes", () => {
    expect(twoFactorRecoveryCodesRemaining(1)).toBe(
      "Te queda 1 código de recuperación. Te conviene generar una lista nueva.",
    );
    expect(twoFactorRecoveryCodesRemaining(3)).toBe(
      "Te quedan 3 códigos de recuperación. Te conviene generar una lista nueva.",
    );
  });

  it("no sugiere regenerar si quedan varios códigos", () => {
    expect(twoFactorRecoveryCodesRemaining(4)).toBe(
      "Te quedan 4 códigos de recuperación.",
    );
    expect(twoFactorRecoveryCodesRemaining(10)).toBe(
      "Te quedan 10 códigos de recuperación.",
    );
  });
});

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

import { describe, expect, it } from "vitest";

import type { ApiFailure } from "../domain/api-result";

import { SESSION_EXPIRED_MESSAGE } from "./errors";
import {
  NO_PERMISSION_VANITY,
  saveVanityFailureMessage,
  VANITY_CODE_TAKEN,
  VANITY_PAUSED_DETAIL,
  VANITY_SAVE_FAILED,
  VANITY_URL_COPY,
  vanityPausedTitle,
  vanityRemoveImpact,
} from "./vanity";

const failure = (
  status: number,
  details?: Record<string, unknown>,
): ApiFailure => ({ ok: false, status, code: status, message: "", details });

describe("saveVanityFailureMessage", () => {
  it("el 409 dice que otro servidor ya la usa", () => {
    expect(
      saveVanityFailureMessage(
        failure(409, { field: "code", reason: "vanity_code_taken" }),
      ),
    ).toBe(VANITY_CODE_TAKEN);
  });

  it("el 400 repite la regla", () => {
    expect(
      saveVanityFailureMessage(
        failure(400, { field: "code", reason: "vanity_code_invalid" }),
      ),
    ).toBe("Usá solo minúsculas, números y guiones.");
  });

  it("el 403 distingue nivel de permiso", () => {
    expect(
      saveVanityFailureMessage(
        failure(403, { reason: "boost_level_required", required_level: 3 }),
      ),
    ).toBe("Este servidor necesita el nivel 3 de boosts para eso.");
    expect(saveVanityFailureMessage(failure(403))).toBe(NO_PERMISSION_VANITY);
  });

  it("la sesión vencida y el resto", () => {
    expect(saveVanityFailureMessage(failure(401))).toBe(
      SESSION_EXPIRED_MESSAGE,
    );
    expect(saveVanityFailureMessage(failure(500))).toBe(VANITY_SAVE_FAILED);
  });
});

describe("avisos de la URL", () => {
  const link = "discordia.app/invite/club-lectura";

  it("al quitarla avisa que se libera", () => {
    expect(vanityRemoveImpact(link)).toBe(
      "discordia.app/invite/club-lectura deja de funcionar y otro servidor la puede tomar.",
    );
  });

  it("en pausa dice que sigue reservada", () => {
    expect(vanityPausedTitle(link)).toBe(
      "discordia.app/invite/club-lectura está en pausa",
    );
    expect(VANITY_PAUSED_DETAIL).toBe(
      "El servidor bajó al nivel 2. La URL sigue siendo tuya y vuelve a funcionar sola al llegar otra vez a 30 boosts.",
    );
  });
});

describe("URL personalizada bloqueada", () => {
  it("dice en qué nivel se activa", () => {
    expect(VANITY_URL_COPY.locked).toBe(
      "Un link corto que no vence, para invitar a quien quieras. Se activa en el nivel 3.",
    );
  });
});

import { describe, expect, it } from "vitest";

import type { ApiFailure } from "../domain/api-result";

import {
  changePasswordFailure,
  CURRENT_PASSWORD_INVALID,
  PASSWORD_NOT_SET,
} from "./account-password";
import { PASSWORD_TOO_WEAK, PASSWORD_UPDATE_UNAVAILABLE } from "./auth";

function failure(status: number, code: string | number): ApiFailure {
  return { ok: false, status, code, message: "" };
}

describe("changePasswordFailure", () => {
  it("marca la cuenta sin contraseña para ofrecer definirla", () => {
    expect(changePasswordFailure(failure(409, "PASSWORD_NOT_SET"))).toEqual({
      ok: false,
      message: PASSWORD_NOT_SET,
      passwordNotSet: true,
    });
  });

  it("trata el 403 como contraseña actual incorrecta, no como sesión vencida", () => {
    expect(
      changePasswordFailure(failure(403, "INVALID_PASSWORD")).message,
    ).toBe(CURRENT_PASSWORD_INVALID);
  });

  it("traduce los rechazos de la nueva contraseña", () => {
    expect(changePasswordFailure(failure(400, "SAME_PASSWORD")).message).toBe(
      "La nueva contraseña tiene que ser distinta de la actual.",
    );
    expect(
      changePasswordFailure(failure(400, "PASSWORDS_DO_NOT_MATCH")).message,
    ).toBe("Las contraseñas no coinciden.");
    expect(
      changePasswordFailure(failure(400, "INSECURE_PASSWORD")).message,
    ).toBe(PASSWORD_TOO_WEAK);
  });

  it("cae al mensaje de servicio no disponible ante un error inesperado", () => {
    expect(changePasswordFailure(failure(500, "INTERNAL_ERROR")).message).toBe(
      PASSWORD_UPDATE_UNAVAILABLE,
    );
  });
});

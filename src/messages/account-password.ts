import type { ApiFailure } from "../domain/api-result";
import type { ChangePasswordResult } from "../domain/auth";
import { SAME_PASSWORD_RULE_MESSAGE } from "../validation/auth";

import { PASSWORD_TOO_WEAK, PASSWORD_UPDATE_UNAVAILABLE } from "./auth";
import { messageFor } from "./message-for";

export const ACCOUNT_PASSWORD_COPY = {
  changeRowTitle: "Cambiar contraseña",
  changeRowDescription: "Actualizá la contraseña con la que iniciás sesión.",
  setRowTitle: "Definir contraseña",
  setRowDescription:
    "Tu cuenta usa Google. Creá una contraseña para entrar también con tu correo.",
  changeFormTitle: "Cambiá tu contraseña",
  changeFormDescription:
    "Ingresá la contraseña que usás hoy y elegí una nueva.",
  setFormTitle: "Definí una contraseña",
  setFormDescription:
    "Así vas a poder iniciar sesión con tu correo además de Google.",
  currentPasswordLabel: "Contraseña actual",
  newPasswordLabel: "Nueva contraseña",
  confirmPasswordLabel: "Confirmar contraseña",
  submit: "Guardar",
  cancel: "Cancelar",
  changed: "Tu contraseña se actualizó.",
  set: "Tu contraseña quedó guardada.",
} as const;

export const CURRENT_PASSWORD_INVALID = "La contraseña actual es incorrecta.";

export const PASSWORD_NOT_SET =
  "Tu cuenta todavía no tiene una contraseña. Definí una primero.";

export function changePasswordFailure(
  failure: ApiFailure,
): Extract<ChangePasswordResult, { ok: false }> {
  switch (failure.code) {
    case "PASSWORD_NOT_SET":
      return { ok: false, message: PASSWORD_NOT_SET, passwordNotSet: true };
    case "INVALID_PASSWORD":
      return { ok: false, message: CURRENT_PASSWORD_INVALID };
    case "SAME_PASSWORD":
      return { ok: false, message: `${SAME_PASSWORD_RULE_MESSAGE}.` };
    case "PASSWORDS_DO_NOT_MATCH":
      return { ok: false, message: "Las contraseñas no coinciden." };
    case "INSECURE_PASSWORD":
      return { ok: false, message: PASSWORD_TOO_WEAK };
    default:
      return {
        ok: false,
        message: messageFor(failure, {}, PASSWORD_UPDATE_UNAVAILABLE),
      };
  }
}

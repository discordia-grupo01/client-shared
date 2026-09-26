/**
 * Validacion de los formularios del segundo factor.
 *
 * Igual que `validation/auth.ts`: funciones puras que replican lo que valida
 * identify-service, ni mas ni menos. El backend sigue siendo la unica
 * autoridad; aca solo se evita mandar requests obviamente invalidos.
 */
import {
  RECOVERY_CODE_ALPHABET,
  RECOVERY_CODE_LENGTH,
  TOTP_CODE_LENGTH,
} from "../constants/limits";
import type {
  TwoFactorCodeErrors,
  TwoFactorCodeValues,
  TwoFactorPasswordErrors,
  TwoFactorPasswordValues,
} from "../domain/two-factor";

const TOTP_DIGITS_ONLY = new RegExp(`^\\d{${TOTP_CODE_LENGTH}}$`);

/**
 * Deja el codigo como lo genero el backend: sin guiones ni espacios y en
 * mayusculas.
 *
 * Es la misma normalizacion que hace `NormalizeRecoveryCode` en Go. Sin esto,
 * pegar `a1b2c-d3e4f` desde un gestor de contraseñas se veria como invalido
 * antes de llegar al backend.
 */
export function normalizeRecoveryCode(value: string): string {
  return [...value.trim().toUpperCase()]
    .filter((character) => RECOVERY_CODE_ALPHABET.includes(character))
    .join("");
}

/** Quita lo que no sea digito: el TOTP se suele pegar con espacios ("123 456"). */
export function normalizeTotpCode(value: string): string {
  return value.replace(/\D/g, "");
}

/** Un TOTP son exactamente 6 digitos. */
export function isTotpCode(value: string): boolean {
  return TOTP_DIGITS_ONLY.test(normalizeTotpCode(value));
}

/**
 * Un codigo de recuperacion normaliza a 10 caracteres del alfabeto y, a
 * diferencia del TOTP, siempre tiene al menos una letra.
 */
export function isRecoveryCode(value: string): boolean {
  const normalized = normalizeRecoveryCode(value);
  return normalized.length === RECOVERY_CODE_LENGTH && /[A-Z]/.test(normalized);
}

export function validateTwoFactorCode(
  values: TwoFactorCodeValues,
): TwoFactorCodeErrors {
  const code = values.code.trim();
  if (code === "") return { code: "Ingresá el código de verificación" };
  if (isTotpCode(code) || isRecoveryCode(code)) return {};

  return {
    code: `Ingresá los ${TOTP_CODE_LENGTH} dígitos de tu app, o uno de tus códigos de recuperación`,
  };
}

export function validateTwoFactorActivationCode(
  values: TwoFactorCodeValues,
): TwoFactorCodeErrors {
  const code = values.code.trim();
  if (code === "") return { code: "Ingresá el código de tu app" };
  if (!isTotpCode(code)) {
    return { code: `El código tiene ${TOTP_CODE_LENGTH} dígitos` };
  }
  return {};
}

export function validateTwoFactorPassword(
  values: TwoFactorPasswordValues,
): TwoFactorPasswordErrors {
  if (values.password === "") return { password: "Ingresá tu contraseña" };
  return {};
}

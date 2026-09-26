/**
 * Mensajes del segundo factor.
 *
 * Van aparte de `auth.ts` porque las dos apps los eligen mirando el `code`
 * simbolico que devuelve identify-service, no solo el status HTTP: en
 * `POST /v1/login/2fa` un 401 puede ser "el codigo esta mal" (se reintenta en
 * la misma pantalla) o "el desafio vencio" (hay que volver al login), y
 * confundirlos deja al usuario tipeando codigos en una pantalla muerta.
 */
import { RECOVERY_CODE_COUNT, TOTP_CODE_LENGTH } from "../constants/limits";

/** 401 con `INVALID_TWO_FACTOR_CODE` en `POST /v1/login/2fa` (CA3). */
export const TWO_FACTOR_CODE_INVALID =
  "El código no es correcto o ya expiró. Probá con el que muestra tu app en este momento.";

/** 400 con `INVALID_TWO_FACTOR_CODE` en `POST /v1/me/2fa/activate` (CA1). */
export const TWO_FACTOR_ACTIVATION_CODE_INVALID =
  "El código no es correcto. Revisá que hayas escaneado bien el QR y que sea el código actual.";

/**
 * 401 con `TWO_FACTOR_CHALLENGE_EXPIRED`. Distinto del anterior: acá
 * reintentar no sirve, hay que volver a poner email y contraseña.
 */
export const TWO_FACTOR_CHALLENGE_EXPIRED =
  "La verificación expiró. Iniciá sesión de nuevo.";

/** 429 con `TWO_FACTOR_TOO_MANY_ATTEMPTS`. */
export const TWO_FACTOR_TOO_MANY_ATTEMPTS =
  "Demasiados intentos fallidos. Iniciá sesión de nuevo para volver a intentar.";

/** 403 con `INVALID_PASSWORD` al desactivar o regenerar códigos. */
export const TWO_FACTOR_PASSWORD_INVALID = "La contraseña es incorrecta.";

/** 409 con `TWO_FACTOR_ALREADY_ENABLED`. */
export const TWO_FACTOR_ALREADY_ENABLED =
  "El segundo factor ya está activo en tu cuenta.";

/** 409 con `TWO_FACTOR_NOT_ENABLED`. */
export const TWO_FACTOR_NOT_ENABLED =
  "El segundo factor no está activo en tu cuenta.";

/** 409 con `TWO_FACTOR_SETUP_MISSING`: se perdió el paso del QR. */
export const TWO_FACTOR_SETUP_MISSING =
  "Volvé a escanear el código QR para activar el segundo factor.";

// --- El servicio no responde (5xx, timeout, red caída) ---
export const TWO_FACTOR_UNAVAILABLE =
  "No pudimos verificar el código en este momento. Intentá de nuevo más tarde.";
export const TWO_FACTOR_SETUP_UNAVAILABLE =
  "No pudimos preparar el segundo factor en este momento. Intentá de nuevo más tarde.";
export const TWO_FACTOR_DISABLE_UNAVAILABLE =
  "No pudimos desactivar el segundo factor en este momento. Intentá de nuevo más tarde.";

// --- Textos de las pantallas, compartidos por las dos apps ---

export const TWO_FACTOR_SCAN_INSTRUCTIONS =
  "Escaneá este código con Google Authenticator, Authy o la app que uses. Si no podés escanearlo, ingresá la clave a mano.";

export const TWO_FACTOR_VERIFY_INSTRUCTIONS = `Ingresá los ${TOTP_CODE_LENGTH} dígitos que muestra tu app autenticadora.`;

export const TWO_FACTOR_RECOVERY_CODES_TITLE = "Códigos de recuperación";

/**
 * Se muestran una sola vez: el backend solo guarda su hash. Si el usuario
 * cierra la pantalla sin anotarlos, la única salida es regenerarlos.
 */
export const TWO_FACTOR_RECOVERY_CODES_WARNING = `Guardá estos ${RECOVERY_CODE_COUNT} códigos en un lugar seguro. Cada uno sirve una sola vez y no vas a volver a verlos.`;

/** CA4: el aviso después de entrar con un código de recuperación. */
export const TWO_FACTOR_RECOVERY_CODE_USED =
  "Entraste con un código de recuperación y ese código ya no sirve más.";

export function twoFactorRecoveryCodesRemaining(remaining: number): string {
  if (remaining === 0) {
    return "Te quedaste sin códigos de recuperación. Generá una lista nueva ahora.";
  }
  if (remaining === 1) {
    return "Te queda 1 código de recuperación. Te conviene generar una lista nueva.";
  }
  return `Te quedan ${remaining} códigos de recuperación. Te conviene generar una lista nueva.`;
}

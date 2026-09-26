/**
 * Segundo factor de autenticacion (TOTP).
 *
 * Las interfaces con snake_case son la forma exacta en que viaja el JSON de
 * `identify-service`; los `*Result` son lo que cada app le devuelve a sus
 * pantallas.
 */
import type { User } from "./user";

/** `GET /v1/me/2fa`. */
export interface TwoFactorStatus {
  enabled: boolean;
  /**
   * Hay un secreto generado pero sin confirmar: el usuario pidio el QR y no
   * termino. El login sigue siendo de un solo paso.
   */
  pending_activation: boolean;
  recovery_codes_remaining: number;
}

/** `POST /v1/me/2fa/setup`. */
export interface TwoFactorSetup {
  /** Base32, para el caso "no puedo escanear, lo ingreso a mano". */
  secret: string;
  /**
   * URI `otpauth://` completa. El QR lo dibuja cada app: el backend no
   * devuelve imagenes, asi web y mobile usan cada una su renderer.
   */
  otpauth_url: string;
  issuer: string;
  account: string;
}

export interface TwoFactorRecoveryCodesPayload {
  recovery_codes: string[];
}

export interface TwoFactorChallengePayload {
  two_factor_required: true;
  challenge_token: string;
  /** Segundos de validez del desafio. */
  expires_in: number;
}

/**
 * `POST /v1/login` responde con dos formas distintas segun el caso: una
 * sesion (200), o este desafio (202, porque la contraseña se acepto pero el
 * login no esta completo). Las dos apps tienen que decidir cual llego, asi
 * que el chequeo vive una sola vez aca en vez de escrito a mano en cada BFF y
 * en cada pantalla -- y es por el contenido del body, no por el codigo HTTP,
 * para no depender de que cada capa intermedia lo propague sin tocarlo.
 */
export function isTwoFactorChallenge(
  payload: unknown,
): payload is TwoFactorChallengePayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    (payload as TwoFactorChallengePayload).two_factor_required === true &&
    typeof (payload as TwoFactorChallengePayload).challenge_token === "string"
  );
}

export interface TwoFactorVerifyPayload {
  user: User;
  token: string;
  recovery_code_used?: boolean;
  recovery_codes_remaining?: number;
}

export type TwoFactorVerifyResult =
  | {
      ok: true;
      user: User;
      recoveryCodeUsed: boolean;
      recoveryCodesRemaining: number;
    }
  | { ok: false; message: string; expired?: boolean };

export type TwoFactorVerifyResultWithToken =
  | {
      ok: true;
      user: User;
      token: string;
      recoveryCodeUsed: boolean;
      recoveryCodesRemaining: number;
    }
  | { ok: false; message: string; expired?: boolean };

export type TwoFactorStatusResult =
  { ok: true; status: TwoFactorStatus } | { ok: false; message: string };

export type TwoFactorSetupResult =
  { ok: true; setup: TwoFactorSetup } | { ok: false; message: string };

export type TwoFactorRecoveryCodesResult =
  { ok: true; recoveryCodes: string[] } | { ok: false; message: string };

export type TwoFactorDisableResult =
  { ok: true } | { ok: false; message: string };

export interface TwoFactorCodeValues {
  code: string;
}

export interface TwoFactorCodeErrors {
  code?: string;
}

export interface TwoFactorPasswordValues {
  password: string;
}

export interface TwoFactorPasswordErrors {
  password?: string;
}

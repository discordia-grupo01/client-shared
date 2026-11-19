import type { User } from "./user";

export interface AuthResponse {
  user: User;
  token: string;
}

/**
 * Solo lo comun. Cada app guarda la sesion distinto y esta bien que asi sea:
 * web-client suma `refreshToken` porque lo mete en la cookie httpOnly;
 * en mobile ese token vive en una cookie nativa, fuera de este objeto.
 */
export interface SessionBase {
  token: string;
  user: User;
}

export type LoginResult =
  | { ok: true; twoFactorRequired?: false; user: User }
  | { ok: true; twoFactorRequired: true; expiresIn: number }
  | { ok: false; message: string; retryAfterSeconds?: number };

/**
 * Login en app-mobile: sin servidor propio en el medio, el token tiene que
 * llegar al cliente para guardarlo en secure-store.
 *
 * Es un tipo aparte y no un `token?` opcional para que web no pueda leer un
 * campo que ahi siempre seria undefined.
 *
 * Por lo mismo, aca la rama de segundo factor si trae `challengeToken`: sin un
 * BFF que se lo guarde, la app tiene que sostenerlo entre los dos pasos.
 */
export type LoginResultWithToken =
  | { ok: true; twoFactorRequired?: false; user: User; token: string }
  | {
      ok: true;
      twoFactorRequired: true;
      challengeToken: string;
      expiresIn: number;
    }
  | { ok: false; message: string; retryAfterSeconds?: number };

/** Registrarse no deja logueado: `POST /v1/users` ya no devuelve token. */
export type RegisterResult = { ok: true } | { ok: false; message: string };

/**
 * Nunca lleva datos de usuario: el back responde igual exista o no el correo,
 * para que no se puedan enumerar cuentas.
 */
export type ForgotPasswordResult =
  { ok: true } | { ok: false; message: string };

export type ResetPasswordResult = { ok: true } | { ok: false; message: string };

export interface EmailConfirmationRequest {
  email: string;
}

export interface EmailConfirmationTokenRequest {
  token: string;
}

export type EmailConfirmationResult =
  { ok: true } | { ok: false; message: string };

/**
 * Formas de los formularios: lo que el usuario tipea (`*Values`) y que esta
 * mal en cada campo (`*Errors`). No viajan por la red; las produce y consume
 * `validation/auth.ts`.
 */

export interface LoginValues {
  email: string;
  password: string;
}

export interface LoginErrors {
  email?: string;
  password?: string;
}

export interface RegisterValues {
  name: string;
  email: string;
  password: string;
}

export interface RegisterErrors {
  name?: string;
  email?: string;
  password?: string;
}

export interface ForgotPasswordValues {
  email: string;
}

export interface ForgotPasswordErrors {
  email?: string;
}

export interface ResetPasswordValues {
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordErrors {
  newPassword?: string;
  confirmPassword?: string;
}

export interface SetPasswordValues {
  password: string;
  confirmPassword: string;
}

export interface SetPasswordErrors {
  password?: string;
  confirmPassword?: string;
}

/**
 * `alreadySet` distingue el 409 de una carrera entre pestañas/dispositivos
 * (la cuenta consiguio contraseña propia mientras se completaba este paso):
 * ahi no es un error bloqueante, la pantalla puede ofrecer seguir directo
 * al paso siguiente en vez de hacer reintentar el formulario.
 */
export type SetPasswordResult =
  { ok: true } | { ok: false; message: string; alreadySet?: boolean };

export interface ChangePasswordValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export type ChangePasswordResult =
  { ok: true } | { ok: false; message: string; passwordNotSet?: boolean };

export interface PinSetupValues {
  pin: string;
  confirmPin: string;
}

export interface PinSetupErrors {
  pin?: string;
  confirmPin?: string;
}

export interface PinLoginValues {
  pin: string;
}

export interface PinLoginErrors {
  pin?: string;
}
export interface PinLockedResult {
  ok: false;
  locked: true;
  message: string;
  retryAfterSeconds: number;
}

export type PinLoginResult = LoginResultWithToken | PinLockedResult;

import type { User } from "./user";

/** Respuesta de `POST /v1/login` y `POST /v1/refresh`. */
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
  | { ok: true; twoFactorRequired: true }
  | { ok: false; message: string };

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
  | { ok: true; twoFactorRequired: true; challengeToken: string }
  | { ok: false; message: string };

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

/**
 * Activar el PIN de acceso rápido (historia "Registro con PIN"). Solo se usa
 * en app-mobile
 */
export interface PinSetupValues {
  pin: string;
  confirmPin: string;
}

export interface PinSetupErrors {
  pin?: string;
  confirmPin?: string;
}

/** Login rápido con PIN: sin email, se resuelve por `device_id` (CA2). */
export interface PinLoginValues {
  pin: string;
}

export interface PinLoginErrors {
  pin?: string;
}

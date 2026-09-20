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

/**
 * Login en web-client: el BFF se queda el token en la cookie httpOnly y el
 * navegador nunca lo ve.
 */
export type LoginResult =
  { ok: true; user: User } | { ok: false; message: string };

/**
 * Login en app-mobile: sin servidor propio en el medio, el token tiene que
 * llegar al cliente para guardarlo en secure-store.
 *
 * Es un tipo aparte y no un `token?` opcional para que web no pueda leer un
 * campo que ahi siempre seria undefined.
 */
export type LoginResultWithToken =
  { ok: true; user: User; token: string } | { ok: false; message: string };

/** Registrarse no deja logueado: `POST /v1/users` ya no devuelve token. */
export type RegisterResult = { ok: true } | { ok: false; message: string };

/**
 * Nunca lleva datos de usuario: el back responde igual exista o no el correo,
 * para que no se puedan enumerar cuentas.
 */
export type ForgotPasswordResult =
  { ok: true } | { ok: false; message: string };

export type ResetPasswordResult = { ok: true } | { ok: false; message: string };

/**
 * Limites del back al editar el perfil propio: nombre 100 runas, descripcion
 * 500, status_text 64, status_emoji 32 bytes, imagen 5 MiB y 4096 px de lado.
 */
export interface User {
  id: string;
  name: string;
  email: string;
  description: string;
  avatar_url: string;
  status_text: string;
  status_emoji: string;
  created_at: string;
}

/** Vista publica: no trae `email` ni `created_at`, a diferencia de `User`. */
export interface PublicUser {
  id: string;
  name: string;
  description: string;
  avatar_url: string;
  status_text: string;
  status_emoji: string;
  mutual_server_ids: string[];
  /**
   * Siempre llega undefined: identify-service todavia no tiene ningun
   * concepto de suspension. Tipado para cuando lo agreguen.
   */
  is_suspended?: boolean;
}

export type GetOwnProfileResult =
  { ok: true; user: User } | { ok: false; message: string };

export type GetPublicProfileResult =
  { ok: true; user: PublicUser } | { ok: false; message: string };

export type UpdateOwnProfileResult =
  | { ok: true; user: User }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export type UpdateCustomStatusResult =
  { ok: true; user: User } | { ok: false; message: string };

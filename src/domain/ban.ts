/**
 * El backend solo conoce el `user_id`: el nombre y el avatar se resuelven
 * aparte contra `GET /v1/users/:id`, igual que con los miembros.
 */
export interface Ban {
  server_id: string;
  user_id: string;
  reason: string | null;
  /** `null` en los baneos anteriores a que se registrara quien baneo. */
  banned_by: string | null;
  banned_at: string;
}

/** Paginado: el back usa limit 20 por defecto y corta en 100. */
export interface BanListResponse {
  bans: Ban[];
  total: number;
  limit: number;
  offset: number;
}

/** Las claves espejan el `details.field` del backend, por eso snake_case. */
export interface BanFieldErrors {
  user_id?: string;
  reason?: string;
}

export type ListBansResult =
  { ok: true; bans: Ban[]; total: number } | { ok: false; message: string };

export type BanMemberResult =
  | { ok: true; ban: Ban }
  | { ok: false; message: string; fieldErrors?: BanFieldErrors };

export type UnbanMemberResult = { ok: true } | { ok: false; message: string };

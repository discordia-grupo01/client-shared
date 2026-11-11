import { type BoostLevel, toBoostLevel } from "./boost";
import type { Category } from "./category";
import type { Channel } from "./channel";

/** Nombre: de 2 a 100 caracteres. */
export interface ServerSummary {
  id: string;
  name: string;
  icon_url: string | null;
  banner_url: string | null;
  owner_id: string;
  created_at: string;
  channels: Channel[];
  categories: Category[];
  /**
   * `true` si el staff de la plataforma lo suspendió: `GET /v1/servers` lo
   * sigue listando, pero sin canales ni categorías, y todo lo demás da 403.
   */
  suspended?: boolean;
  /**
   * Boosts activos y el nivel que dan. Opcionales porque un `servers` anterior
   * a los boosts no los manda; leer el nivel con `serverBoostLevel`.
   */
  boost_count?: number;
  boost_level?: number;
  /**
   * URL personalizada. `null` si no tiene o si el servidor bajó del nivel 3:
   * `servers` la guarda, pero no la muestra ni la acepta para entrar.
   */
  vanity_code?: string | null;
}

export function serverBoostCount(
  server: Pick<ServerSummary, "boost_count">,
): number {
  return server.boost_count ?? 0;
}

/**
 * Nivel de boost del servidor. Con nivel bajo, `icon_url` y `banner_url` ya
 * vienen en `null` si eran un GIF o un banner que ese nivel no desbloquea.
 */
export function serverBoostLevel(
  server: Pick<ServerSummary, "boost_level">,
): BoostLevel {
  return toBoostLevel(server.boost_level);
}

export interface CreateServerFieldErrors {
  name?: string;
  icon?: string;
}

export type CreateServerResult =
  | { ok: true; server: ServerSummary }
  | { ok: false; message: string; fieldErrors?: CreateServerFieldErrors };

export type ListServersResult =
  { ok: true; servers: ServerSummary[] } | { ok: false; message: string };

export type GetServerResult =
  { ok: true; server: ServerSummary } | { ok: false; message: string };

export interface UpdateServerFieldErrors {
  name?: string;
  icon?: string;
  banner?: string;
}

export type UpdateServerResult =
  | { ok: true; server: ServerSummary }
  | { ok: false; message: string; fieldErrors?: UpdateServerFieldErrors };

/**
 * El owner no puede irse: 409 con `details.reason`. `reason` espeja ese valor
 * en vez de traducirlo a un booleano, que perdia el motivo.
 */
export type LeaveServerResult =
  | { ok: true }
  | {
      ok: false;
      message: string;
      reason?: "owner_must_transfer_or_delete";
    };

/**
 * `confirm_name` no matcheo el nombre real del servidor: 400 con
 * `details.field = "confirm_name"` (`ErrDeleteConfirmationMismatch` en
 * `servers`). No hay un `reason` de "no sos el owner" que mapear aca: ese caso
 * es un 403 liso sin detalle, y el menu que abre este flujo ya esta gateado
 * por `isOwner`, asi que llegar ahi sin serlo es defensivo, no un camino
 * esperado.
 */
export interface DeleteServerFieldErrors {
  confirm_name?: string;
}

export type DeleteServerResult =
  | { ok: true }
  | {
      ok: false;
      message: string;
      fieldErrors?: DeleteServerFieldErrors;
    };

export interface ServerLeftPayload {
  server_id: string;
}

/** Payload de `server_suspended` y `server_reactivated` en la sala `user:<id>`. */
export interface ServerSuspensionPayload {
  server_id: string;
}

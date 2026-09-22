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

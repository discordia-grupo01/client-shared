import type { ServerSummary } from "./server";

/**
 * `expires_at` puede ser null: el modelo lo permite (`*time.Time`) aunque hoy
 * el servicio siempre setee un TTL fijo de 7 dias al generar.
 */
export interface Invitation {
  code: string;
  url: string;
  server_id: string;
  created_by: string;
  max_uses: number | null;
  uses: number;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

/** Las claves espejan el `details.field` del backend, por eso snake_case. */
export interface CreateInviteFieldErrors {
  max_uses?: string;
}

export type CreateInviteResult =
  | { ok: true; invitation: Invitation }
  | { ok: false; message: string; fieldErrors?: CreateInviteFieldErrors };

/** Idempotente del lado del back. */
export type RevokeInviteResult = { ok: true } | { ok: false; message: string };

/**
 * Trae TODAS las invitaciones (activas, revocadas o vencidas), mas nuevas
 * primero. El back no filtra por estado: el front calcula el de cada una.
 */
export type ListInvitationsResult =
  { ok: true; invitations: Invitation[] } | { ok: false; message: string };

export interface JoinServerFieldErrors {
  code?: string;
}

/**
 * El back NO devuelve el servidor al entrar, solo su id: para mostrar algo
 * hace falta una segunda llamada a `GET /v1/servers/:id`.
 */
export interface JoinResponse {
  server_id: string;
  already_member: boolean;
}

export type JoinServerResult =
  | { ok: true; server: ServerSummary; alreadyMember: boolean }
  | { ok: false; message: string; fieldErrors?: JoinServerFieldErrors };

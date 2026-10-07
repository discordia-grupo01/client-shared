/**
 * Bloqueos entre usuarios (`messaging`). Solo se conoce a quien bloqueaste vos:
 * el back nunca informa quien te bloqueo a vos.
 */

/** Elemento de `GET /v1/blocks`. */
export interface BlockedUser {
  user_id: string;
  created_at: string;
}

export type ListBlocksResult =
  { ok: true; blockedUserIds: string[] } | { ok: false; message: string };

/** Resultado de bloquear o desbloquear (ambos responden 204 sin cuerpo). */
export type BlockUserResult = { ok: true } | { ok: false; message: string };

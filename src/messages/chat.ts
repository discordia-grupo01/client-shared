/**
 * Textos de los errores del chat de un canal. `messaging` devuelve
 * `error.code` (no `details.reason`), asi que van en su propio catalogo por
 * codigo y no en `reasons.ts`. Todos en voseo.
 */
import { MAX_MESSAGE_LENGTH } from "../constants/limits";
import type { AccessRevokedReason, MessageErrorCode } from "../domain/message";

import { UNEXPECTED_ERROR_MESSAGE } from "./errors";

export const MESSAGE_ERROR_MESSAGES: Record<MessageErrorCode, string> = {
  EMPTY_CONTENT: "Escribí un mensaje.",
  MESSAGE_TOO_LONG: `El mensaje no puede superar los ${MAX_MESSAGE_LENGTH} caracteres.`,
  FORBIDDEN: "No tenés permiso para enviar mensajes en este canal.",
  CHANNEL_NOT_FOUND: "Este canal ya no existe.",
  CHANNEL_NOT_TEXT: "Solo se puede chatear en canales de texto.",
  INVALID_CURSOR:
    "No pudimos cargar los mensajes anteriores. Recargá e intentá de nuevo.",
  MESSAGE_NOT_FOUND: "Este mensaje ya no existe.",
  MESSAGE_DELETE_DENIED: "No tenés permiso para eliminar este mensaje.",
  NOT_MESSAGE_AUTHOR: "Solo el autor de un mensaje puede editarlo.",
  MENTIONS_UNAVAILABLE:
    "No pudimos verificar las menciones del mensaje. Intentá de nuevo en un momento.",
  INVALID_EMOJI: "Solo se puede reaccionar con un emoji.",
  TOO_MANY_REACTIONS:
    "Este mensaje ya tiene el máximo de reacciones distintas.",
};

/** No se pudo enviar y no hay un codigo que explique por que (timeout, canal caido). */
export const MESSAGE_SEND_FAILED =
  "No pudimos enviar el mensaje. Intentá de nuevo.";

/** No se pudo eliminar y no hay un codigo que explique por que (timeout, canal caido). */
export const MESSAGE_DELETE_FAILED =
  "No pudimos eliminar el mensaje. Intentá de nuevo.";

/** No se pudo editar y no hay un codigo que explique por que (timeout, canal caido). */
export const MESSAGE_EDIT_FAILED =
  "No pudimos editar el mensaje. Intentá de nuevo.";

/** No se pudo reaccionar y no hay un codigo que explique por que (timeout, canal caido). */
export const REACTION_FAILED =
  "No pudimos guardar tu reacción. Intentá de nuevo.";

/** El back rechazo la reaccion por permisos (`FORBIDDEN` en `add_reaction`). */
export const REACTION_FORBIDDEN =
  "No tenés permiso para reaccionar en este canal.";

/** No se pudo cargar el historial del canal. */
export const MESSAGES_LOAD_FAILED =
  "No pudimos cargar los mensajes. Intentá de nuevo.";

/** No se pudieron cargar las menciones sin leer. */
export const MENTIONS_LOAD_FAILED =
  "No pudimos cargar tus menciones. Intentá de nuevo.";

/** No se pudieron marcar como leidas las menciones de un canal. */
export const MENTIONS_MARK_READ_FAILED =
  "No pudimos marcar tus menciones como leídas.";

/** El WebSocket se cayo y se esta reconectando. */
export const CHAT_RECONNECTING_NOTICE = "Reconectando…";

/** Texto cuando el back cierra el canal porque ya no hay acceso (`access_revoked`). */
export const ACCESS_REVOKED_MESSAGES: Readonly<
  Record<AccessRevokedReason, string>
> = {
  member_left: "Ya no sos miembro de este servidor.",
  channel_deleted: "Este canal ya no existe.",
  server_deleted: "Este servidor ya no existe.",
};

export function isMessageErrorCode(code: unknown): code is MessageErrorCode {
  return typeof code === "string" && code in MESSAGE_ERROR_MESSAGES;
}

/**
 * Texto para un `error.code` de `messaging`. Si el codigo no se conoce (o
 * viene otra cosa), cae al generico.
 */
export function messageErrorFor(
  code: unknown,
  fallback: string = UNEXPECTED_ERROR_MESSAGE,
): string {
  return isMessageErrorCode(code) ? MESSAGE_ERROR_MESSAGES[code] : fallback;
}

/**
 * Textos de los errores del chat de un canal. `messaging` devuelve
 * `error.code` (no `details.reason`), asi que van en su propio catalogo por
 * codigo y no en `reasons.ts`. Todos en voseo.
 */
import { MAX_MESSAGE_LENGTH } from "../constants/limits";
import type { MessageErrorCode } from "../domain/message";

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
};

/** No se pudo enviar y no hay un codigo que explique por que (timeout, canal caido). */
export const MESSAGE_SEND_FAILED =
  "No pudimos enviar el mensaje. Intentá de nuevo.";

/** No se pudo eliminar y no hay un codigo que explique por que (timeout, canal caido). */
export const MESSAGE_DELETE_FAILED =
  "No pudimos eliminar el mensaje. Intentá de nuevo.";

/** No se pudo cargar el historial del canal. */
export const MESSAGES_LOAD_FAILED =
  "No pudimos cargar los mensajes. Intentá de nuevo.";

/** El WebSocket se cayo y se esta reconectando. */
export const CHAT_RECONNECTING_NOTICE = "Reconectando…";

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

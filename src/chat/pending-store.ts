import {
  PENDING_TTL_MS,
  SEND_MAX_ATTEMPTS,
  type PendingMessage,
} from "./send-queue";

/**
 * Lo que se guarda en el dispositivo de los mensajes sin enviar: por usuario,
 * un mapa de chat a mensajes. Cada app lo guarda como texto donde pueda
 * (localStorage, AsyncStorage); aca solo se arma y se lee ese texto.
 */
export type PendingByChat = Record<string, PendingMessage[]>;

interface StoredPending {
  clientId: string;
  content: string;
  createdAt: string;
}

export function serializePending(byChat: PendingByChat): string {
  const stored: Record<string, StoredPending[]> = {};
  for (const [chatKey, entries] of Object.entries(byChat)) {
    if (entries.length === 0) continue;
    stored[chatKey] = entries.map(({ clientId, content, createdAt }) => ({
      clientId,
      content,
      createdAt,
    }));
  }
  return JSON.stringify(stored);
}

/**
 * Lo guardado, sin los mensajes de mas de 24 h (se descartan sin aviso). Tras
 * recargar nada se reenvia solo: todo vuelve como `failed`, para que el usuario
 * decida con Reintentar o Eliminar.
 */
export function parsePending(raw: string | null, nowMs: number): PendingByChat {
  if (!raw) return {};
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return {};
  }
  if (typeof data !== "object" || data === null) return {};

  const result: PendingByChat = {};
  for (const [chatKey, value] of Object.entries(data)) {
    if (!Array.isArray(value)) continue;
    const entries = value.flatMap((item): PendingMessage[] => {
      const stored = item as Partial<StoredPending> | null;
      if (
        typeof stored?.clientId !== "string" ||
        typeof stored.content !== "string" ||
        typeof stored.createdAt !== "string" ||
        !(nowMs - Date.parse(stored.createdAt) < PENDING_TTL_MS)
      ) {
        return [];
      }
      return [
        {
          clientId: stored.clientId,
          content: stored.content,
          status: "failed",
          attempts: SEND_MAX_ATTEMPTS,
          error: null,
          createdAt: stored.createdAt,
          acked: false,
        },
      ];
    });
    if (entries.length > 0) result[chatKey] = entries;
  }
  return result;
}

/** `byChat` con los mensajes de `chatKey` reemplazados (o quitados si no quedan). */
export function withChatPending(
  byChat: PendingByChat,
  chatKey: string,
  entries: readonly PendingMessage[],
): PendingByChat {
  const next = { ...byChat };
  if (entries.length > 0) next[chatKey] = [...entries];
  else delete next[chatKey];
  return next;
}

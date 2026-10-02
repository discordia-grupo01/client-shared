/**
 * Mensajes de un canal de texto. `Message` espeja lo que devuelve el servicio
 * `messaging` (`Message.to_api` en el back), con los mismos nombres.
 */
export interface MessageReaction {
  emoji: string;
  count: number;
  /** Si el usuario actual es uno de los que reacciono. */
  reacted_by_me: boolean;
}

export interface Message {
  id: string;
  channel_id: string;
  server_id: string;
  /** Autor del mensaje. El front lo cruza con el perfil del miembro (ver `MessageAuthor`). */
  user_id: string;
  content: string;
  /**
   * ISO 8601 en UTC. Los mensajes que llegan por el WebSocket traen
   * microsegundos y los del historial REST solo milisegundos (Mongo guarda ms):
   * comparar siempre como fecha, nunca como texto.
   */
  inserted_at: string;

  /*
   * Los tres campos que siguen NO existen todavia en `messaging`: la UI de
   * editar, borrar y reaccionar esta maquetada y funciona de forma local (se
   * pierde al recargar). Un mensaje real llega sin ellos; cuando el back los
   * soporte pasan a ser parte de la respuesta y dejan de ser opcionales.
   */
  /** `null` o ausente si nunca se edito. */
  edited_at?: string | null;
  /** `null` o ausente si sigue visible. El contenido de un mensaje borrado no importa: la UI muestra un placeholder. */
  deleted_at?: string | null;
  reactions?: MessageReaction[];
}

/** Respuesta de `GET /v1/channels/:id/messages` (mas nuevos primero). */
export interface MessageHistory {
  messages: Message[];
  /** Id de mensaje para pedir la pagina anterior (`before`); `null` si no hay mas. */
  next_cursor: string | null;
}

/** Payload del evento `"missed_messages"` del WebSocket (de mas viejo a mas nuevo). */
export interface MissedMessagesPayload {
  messages: Message[];
}

/** `error.code` que devuelve `messaging` (REST y WebSocket). */
export type MessageErrorCode =
  | "EMPTY_CONTENT"
  | "MESSAGE_TOO_LONG"
  | "FORBIDDEN"
  | "CHANNEL_NOT_FOUND"
  | "CHANNEL_NOT_TEXT"
  | "INVALID_CURSOR";

export type ListMessagesResult =
  | { ok: true; messages: Message[]; nextCursor: string | null }
  | { ok: false; message: string; code?: MessageErrorCode };

/**
 * Autor de un mensaje ya resuelto para pintarlo. Lo arma el front cruzando
 * `user_id` con el perfil y los roles del miembro, por eso va en camelCase.
 */
export interface MessageAuthor {
  id: string;
  name: string;
  avatarUrl: string | null;
  /** Rol a mostrar como etiqueta al lado del nombre. */
  roleName: string | null;
  /** Color del nombre (el del rol), `null` para el color de texto normal. */
  roleColor: string | null;
}

/** Ventana en la que mensajes seguidos del mismo autor se agrupan. */
export const MESSAGE_GROUP_WINDOW_MINUTES = 7;

/**
 * Lo minimo que hace falta para agrupar mensajes en una linea de tiempo.
 * `Message` y `DmMessage` (mensajes directos, `domain/conversation.ts`) cumplen
 * esta forma por igual, asi que `startsMessageGroup` sirve para las dos sin
 * duplicarla.
 */
export type TimelineMessage = Pick<Message, "user_id" | "inserted_at">;

/**
 * `true` si `message` abre un grupo nuevo (lleva avatar, nombre y hora):
 * es el primero, cambia el autor o paso mas de la ventana de agrupado.
 */
export function startsMessageGroup(
  previous: TimelineMessage | undefined,
  message: TimelineMessage,
): boolean {
  if (!previous || previous.user_id !== message.user_id) return true;
  const gapMs =
    new Date(message.inserted_at).getTime() -
    new Date(previous.inserted_at).getTime();
  return gapMs > MESSAGE_GROUP_WINDOW_MINUTES * 60 * 1000;
}

/**
 * Agrega o saca la reaccion del usuario actual con `emoji`. Si el contador
 * queda en 0, la reaccion desaparece. No muta `reactions`.
 */
export function toggleReaction(
  reactions: MessageReaction[] = [],
  emoji: string,
): MessageReaction[] {
  const existing = reactions.find((reaction) => reaction.emoji === emoji);
  if (!existing) {
    return [...reactions, { emoji, count: 1, reacted_by_me: true }];
  }

  const delta = existing.reacted_by_me ? -1 : 1;
  const updated = {
    ...existing,
    count: existing.count + delta,
    reacted_by_me: !existing.reacted_by_me,
  };
  return updated.count > 0
    ? reactions.map((reaction) => (reaction === existing ? updated : reaction))
    : reactions.filter((reaction) => reaction !== existing);
}

/** Solo el autor puede editar su propio mensaje. */
export function canEditMessage(
  message: Pick<Message, "user_id">,
  currentUserId: string,
): boolean {
  return message.user_id === currentUserId;
}

/**
 * El autor siempre puede borrar el suyo; `canManageMessages` (calculado una
 * sola vez arriba con `hasPermission(ctx, "MANAGE_MESSAGES")`) habilita
 * borrar mensajes ajenos por moderacion. No aplica a mensajes directos: ahi
 * solo existe autoria, no moderacion (ver `domain/conversation.ts`).
 */
export function canDeleteMessage(
  message: Pick<Message, "user_id">,
  currentUserId: string,
  canManageMessages: boolean,
): boolean {
  return canEditMessage(message, currentUserId) || canManageMessages;
}

/** Actualiza el contenido y marca el mensaje como editado. */
export function editMessageContent<
  T extends { content: string; edited_at?: string | null },
>(message: T, content: string, now: string = new Date().toISOString()): T {
  return { ...message, content, edited_at: now };
}

/**
 * Soft delete: vacia el contenido y marca `deleted_at`. La UI muestra un
 * placeholder ("Mensaje eliminado.") en vez de sacar la fila de la lista.
 */
export function deleteMessage<
  T extends { content: string; deleted_at?: string | null },
>(message: T, now: string = new Date().toISOString()): T {
  return { ...message, content: "", deleted_at: now };
}

/**
 * Une mensajes nuevos a la lista actual: sin duplicados (por `id`) y de mas
 * viejo a mas nuevo. El mismo mensaje puede llegar por el historial REST, por
 * `"new_message"` y por `"missed_messages"`, asi que toda entrada al estado
 * pasa por aca. No muta `current`.
 *
 * Si ya estaba el mismo mensaje se conserva el que habia (un mensaje no cambia
 * en el back) y, cuando no se agrega nada, se devuelve `current` tal cual para
 * que React no vuelva a renderizar.
 *
 * Orden: por `inserted_at` como fecha (el vivo trae microsegundos y el
 * historial milisegundos) y, a igual instante, por `id` para que sea estable.
 */
export function mergeMessages(
  current: Message[],
  incoming: Message[],
): Message[] {
  const knownIds = new Set(current.map((message) => message.id));
  const added: Message[] = [];
  for (const message of incoming) {
    if (knownIds.has(message.id)) continue;
    knownIds.add(message.id);
    added.push(message);
  }
  if (added.length === 0) return current;

  return [...current, ...added].sort(compareMessages);
}

function compareMessages(a: Message, b: Message): number {
  const byTime = Date.parse(a.inserted_at) - Date.parse(b.inserted_at);
  if (byTime !== 0) return byTime;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

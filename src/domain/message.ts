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

  /** `true` si el autor lo edito despues de enviarlo. */
  edited?: boolean;
  /** Momento de la ultima edicion; `null` o ausente si nunca se edito. */
  edited_at?: string | null;

  /**
   * Ids de los usuarios mencionados con `<@id>` que cuentan (miembros del
   * servidor). Ausente o vacio en mensajes sin menciones y en DMs.
   */
  mentions?: string[];
  /** Ids de los roles mencionados con `<@&id>`; solo cuentan si el autor tiene `MENTION_EVERYONE`. */
  mention_roles?: string[];
  /** `true` si el mensaje dice `@everyone` y el autor tiene `MENTION_EVERYONE`; si no, es texto comun. */
  mention_everyone?: boolean;

  /**
   * Reacciones, en el orden en que se uso cada emoji por primera vez. Vienen en
   * el historial y en `missed_messages`/`changed_messages`; `new_message` y
   * `message_updated` no las traen (se conservan las que ya habia).
   */
  reactions?: MessageReaction[];
}

/** Respuesta de `GET /v1/channels/:id/messages` (de mas viejo a mas nuevo). */
export interface MessageHistory {
  messages: Message[];
  /** Id de mensaje para pedir la pagina anterior (`before`, o `after` si se pidio con `after`); `null` si no hay mas. */
  next_cursor: string | null;
}

/** Payload del evento `"message_updated"`: el mensaje completo, ya editado. */
export type MessageUpdatedPayload = Message;

/** Payload del evento `"message_deleted"` del WebSocket. */
export interface MessageDeletedPayload {
  id: string;
  channel_id: string;
  server_id: string;
  deleted_at: string;
}

/**
 * Payload del evento `"changed_messages"`: lo que cambio mientras el cliente
 * estaba desconectado (se pide con `changes_since` al unirse al canal).
 */
export interface ChangedMessagesPayload {
  messages: Message[];
  deleted_ids: string[];
}

/** Payload del evento `"missed_messages"` del WebSocket (de mas viejo a mas nuevo). */
export interface MissedMessagesPayload {
  messages: Message[];
  /** Hay mas por traer: id para pedirlos por REST con `after`. `null` si no falta nada. */
  next_cursor: string | null;
}

/** Payload del evento `"reaction_updated"`: alguien agrego o saco una reaccion. */
export interface ReactionUpdatedPayload {
  channel_id: string;
  message_id: string;
  emoji: string;
  /** Quien reacciono: si es el usuario actual, cambia su `reacted_by_me`. */
  user_id: string;
  action: "added" | "removed";
  /** Total despues del cambio, segun el back. */
  count: number;
}

/** Evento del socket para reaccionar o sacar la reaccion propia. */
export type ReactionEvent = "add_reaction" | "remove_reaction";

/** Por que se le cerro el canal a alguien (`access_revoked`). */
export type AccessRevokedReason =
  "member_left" | "channel_deleted" | "server_deleted";

export interface AccessRevokedPayload {
  channel_id: string;
  reason: AccessRevokedReason;
}

/** `error.code` que devuelve `messaging` (REST y WebSocket). */
export type MessageErrorCode =
  | "EMPTY_CONTENT"
  | "MESSAGE_TOO_LONG"
  | "FORBIDDEN"
  | "CHANNEL_NOT_FOUND"
  | "CHANNEL_NOT_TEXT"
  | "INVALID_CURSOR"
  | "MESSAGE_NOT_FOUND"
  | "MESSAGE_DELETE_DENIED"
  | "NOT_MESSAGE_AUTHOR"
  | "MENTIONS_UNAVAILABLE"
  | "INVALID_EMOJI"
  | "TOO_MANY_REACTIONS";

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
 * `Message` y los mensajes de un DM (que tambien son `Message`) cumplen esta
 * forma por igual.
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

export function canEditMessage(
  message: Pick<Message, "user_id">,
  currentUserId: string,
  canSendMessages: boolean = true,
): boolean {
  return message.user_id === currentUserId && canSendMessages;
}

/**
 * El autor siempre puede borrar el suyo; `canManageMessages` (calculado una
 * sola vez arriba con `hasPermission(ctx, "MANAGE_MESSAGES")`) habilita
 * borrar mensajes ajenos por moderacion. No aplica a mensajes directos: ahi
 * solo existe autoria, no moderacion (ver `domain/direct-message.ts`).
 */
export function canDeleteMessage(
  message: Pick<Message, "user_id">,
  currentUserId: string,
  canManageMessages: boolean,
): boolean {
  return message.user_id === currentUserId || canManageMessages;
}

/** Actualiza el contenido y marca el mensaje como editado. */
export function editMessageContent<
  T extends { content: string; edited_at?: string | null },
>(message: T, content: string, now: string = new Date().toISOString()): T {
  return { ...message, content, edited_at: now };
}

/**
 * Reemplaza por `id` los mensajes ya presentes con su version editada (evento
 * `"message_updated"` o `changed_messages`). Los que no estan en `current` se
 * ignoran: no se cargaron, y si se cargan despues ya vienen editados. Si la
 * version nueva no trae `reactions` (`message_updated`), conserva las que
 * habia. Si no cambia nada, devuelve `current` tal cual. No muta `current`.
 */
export function applyMessageUpdates(
  current: Message[],
  updates: readonly Message[],
): Message[] {
  if (updates.length === 0) return current;
  const byId = new Map(updates.map((message) => [message.id, message]));
  let changed = false;
  const next = current.map((message) => {
    const update = byId.get(message.id);
    if (!update) return message;
    changed = true;
    return { ...update, reactions: update.reactions ?? message.reactions };
  });
  return changed ? next : current;
}

/**
 * Saca de la lista los mensajes eliminados (el mensaje eliminado no se
 * muestra: ni en el canal ni, al recargar, en el historial). Si ninguno estaba, devuelve
 * `current` tal cual para que React no vuelva a renderizar. No muta `current`.
 */
export function removeMessages<T extends { id: string }>(
  current: T[],
  deletedIds: readonly string[],
): T[] {
  if (deletedIds.length === 0) return current;
  const deleted = new Set(deletedIds);
  const remaining = current.filter((message) => !deleted.has(message.id));
  return remaining.length === current.length ? current : remaining;
}

/**
 * Aplica el evento `"changed_messages"`: las ediciones y las eliminaciones que
 * hubo mientras el cliente estaba desconectado. No muta `current`.
 */
export function applyChangedMessages(
  current: Message[],
  changes: ChangedMessagesPayload,
): Message[] {
  return removeMessages(
    applyMessageUpdates(current, changes.messages),
    changes.deleted_ids,
  );
}

/** `toggleReaction` sobre un mensaje de la lista; los demas quedan igual. No muta `messages`. */
export function toggleMessageReaction(
  messages: Message[],
  messageId: string,
  emoji: string,
): Message[] {
  return messages.map((message) =>
    message.id === messageId
      ? { ...message, reactions: toggleReaction(message.reactions, emoji) }
      : message,
  );
}

/**
 * Que evento mandar al tocar `emoji` en un mensaje: si el usuario ya habia
 * reaccionado con ese emoji, la saca (CA2); si no, la agrega.
 */
export function reactionEventFor(
  message: Pick<Message, "reactions">,
  emoji: string,
): ReactionEvent {
  const mine = message.reactions?.some(
    (reaction) => reaction.emoji === emoji && reaction.reacted_by_me,
  );
  return mine ? "remove_reaction" : "add_reaction";
}

/**
 * Deja la reaccion `emoji` de un mensaje como dice el back: con `count` en 0
 * desaparece, y un emoji nuevo va al final. Si no cambia nada, devuelve
 * `messages` tal cual. No muta `messages`.
 */
export function setMessageReaction(
  messages: Message[],
  messageId: string,
  next: MessageReaction,
): Message[] {
  let changed = false;
  const updated = messages.map((message) => {
    if (message.id !== messageId) return message;
    const reactions = message.reactions ?? [];
    const existing = reactions.find((r) => r.emoji === next.emoji);
    if (
      existing?.count === next.count &&
      existing.reacted_by_me === next.reacted_by_me
    ) {
      return message;
    }
    changed = true;
    const others = reactions.filter((r) => r.emoji !== next.emoji);
    const kept = existing
      ? reactions.map((r) => (r === existing ? next : r))
      : [...others, next];
    return {
      ...message,
      reactions: next.count > 0 ? kept : others,
    };
  });
  return changed ? updated : messages;
}

/**
 * Aplica el evento `"reaction_updated"`. El contador es el que manda el back;
 * `reacted_by_me` solo cambia si quien reacciono es `currentUserId`.
 */
export function applyReactionUpdate(
  messages: Message[],
  payload: ReactionUpdatedPayload,
  currentUserId: string | null,
): Message[] {
  const message = messages.find((m) => m.id === payload.message_id);
  if (!message) return messages;
  const previous = message.reactions?.find((r) => r.emoji === payload.emoji);
  const reactedByMe =
    payload.user_id === currentUserId
      ? payload.action === "added"
      : (previous?.reacted_by_me ?? false);
  return setMessageReaction(messages, payload.message_id, {
    emoji: payload.emoji,
    count: payload.count,
    reacted_by_me: reactedByMe,
  });
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

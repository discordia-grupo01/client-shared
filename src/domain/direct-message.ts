import type { Message, MessageAuthor } from "./message";

/**
 * Mensajes directos (`messaging`). Una conversacion es un canal para el back:
 * su historial, editar y borrar son los de `GET /v1/channels/:id/messages` y
 * los eventos del canal `channel:<id>`; lo propio de los DM es la lista
 * (`GET /v1/conversations`) y el envio (`send_dm` en la sala `user:<id>`).
 */

/**
 * Conversacion tal como la devuelve `GET /v1/conversations`. Solo trae ids: el
 * nombre y el avatar del otro se piden aparte.
 */
export interface DirectConversation {
  id: string;
  partner_id: string;
  /** El ultimo mensaje es del otro y todavia no lo marcaste como leido. */
  unread: boolean;
  /** `true` si bloqueaste al otro. Lo inverso nunca se informa. */
  blocked_by_me: boolean;
  last_message_at: string | null;
  /** `null` si el ultimo mensaje se elimino. */
  last_message: Message | null;
}

export type ListConversationsResult =
  | { ok: true; conversations: DirectConversation[] }
  | { ok: false; message: string };

/** Payload del evento `"new_dm"` de la sala personal `user:<id>`. */
export interface NewDmPayload {
  conversation_id: string;
  partner_id: string;
  message: Message;
}

/** Respuesta `ok` de `send_dm`. */
export interface SentDmPayload {
  conversation_id: string;
  message: Message;
}

/** Una conversacion lista para pintar en la lista de DMs. */
export interface ConversationSummary {
  /** `null` en un borrador: todavia no se mando ningun mensaje, asi que el back no la creo. */
  conversationId: string | null;
  partner: MessageAuthor;
  lastMessage: Message | null;
  isUnread: boolean;
  /** Yo bloquee al partner. Que el partner me bloqueo nunca se informa. */
  blockedByMe: boolean;
}

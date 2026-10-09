import type { Message } from "./message";

/**
 * Una mencion sin leer (`GET /v1/mentions`). `id` es `<messageId>:<userId>`.
 * `message` es `null` si el mensaje ya no existe.
 */
export interface UserMention {
  id: string;
  message_id: string;
  channel_id: string;
  server_id: string;
  author_id: string;
  inserted_at: string;
  message: Message | null;
}

/** Respuesta de `GET /v1/mentions`: la mas reciente primero. */
export interface MentionsResponse {
  mentions: UserMention[];
}

/** Payload del evento `"mention"` de la sala personal `user:<id>`. */
export interface MentionEventPayload {
  server_id: string;
  channel_id: string;
  message: Message;
}

export type ListMentionsResult =
  { ok: true; mentions: UserMention[] } | { ok: false; message: string };

/**
 * Menciones sin leer, por id de mensaje: asi la misma mencion que llega en
 * vivo y por `GET /v1/mentions` (por ejemplo al reconectar) cuenta una sola vez.
 */
export type UnreadMentions = Readonly<
  Record<string, { channelId: string; serverId: string }>
>;

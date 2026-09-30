/**
 * Mensajes directos (DM): conversaciones 1 a 1 fuera de cualquier servidor.
 *
 * TODO: todavia no hay servicio de DMs en el back. La forma es la que
 * esperamos que devuelva (snake_case, como `Message`); cuando exista el
 * endpoint hay que ajustarla a lo que de verdad llegue.
 *
 * No hay reacciones ni moderacion aca: en una conversacion de a dos, borrar
 * o editar es cosa exclusiva del autor (ver `canEditMessage` en
 * `domain/message.ts`, que `DmMessage` tambien puede usar).
 */

export interface Conversation {
  id: string;
  participant_ids: [string, string];
  created_at: string;
}

export interface DmMessage {
  id: string;
  conversation_id: string;
  author_id: string;
  content: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
}

/** El otro participante de la conversacion, visto desde `currentUserId`. */
export function otherParticipantId(
  conversation: Pick<Conversation, "participant_ids">,
  currentUserId: string,
): string {
  const [first, second] = conversation.participant_ids;
  return first === currentUserId ? second : first;
}

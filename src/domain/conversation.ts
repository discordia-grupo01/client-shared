export interface Conversation {
  id: string;
  participant_ids: [string, string];
  created_at: string;
}

export interface DmMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  content: string;
  inserted_at: string;
  edited_at: string | null;
}

/** El otro participante de la conversacion, visto desde `currentUserId`. */
export function otherParticipantId(
  conversation: Pick<Conversation, "participant_ids">,
  currentUserId: string,
): string {
  const [first, second] = conversation.participant_ids;
  return first === currentUserId ? second : first;
}

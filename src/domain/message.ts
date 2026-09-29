/**
 * Mensajes de un canal de texto.
 *
 * TODO: todavia no hay servicio de mensajes en el back. La forma de `Message`
 * es la que esperamos que devuelva (snake_case, como el resto de las
 * entidades que espejan la API); cuando exista el endpoint hay que ajustarla
 * a lo que de verdad llegue.
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
  author_id: string;
  content: string;
  created_at: string;
  reactions: MessageReaction[];
}

/**
 * Autor de un mensaje ya resuelto para pintarlo. Lo arma el front cruzando
 * `author_id` con el perfil y los roles del miembro, por eso va en camelCase.
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
 * `true` si `message` abre un grupo nuevo (lleva avatar, nombre y hora):
 * es el primero, cambia el autor o paso mas de la ventana de agrupado.
 */
export function startsMessageGroup(
  previous: Message | undefined,
  message: Message,
): boolean {
  if (!previous || previous.author_id !== message.author_id) return true;
  const gapMs =
    new Date(message.created_at).getTime() -
    new Date(previous.created_at).getTime();
  return gapMs > MESSAGE_GROUP_WINDOW_MINUTES * 60 * 1000;
}

/**
 * Agrega o saca la reaccion del usuario actual con `emoji`. Si el contador
 * queda en 0, la reaccion desaparece. No muta `reactions`.
 */
export function toggleReaction(
  reactions: MessageReaction[],
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

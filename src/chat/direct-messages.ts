import type {
  ConversationSummary,
  DirectConversation,
  NewDmPayload,
  SentDmPayload,
} from "../domain/direct-message";
import type { Member } from "../domain/member";
import type { MessageAuthor } from "../domain/message";
import { messageAuthorOf } from "../format/message-author";
import { displayNameOf } from "../format/profile";
import { DM_SEND_FAILED, dmErrorFor } from "../messages/direct-messages";
import { UNKNOWN_USER_NAME } from "../messages/ui";
import { validateMessageContent } from "../validation/message";
import {
  pushToChannel,
  type MessageActionResult,
  type RealtimeChannel,
} from "./channel-chat";

export type SendDmResult = MessageActionResult;

/** Autor de un usuario del que todavia no se conoce el perfil. */
export function unknownAuthor(id: string): MessageAuthor {
  return messageAuthorOf(id, UNKNOWN_USER_NAME, null);
}

/** Pone `next` primero (como devuelve el back: la mas reciente arriba) y saca su version anterior. */
export function upsertConversation(
  list: readonly DirectConversation[],
  next: DirectConversation,
): DirectConversation[] {
  return [next, ...list.filter((conversation) => conversation.id !== next.id)];
}

/**
 * Aplica un `new_dm` a la lista. Si el mensaje es del otro la conversacion
 * queda sin leer; el emisor nunca tiene su propia conversacion sin leer.
 */
export function applyNewDm(
  list: readonly DirectConversation[],
  payload: NewDmPayload,
  currentUserId: string | null,
): DirectConversation[] {
  const existing = list.find((c) => c.id === payload.conversation_id);
  const fromPartner = payload.message.user_id !== currentUserId;
  return upsertConversation(list, {
    id: payload.conversation_id,
    partner_id: payload.partner_id,
    blocked_by_me: existing?.blocked_by_me ?? false,
    unread: fromPartner ? true : (existing?.unread ?? false),
    last_message_at: payload.message.inserted_at,
    last_message: payload.message,
  });
}

/**
 * Identifica "esta conversacion, leida hasta este mensaje". Un mensaje nuevo
 * cambia la clave, asi que vuelve a quedar sin leer.
 */
export function conversationReadKey(
  conversationId: string,
  lastMessageId: string | undefined,
): string {
  return `${conversationId}:${lastMessageId ?? ""}`;
}

/**
 * Aplica las lecturas hechas en esta sesion (`readKeys`) sobre los resumenes,
 * sin esperar a volver a pedir la lista.
 */
export function withLocalReads(
  summaries: readonly ConversationSummary[],
  readKeys: ReadonlySet<string>,
): ConversationSummary[] {
  return summaries.map((summary) =>
    summary.isUnread &&
    summary.conversationId &&
    readKeys.has(
      conversationReadKey(summary.conversationId, summary.lastMessage?.id),
    )
      ? { ...summary, isUnread: false }
      : summary,
  );
}

/** Ids de los otros participantes cuyo perfil falta pedir (una sola vez por id). */
export function partnerIdsMissingProfile(
  list: readonly DirectConversation[],
  known: Readonly<Record<string, MessageAuthor>>,
  requested: ReadonlySet<string>,
): string[] {
  return [
    ...new Set(
      list
        .map((conversation) => conversation.partner_id)
        .filter((id) => !known[id] && !requested.has(id)),
    ),
  ];
}

/**
 * Las conversaciones listas para pintar. `blockedIds` son los bloqueos del
 * usuario (los mismos que usa el perfil), la fuente unica de "bloqueado".
 */
export function conversationSummaries(
  list: readonly DirectConversation[],
  partners: Readonly<Record<string, MessageAuthor>>,
  blockedIds: ReadonlySet<string>,
): ConversationSummary[] {
  return list.map((conversation) => ({
    conversationId: conversation.id,
    partner:
      partners[conversation.partner_id] ??
      unknownAuthor(conversation.partner_id),
    lastMessage: conversation.last_message,
    isUnread: conversation.unread,
    blockedByMe: blockedIds.has(conversation.partner_id),
  }));
}

/**
 * La conversacion abierta con `partnerId`. Si nunca hablaron no existe todavia
 * en el back: es un borrador que se convierte en conversacion con el primer
 * mensaje.
 */
export function activeConversationSummary(
  partnerId: string,
  summaries: readonly ConversationSummary[],
  partners: Readonly<Record<string, MessageAuthor>>,
  blockedIds: ReadonlySet<string>,
): ConversationSummary {
  return (
    summaries.find((summary) => summary.partner.id === partnerId) ?? {
      conversationId: null,
      partner: partners[partnerId] ?? unknownAuthor(partnerId),
      lastMessage: null,
      isUnread: false,
      blockedByMe: blockedIds.has(partnerId),
    }
  );
}

/**
 * A quien se le puede escribir: los miembros de los servidores del usuario,
 * sin repetir y sin el propio usuario, por nombre. `messaging` no tiene
 * buscador de usuarios, asi que los candidatos salen de los servidores
 * compartidos. `avatarUrlOf` lo resuelve cada app.
 */
export function dmCandidatesFrom(
  members: readonly Member[],
  currentUserId: string | null,
  avatarUrlOf: (member: Member) => string | null,
): MessageAuthor[] {
  const byId = new Map<string, Member>();
  for (const member of members) {
    if (member.user_id !== currentUserId && !byId.has(member.user_id)) {
      byId.set(member.user_id, member);
    }
  }
  return [...byId.values()]
    .map((member) =>
      messageAuthorOf(
        member.user_id,
        displayNameOf(member.profile),
        avatarUrlOf(member),
      ),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Lo que el hook de cada app hace con lo que pasa en la sala personal `user:<id>`. */
export interface UserChannelHandlers {
  newDm: (payload: NewDmPayload) => void;
  /** Corte de conexion o sala caida: Phoenix re-une solo. */
  connectionLost: () => void;
  /** La sala quedo unida. `isFirstJoin` es `false` al re-unirse tras un corte. */
  joined: (isFirstJoin: boolean) => void;
}

/** Engancha los eventos de la sala personal y la une. */
export function joinUserChannel(
  room: RealtimeChannel,
  handlers: UserChannelHandlers,
): void {
  room.on("new_dm", (payload: NewDmPayload) => handlers.newDm(payload));
  room.onError(() => handlers.connectionLost());
  room.onClose(() => handlers.connectionLost());

  let isFirstJoin = true;
  room.join().receive("ok", () => {
    handlers.joined(isFirstJoin);
    isFirstJoin = false;
  });
}

export function sendDirectMessage(
  room: RealtimeChannel | null,
  isJoined: boolean,
  to: string,
  content: string,
  onSent: (sent: SentDmPayload) => void,
): Promise<SendDmResult> {
  const invalid = validateMessageContent(content);
  if (invalid) return Promise.resolve({ ok: false, message: invalid });
  return pushToChannel(
    room,
    isJoined,
    "send_dm",
    { to, content },
    {
      failedMessage: DM_SEND_FAILED,
      errorMessageFor: dmErrorFor,
      onOk: (response) => {
        if (response) onSent(response as SentDmPayload);
      },
    },
  );
}

import type {
  ConversationSummary,
  DirectConversation,
  NewDmPayload,
  SentDmPayload,
} from "../domain/direct-message";
import type { Member } from "../domain/member";
import type { MentionEventPayload } from "../domain/mention";
import type { MessageAuthor } from "../domain/message";
import { messageAuthorOf } from "../format/message-author";
import { displayNameOf } from "../format/profile";
import { DM_SEND_FAILED, dmErrorFor } from "../messages/direct-messages";
import { UNKNOWN_USER_NAME } from "../messages/ui";
import { validateMessageContent } from "../validation/message";
import {
  pushToChannel,
  withAttachmentIds,
  withClientId,
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
  // Un evento repetido o que llega tarde (ya se vio uno mas nuevo) no pisa el
  // estado: no puede volver a dejar sin leer lo que ya se leyo.
  if (
    existing?.last_message &&
    !isNewerMessage(payload.message, existing.last_message)
  ) {
    return [...list];
  }
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

function timeOf(conversation: DirectConversation): number {
  const at =
    conversation.last_message?.inserted_at ?? conversation.last_message_at;
  return Date.parse(at ?? "") || 0;
}

function isNewerMessage(
  candidate: { id: string; inserted_at: string },
  current: { id: string; inserted_at: string },
): boolean {
  if (candidate.id === current.id) return false;
  return Date.parse(candidate.inserted_at) >= Date.parse(current.inserted_at);
}

/**
 * Junta la lista que devolvio el back con lo que ya se sabe localmente. La
 * lista pudo pedirse antes de que llegaran mensajes por el socket o de que se
 * leyera una conversacion, asi que no debe pisarlos:
 * - si lo local tiene un mensaje mas nuevo, se queda lo local;
 * - si es el mismo ultimo mensaje, esta sin leer solo si ambos lo dicen;
 * - lo que solo existe localmente (recien creado al enviar) se conserva.
 */
export function mergeConversations(
  local: readonly DirectConversation[],
  remote: readonly DirectConversation[],
): DirectConversation[] {
  const localById = new Map(local.map((c) => [c.id, c]));
  const merged = remote.map((incoming) => {
    const mine = localById.get(incoming.id);
    if (!mine?.last_message || !incoming.last_message) return incoming;
    if (isNewerMessage(mine.last_message, incoming.last_message)) return mine;
    if (mine.last_message.id === incoming.last_message.id) {
      return { ...incoming, unread: mine.unread && incoming.unread };
    }
    return incoming;
  });
  const remoteIds = new Set(remote.map((c) => c.id));
  const onlyLocal = local.filter((c) => !remoteIds.has(c.id));
  return [...merged, ...onlyLocal].sort((a, b) => timeOf(b) - timeOf(a));
}

/**
 * Deja `conversationId` leida en la lista, una vez que el back confirmo la
 * lectura. Si mientras tanto llego otro mensaje (`lastMessageId` ya no es el
 * ultimo) sigue sin leer: esa lectura no lo cubria.
 */
export function markConversationReadIn(
  list: readonly DirectConversation[],
  conversationId: string,
  lastMessageId: string | undefined,
): DirectConversation[] {
  return list.map((conversation) =>
    conversation.id === conversationId &&
    conversation.last_message?.id === lastMessageId
      ? { ...conversation, unread: false }
      : conversation,
  );
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

/** La conversacion que se esta mirando no se marca sin leer: se lee al llegar. */
export function withActiveRead(
  summaries: readonly ConversationSummary[],
  activePartnerId: string | null,
): ConversationSummary[] {
  return summaries.map((summary) =>
    summary.isUnread && summary.partner.id === activePartnerId
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
 * Suma a la lista los borradores: contactos con los que se abrio el chat pero
 * todavia no hay mensajes (en el back no existe la conversacion). Van arriba y
 * dejan de ser borrador cuando aparece la conversacion real.
 */
export function withDraftConversations(
  summaries: readonly ConversationSummary[],
  draftPartnerIds: readonly string[],
  partners: Readonly<Record<string, MessageAuthor>>,
  blockedIds: ReadonlySet<string>,
): ConversationSummary[] {
  const withConversation = new Set(summaries.map((s) => s.partner.id));
  const drafts = draftPartnerIds
    .filter((id) => !withConversation.has(id))
    .map((id) => activeConversationSummary(id, [], partners, blockedIds));
  return [...drafts, ...summaries];
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

export interface UserRoomCallbacks {
  /** Alguien te menciono en un canal. */
  onMention?: (payload: MentionEventPayload) => void;
  /** La sala se volvio a unir tras un corte: conviene recargar lo que se pudo perder. */
  onRejoined?: () => void;
}

/** Lo que el hook de cada app hace con lo que pasa en la sala personal `user:<id>`. */
export interface UserChannelHandlers {
  newDm: (payload: NewDmPayload) => void;
  /** Alguien te menciono en un canal (`mention`); es opcional porque no todos los hooks lo usan. */
  mention?: (payload: MentionEventPayload) => void;
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
  room.on("mention", (payload: MentionEventPayload) =>
    handlers.mention?.(payload),
  );
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
  attachmentIds: readonly string[] = [],
  clientId?: string,
): Promise<SendDmResult> {
  const invalid = validateMessageContent(content, attachmentIds.length > 0);
  if (invalid) return Promise.resolve({ ok: false, message: invalid });
  return pushToChannel(
    room,
    isJoined,
    "send_dm",
    withClientId(withAttachmentIds({ to, content }, attachmentIds), clientId),
    {
      failedMessage: DM_SEND_FAILED,
      errorMessageFor: dmErrorFor,
      onOk: (response) => {
        if (response) onSent(response as SentDmPayload);
      },
    },
  );
}

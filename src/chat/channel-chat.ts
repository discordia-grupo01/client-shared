import type {
  AccessRevokedPayload,
  AccessRevokedReason,
  ChangedMessagesPayload,
  ListMessagesResult,
  Message,
  MessageDeletedPayload,
  MessageErrorCode,
  MessageReaction,
  MessageUpdatedPayload,
  MissedMessagesPayload,
  ReactionEvent,
  ReactionUpdatedPayload,
} from "../domain/message";
import {
  applyChangedMessages,
  applyMessageUpdates,
  applyReactionUpdate,
  mergeMessages,
  removeMessages,
} from "../domain/message";
import {
  ACCESS_REVOKED_MESSAGES,
  bannedWordMessage,
  isMessageErrorCode,
  messageErrorFor,
  REACTION_FAILED,
  REACTION_FORBIDDEN,
} from "../messages/chat";

export type ChatStatus =
  | "loading"
  | "ready"
  | "reconnecting"
  | "offline"
  | "forbidden"
  | "notFound"
  | "sessionExpired"
  | "error";

/** Cuanto se espera antes de mostrar "Reconectando…", para no parpadear en cortes de un instante. */
export const CONNECTION_NOTICE_DELAY_MS = 1_500;

/**
 * `retryable` solo vale en un fallo: `true` si repetir el pedido puede salir
 * bien (sin conexion, timeout, back caido) y `false` si el back lo rechazo a
 * proposito (sin permiso, palabra prohibida).
 */
export type MessageActionResult =
  { ok: true } | { ok: false; message: string; retryable?: boolean };
export type SendMessageResult = MessageActionResult;
export type DeleteMessageResult = MessageActionResult;
export type EditMessageResult = MessageActionResult;
export type ReactionResult = MessageActionResult;

/** Lo que `useChannelMessages` le entrega a la pantalla del chat (web y mobile). */
export interface ChannelMessages {
  status: ChatStatus;
  /** Texto para mostrar cuando `status` no es `ready`/`loading`/`reconnecting`/`offline`. */
  statusMessage: string | null;
  /** `null` mientras carga el historial. De mas viejo a mas nuevo. */
  messages: Message[] | null;
  hasMore: boolean;
  isLoadingOlder: boolean;
  loadOlder: () => Promise<void>;
  hasNewer: boolean;
  isLoadingNewer: boolean;
  loadNewer: () => Promise<void>;
  jumpToMessage: (messageId: string) => Promise<MessageActionResult>;
  jumpToPresent: () => void;
  focusedMessage: FocusedMessage | null;
  retry: () => void;
  sendMessage: (
    content: string,
    attachmentIds?: readonly string[],
  ) => Promise<SendMessageResult>;
  deleteMessage: (messageId: string) => Promise<DeleteMessageResult>;
  editMessage: (
    messageId: string,
    content: string,
  ) => Promise<EditMessageResult>;
  toggleReaction: (messageId: string, emoji: string) => Promise<ReactionResult>;
}

export interface FocusedMessage {
  id: string;
  nonce: number;
}

/** Cuanto dura el resaltado del mensaje al que se salto. */
export const FOCUSED_MESSAGE_HIGHLIGHT_MS = 2_500;

/** Estados de los que no se sale solo: no se pisan con un corte de conexion. */
const TERMINAL_CHAT_STATUSES: ReadonlySet<ChatStatus> = new Set([
  "forbidden",
  "notFound",
  "sessionExpired",
]);

/**
 * Un corte de conexion pasa a "reconectando" salvo que el estado ya sea
 * terminal o que ya se haya dado por perdida la conexion ("offline").
 */
export function chatStatusAfterConnectionLoss(
  previous: ChatStatus,
): ChatStatus {
  return TERMINAL_CHAT_STATUSES.has(previous) || previous === "offline"
    ? previous
    : "reconnecting";
}

/**
 * Estado del chat cuando el back cierra la sala (`access_revoked`): si dejaste
 * de ser miembro o te sacaron el permiso de ver el canal es "sin acceso"; si
 * el canal o su servidor se borraron, "no existe".
 */
export function chatStateForAccessRevoked(
  reason: AccessRevokedPayload["reason"],
): { status: "forbidden" | "notFound"; message: string } {
  const message =
    ACCESS_REVOKED_MESSAGES[reason] ?? ACCESS_REVOKED_MESSAGES.member_left;
  return {
    status:
      reason === "channel_deleted" || reason === "server_deleted"
        ? "notFound"
        : "forbidden",
    message,
  };
}

/** Un canal recien creado puede no estar todavia en la cache de messaging (llega por un evento). */
export const NOT_FOUND_ATTEMPTS = 3;

/** Estado del chat cuando falla la PRIMERA carga del historial. */
export function chatStatusForLoadError(code?: MessageErrorCode): ChatStatus {
  if (code === "FORBIDDEN") return "forbidden";
  if (code === "CHANNEL_NOT_FOUND" || code === "CHANNEL_NOT_TEXT") {
    return "notFound";
  }
  return "error";
}

/**
 * Trae por REST lo posterior a `afterId` hasta que el back diga que no hay
 * mas. Corta si `isCancelled()` o si una pagina falla.
 */
export async function catchUpMessages(
  fetchAfter: (cursor: string) => Promise<ListMessagesResult>,
  afterId: string,
  onPage: (messages: Message[]) => void,
  isCancelled: () => boolean,
): Promise<void> {
  let cursor: string | null = afterId;
  while (cursor) {
    const result = await fetchAfter(cursor);
    if (isCancelled() || !result.ok) return;
    onPage(result.messages);
    cursor = result.nextCursor;
  }
}

/** Lo minimo que se usa de un `Push` de Phoenix. */
export interface RealtimePush {
  receive(status: string, callback: (response?: unknown) => void): RealtimePush;
}

/**
 * Lo minimo que se usa de un `Channel` de Phoenix. El payload es `any` como en
 * los tipos de Phoenix: con `unknown` o `never` un `Channel` real no encaja.
 */
export interface RealtimeChannel {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: string, callback: (payload: any) => void): unknown;
  onError(callback: () => void): unknown;
  onClose(callback: () => void): unknown;
  join(): RealtimePush;
  leave(): unknown;
  push(event: string, payload: object): RealtimePush;
}

function errorCodeOf(response: unknown): unknown {
  return (response as { error?: { code?: unknown } } | undefined)?.error?.code;
}

function bannedWordsOf(response: unknown): string[] {
  const words = (
    response as { error?: { details?: { words?: unknown } } } | undefined
  )?.error?.details?.words;
  return Array.isArray(words)
    ? words.filter((word): word is string => typeof word === "string")
    : [];
}

/** Parametros del `join`: Phoenix manda el mismo objeto en cada re-join, asi que se muta. */
export interface MessageChannelJoinParams {
  last_message_id?: string;
  changes_since?: string;
}

/** Lo que el hook de cada app hace con lo que pasa en el canal. */
export interface MessageChannelHandlers {
  /** Aplica un cambio a la lista de mensajes (el hook lo pasa a `setMessages`). */
  updateMessages: (update: (current: Message[]) => Message[]) => void;
  /** Quedaron mensajes por traer por REST despues de `missed_messages`. */
  catchUp: (afterCursor: string) => void;
  /** El cursor del join ya no sirve: hay que descartar y recargar lo ultimo. */
  resync: () => void;
  /** Corte de conexion, canal caido o `join` sin respuesta: Phoenix re-une solo. */
  connectionLost: () => void;
  /** El `join` se confirmo. `isFirstJoin` es `false` en los re-joins. */
  joined: (isFirstJoin: boolean) => void;
  /** El back rechazo el `join` a proposito (sin permiso, canal inexistente): no hay que reintentar. */
  rejected: (status: "forbidden" | "notFound", message: string) => void;
  /**
   * El back cerro la sala porque perdiste el acceso (te fuiste o te sacaron del
   * servidor, se borro el canal o te sacaron el permiso de verlo): no se
   * reconecta sola, hay que dejar de mostrar el chat como si siguiera vivo.
   * `reason` permite reaccionar distinto a cada caso: con
   * `permissions_changed` el canal tiene que desaparecer de la lista, asi que
   * conviene recargar el servidor.
   */
  accessRevoked: (
    status: "forbidden" | "notFound",
    message: string,
    reason: AccessRevokedReason,
  ) => void;
  /** Usuario actual, para saber si un `reaction_updated` cambia su `reacted_by_me`. */
  currentUserId?: string | null;
  /**
   * `true` mientras se ve un tramo del pasado (ver `ChannelMessages.hasNewer`):
   * los mensajes nuevos no se agregan porque quedarian despues de un hueco.
   */
  isViewingPast?: () => boolean;
}

/** Engancha los eventos del canal de mensajes y lo une. */
export function joinMessageChannel(
  room: RealtimeChannel,
  joinParams: MessageChannelJoinParams,
  handlers: MessageChannelHandlers,
): void {
  room.on("new_message", (message: Message) => {
    if (handlers.isViewingPast?.()) return;
    handlers.updateMessages((current) => mergeMessages(current, [message]));
  });
  room.on("missed_messages", (payload: MissedMessagesPayload) => {
    if (handlers.isViewingPast?.()) return;
    handlers.updateMessages((current) =>
      mergeMessages(current, payload.messages),
    );
    if (payload.next_cursor) handlers.catchUp(payload.next_cursor);
  });
  room.on("message_updated", (message: MessageUpdatedPayload) => {
    handlers.updateMessages((current) =>
      applyMessageUpdates(current, [message]),
    );
  });
  room.on("message_deleted", (payload: MessageDeletedPayload) => {
    handlers.updateMessages((current) => removeMessages(current, [payload.id]));
  });
  // Lo editado o eliminado mientras no estabamos conectados (ver `changes_since`).
  room.on("changed_messages", (payload: ChangedMessagesPayload) => {
    handlers.updateMessages((current) =>
      applyChangedMessages(current, payload),
    );
  });
  room.on("reaction_updated", (payload: ReactionUpdatedPayload) => {
    handlers.updateMessages((current) =>
      applyReactionUpdate(current, payload, handlers.currentUserId ?? null),
    );
  });
  room.on("resync_required", () => handlers.resync());
  room.on("access_revoked", (payload: AccessRevokedPayload) => {
    const { status, message } = chatStateForAccessRevoked(payload.reason);
    handlers.accessRevoked(status, message, payload.reason);
  });
  room.onError(() => handlers.connectionLost());

  let isFirstJoin = true;
  let notFoundCount = 0;
  room
    .join()
    .receive("ok", (response) => {
      // Desde este instante, en el proximo join el back informa lo que cambio.
      joinParams.changes_since = (
        response as { server_time?: string } | undefined
      )?.server_time;
      handlers.joined(isFirstJoin);
      isFirstJoin = false;
    })
    .receive("error", (response) => {
      const code = errorCodeOf(response);
      // Un `join` rechazado Phoenix lo reintenta para siempre (cada pocos
      // segundos, con una llamada a `servers` cada vez). Si el rechazo es
      // deliberado del back (sin permiso, canal inexistente) se corta.
      if (!isMessageErrorCode(code)) {
        handlers.connectionLost();
        return;
      }
      if (
        code === "CHANNEL_NOT_FOUND" &&
        ++notFoundCount < NOT_FOUND_ATTEMPTS
      ) {
        return;
      }
      room.leave();
      handlers.rejected(
        code === "FORBIDDEN" ? "forbidden" : "notFound",
        messageErrorFor(code),
      );
    })
    .receive("timeout", () => handlers.connectionLost());
}

export interface PushOptions {
  /** Mensaje cuando no se puede mandar, el back lo rechaza sin codigo conocido o no responde. */
  failedMessage: string;
  /** Texto de un `error.code` del back; por defecto los de `messaging` (`messageErrorFor`). */
  errorMessageFor?: (code: unknown, fallback: string) => string;
  /** El back confirmo; `response` es el payload de la respuesta. */
  onOk?: (response: unknown) => void;
  /** El mensaje ya no existe: el resultado es el que se queria, que no se vea. */
  onMessageNotFound?: () => void;
}

/**
 * Manda un evento al canal y espera la respuesta del back. Con el canal sin
 * unir Phoenix encola el push y falla a los ~10 s, por eso solo se manda si
 * `isJoined`.
 */
export function pushToChannel(
  room: RealtimeChannel | null,
  isJoined: boolean,
  event: string,
  payload: object,
  options: PushOptions,
): Promise<MessageActionResult> {
  const failed = {
    ok: false,
    message: options.failedMessage,
    retryable: true,
  } as const;
  const errorMessageFor = options.errorMessageFor ?? messageErrorFor;
  return new Promise((resolve) => {
    if (!room || !isJoined) return resolve(failed);
    room
      .push(event, payload)
      .receive("ok", (response) => {
        options.onOk?.(response);
        resolve({ ok: true });
      })
      .receive("error", (response) => {
        const code = errorCodeOf(response);
        if (code === "MESSAGE_NOT_FOUND") options.onMessageNotFound?.();
        resolve({
          ok: false,
          message:
            code === "BANNED_WORD"
              ? bannedWordMessage(bannedWordsOf(response))
              : errorMessageFor(code, options.failedMessage),
          retryable: code === undefined || code === "MESSAGES_UNAVAILABLE",
        });
      })
      .receive("timeout", () => resolve(failed));
  });
}

/** Payload de `new_message`/`send_dm`: `attachment_ids` solo viaja si hay adjuntos. */
export function withAttachmentIds<T extends object>(
  payload: T,
  attachmentIds: readonly string[] = [],
): T | (T & { attachment_ids: string[] }) {
  return attachmentIds.length > 0
    ? { ...payload, attachment_ids: [...attachmentIds] }
    : payload;
}

/** Payload de `new_message`/`send_dm`: `client_id` solo viaja en los envios que se pueden reintentar. */
export function withClientId<T extends object>(
  payload: T,
  clientId?: string,
): T | (T & { client_id: string }) {
  return clientId ? { ...payload, client_id: clientId } : payload;
}

/** `pushToChannel` sobre el canal de un chat: solo se manda con el chat `ready`. */
export function pushMessageEvent(
  room: RealtimeChannel | null,
  status: ChatStatus,
  event: string,
  payload: object,
  options: PushOptions,
): Promise<MessageActionResult> {
  return pushToChannel(room, status === "ready", event, payload, options);
}

/**
 * Manda `add_reaction`/`remove_reaction` y, si el back confirma, entrega la
 * reaccion como quedo (`onReaction`) para aplicarla con `setMessageReaction`.
 */
export function pushReaction(
  room: RealtimeChannel | null,
  status: ChatStatus,
  event: ReactionEvent,
  messageId: string,
  emoji: string,
  onReaction: (reaction: MessageReaction) => void,
): Promise<ReactionResult> {
  return pushMessageEvent(
    room,
    status,
    event,
    { message_id: messageId, emoji },
    {
      failedMessage: REACTION_FAILED,
      errorMessageFor: (code, fallback) =>
        code === "FORBIDDEN"
          ? REACTION_FORBIDDEN
          : messageErrorFor(code, fallback),
      onOk: (response) => {
        if (response) onReaction(response as MessageReaction);
      },
    },
  );
}

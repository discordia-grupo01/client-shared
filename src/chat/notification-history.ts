import type { Channel } from "../domain/channel";
import type { Message } from "../domain/message";
import type {
  NotificationGroup,
  NotificationHistoryItem,
  NotificationReadMarks,
  NotificationTab,
} from "../domain/notification-history";
import type { ServerSummary } from "../domain/server";
import {
  decodeMentions,
  ROLE_TOKEN_SOURCE,
  USER_TOKEN_SOURCE,
  type MentionKind,
} from "../format/mention-tokens";
import {
  NOTIFICATIONS_ATTACHMENT_PREVIEW,
  NOTIFICATIONS_UNKNOWN_PERSON,
  NOTIFICATIONS_UNKNOWN_ROLE_MENTION,
  NOTIFICATIONS_UNKNOWN_SERVER,
  NOTIFICATIONS_UNKNOWN_USER_MENTION,
} from "../messages/notifications";

export const NOTIFICATION_HISTORY_PAGE_SIZE = 20;
export const NOTIFICATION_PREVIEW_MAX_LENGTH = 240;
export const NOTIFICATION_ALL_READ_KEY = "*";
export const NOTIFICATION_READ_RETENTION_DAYS = 7;
export const NOTIFICATION_LOOKUP_MAX_IDS = 50;
export const NOTIFICATION_REFRESH_RETRY_DELAYS_MS: readonly number[] = [
  1_500, 1_500, 2_000, 3_000, 4_000,
];

export interface NotificationPlace {
  serverName: string | null;
  channelName: string | null;
}

type PlaceServer = Pick<ServerSummary, "id" | "name"> & {
  channels: readonly Pick<Channel, "id" | "name">[];
};

export function appendNotificationHistory(
  current: readonly NotificationHistoryItem[],
  incoming: readonly NotificationHistoryItem[],
): NotificationHistoryItem[] {
  const known = new Set(current.map((item) => item.message_id));
  return [
    ...current,
    ...incoming.filter((item) => !known.has(item.message_id)),
  ];
}

export function notificationPlace(
  item: NotificationHistoryItem,
  servers: readonly PlaceServer[],
): NotificationPlace {
  const server = servers.find((candidate) => candidate.id === item.server_id);
  const channel = server?.channels.find(
    (candidate) => candidate.id === item.channel_id,
  );

  return {
    serverName: server?.name ?? null,
    channelName: channel?.name ?? null,
  };
}

export function describeNotification(item: NotificationHistoryItem): string {
  return item.kind === "direct_message" ? "te envió un mensaje" : "te mencionó";
}

export function isTransferNotification(item: NotificationHistoryItem): boolean {
  return item.kind === "ownership_transfer";
}

export function canRespondToTransfer(
  item: NotificationHistoryItem,
  meId: string | null | undefined,
): boolean {
  return (
    isTransferNotification(item) &&
    item.transfer_status === "pending" &&
    meId != null &&
    item.to_user_id === meId
  );
}

export function notificationUserIds(item: NotificationHistoryItem): string[] {
  const ids = [item.author_id];
  if (isTransferNotification(item) && item.to_user_id)
    ids.push(item.to_user_id);
  return [...new Set(ids)];
}

export function describeTransferNotification(
  item: NotificationHistoryItem,
  meId: string | null | undefined,
  nameOf: (userId: string) => string | null,
  serverName: string | null,
): string {
  const server = serverName ?? NOTIFICATIONS_UNKNOWN_SERVER;
  const owner = nameOf(item.author_id) ?? NOTIFICATIONS_UNKNOWN_PERSON;
  const receiverId = item.to_user_id ?? null;
  const receiver =
    (receiverId !== null ? nameOf(receiverId) : null) ??
    NOTIFICATIONS_UNKNOWN_PERSON;

  if (receiverId !== null && receiverId === meId) {
    switch (item.transfer_status) {
      case "accepted":
        return `Aceptaste ser el nuevo dueño de ${server}`;
      case "rejected":
        return `Rechazaste ser el nuevo dueño de ${server}`;
      case "cancelled":
        return `${owner} canceló el ofrecimiento de ${server}`;
      case "expired":
        return `El ofrecimiento de ${server} venció`;
      default:
        return `${owner} te ofreció la propiedad de ${server}`;
    }
  }

  switch (item.transfer_status) {
    case "accepted":
      return `${receiver} aceptó ser el nuevo dueño de ${server}`;
    case "rejected":
      return `${receiver} rechazó ser el nuevo dueño de ${server}`;
    case "expired":
      return `${receiver} no respondió: el ofrecimiento de ${server} venció`;
    default:
      return `Ofreciste la propiedad de ${server} a ${receiver}`;
  }
}

export type NotificationUnreadCheck = (
  item: NotificationHistoryItem,
) => boolean;

const ALL_UNREAD: NotificationUnreadCheck = () => true;
const DAY_MS = 24 * 60 * 60 * 1000;

export function isNotificationVisible(
  item: NotificationHistoryItem,
  isUnread: NotificationUnreadCheck,
  now: number = Date.now(),
): boolean {
  if (isUnread(item)) return true;
  const cutoff = now - NOTIFICATION_READ_RETENTION_DAYS * DAY_MS;
  return Date.parse(item.occurred_at) >= cutoff;
}

export function filterNotificationHistory(
  items: readonly NotificationHistoryItem[],
  tab: NotificationTab,
  isUnread: NotificationUnreadCheck = ALL_UNREAD,
  now: number = Date.now(),
): NotificationHistoryItem[] {
  if (tab === "unread") return items.filter(isUnread);
  const visible = items.filter((item) =>
    isNotificationVisible(item, isUnread, now),
  );
  if (tab === "all") return visible;
  const kind = tab === "mentions" ? "mention" : "direct_message";
  return visible.filter((item) => item.kind === kind);
}

export function notificationGroupKey(item: NotificationHistoryItem): string {
  if (item.kind === "ownership_transfer") return `transfer:${item.message_id}`;
  return item.kind === "direct_message"
    ? `dm:${item.conversation_id ?? item.author_id}`
    : `channel:${item.channel_id ?? "unknown"}`;
}

export function groupNotificationHistory(
  items: readonly NotificationHistoryItem[],
): NotificationGroup[] {
  const groups = new Map<string, NotificationGroup>();

  for (const item of items) {
    const key = notificationGroupKey(item);
    const existing = groups.get(key);
    if (existing) {
      existing.items.push(item);
      continue;
    }
    groups.set(key, {
      key,
      kind: item.kind,
      serverId: item.server_id,
      channelId: item.channel_id,
      conversationId: item.conversation_id,
      partnerId: item.kind === "direct_message" ? item.author_id : null,
      items: [item],
    });
  }

  return [...groups.values()];
}

export function isNotificationUnread(
  item: NotificationHistoryItem,
  marks: NotificationReadMarks,
): boolean {
  const at = Date.parse(item.occurred_at);
  return [
    marks[notificationGroupKey(item)],
    marks[NOTIFICATION_ALL_READ_KEY],
  ].every((readAt) => readAt === undefined || at > Date.parse(readAt));
}

export function countUnreadNotifications(
  items: readonly NotificationHistoryItem[],
  isUnread: NotificationUnreadCheck,
): number {
  return items.filter(isUnread).length;
}

export function markNotificationGroupRead(
  marks: NotificationReadMarks,
  key: string,
  at: string,
): NotificationReadMarks {
  const current = marks[key];
  if (current !== undefined && Date.parse(current) >= Date.parse(at))
    return marks;
  return { ...marks, [key]: at };
}

export function markAllNotificationsRead(
  marks: NotificationReadMarks,
  items: readonly NotificationHistoryItem[],
  now: string,
): NotificationReadMarks {
  const at = items.reduce(
    (latest, item) =>
      Date.parse(item.occurred_at) > Date.parse(latest)
        ? item.occurred_at
        : latest,
    now,
  );
  const current = marks[NOTIFICATION_ALL_READ_KEY];
  if (current !== undefined && Date.parse(current) >= Date.parse(at))
    return marks;
  return { [NOTIFICATION_ALL_READ_KEY]: at };
}

export function notificationPreview(
  message: Pick<Message, "content" | "attachments"> | null | undefined,
  nameOf: (kind: MentionKind, id: string) => string | null,
): string | null {
  if (!message) return null;

  const { text } = decodeMentions(message.content, nameOf);
  const readable = text
    .replace(
      new RegExp(ROLE_TOKEN_SOURCE, "g"),
      NOTIFICATIONS_UNKNOWN_ROLE_MENTION,
    )
    .replace(
      new RegExp(USER_TOKEN_SOURCE, "g"),
      NOTIFICATIONS_UNKNOWN_USER_MENTION,
    )
    .replace(/\s+/g, " ")
    .trim();

  if (readable === "") {
    return message.attachments && message.attachments.length > 0
      ? NOTIFICATIONS_ATTACHMENT_PREVIEW
      : null;
  }

  return readable.length > NOTIFICATION_PREVIEW_MAX_LENGTH
    ? `${readable.slice(0, NOTIFICATION_PREVIEW_MAX_LENGTH).trimEnd()}…`
    : readable;
}

export function chunkNotificationIds(
  ids: readonly string[],
  size: number = NOTIFICATION_LOOKUP_MAX_IDS,
): string[][] {
  const chunks: string[][] = [];
  for (let start = 0; start < ids.length; start += size) {
    chunks.push(ids.slice(start, start + size));
  }
  return chunks;
}

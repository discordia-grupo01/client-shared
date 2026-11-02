export type NotificationKind = "mention" | "direct_message";

export type NotificationTab = "unread" | "all" | "mentions" | "direct_messages";

export type NotificationReadMarks = Readonly<Record<string, string>>;

export interface NotificationGroup {
  key: string;
  kind: NotificationKind;
  serverId: string | null;
  channelId: string | null;
  conversationId: string | null;
  partnerId: string | null;
  items: NotificationHistoryItem[];
}

export interface NotificationHistoryItem {
  kind: NotificationKind;
  message_id: string;
  author_id: string;
  occurred_at: string;
  server_id: string | null;
  channel_id: string | null;
  conversation_id: string | null;
}

export interface NotificationHistoryResponse {
  items: NotificationHistoryItem[];
  next_cursor: string | null;
}

export interface NotificationHistoryPage {
  items: NotificationHistoryItem[];
  nextCursor: string | null;
}

export type ListNotificationHistoryResult =
  ({ ok: true } & NotificationHistoryPage) | { ok: false; message: string };

export interface NotificationHistoryQuery {
  limit?: number;
  before?: string | null;
}

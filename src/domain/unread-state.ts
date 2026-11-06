export interface UnreadFlagsPayload {
  unread: boolean;
  mention: boolean;
  mention_count: number;
  notify: boolean;
  muted: boolean;
}

export interface UnreadChannelPayload extends UnreadFlagsPayload {
  channel_id: string;
}

export interface UnreadServerPayload extends UnreadFlagsPayload {
  server_id: string;
  channels: UnreadChannelPayload[];
}

export interface UnreadSnapshotPayload {
  servers: UnreadServerPayload[];
}

export interface UnreadUpdatedPayload extends UnreadFlagsPayload {
  server_id: string | null;
  channel_id: string;
  server: UnreadFlagsPayload;
}

export interface UnreadFlags {
  unread: boolean;
  mentionCount: number;
}

export type UnreadState = Readonly<
  Record<string, { serverId: string } & UnreadFlags>
>;

export const UNREAD_SOCKET_EVENTS = {
  snapshot: "snapshot",
  updated: "unread_updated",
  markRead: "mark_read",
  markAllRead: "mark_all_read",
} as const;

export interface MarkAllReadReply {
  channels: number;
}

export function unreadTopic(userId: string): string {
  return `notifications:${userId}`;
}

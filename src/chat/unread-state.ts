import type {
  UnreadFlags,
  UnreadSnapshotPayload,
  UnreadState,
  UnreadUpdatedPayload,
} from "../domain/unread-state";

export const NO_UNREAD: UnreadState = {};

export const NO_UNREAD_FLAGS: UnreadFlags = { unread: false, mentionCount: 0 };

export function applyUnreadSnapshot(
  snapshot: UnreadSnapshotPayload,
  openChannelId: string | null,
): UnreadState {
  const next: Record<string, UnreadState[string]> = {};
  for (const server of snapshot.servers) {
    for (const channel of server.channels) {
      if (!channel.unread || channel.channel_id === openChannelId) continue;
      next[channel.channel_id] = {
        serverId: server.server_id,
        unread: true,
        mentionCount: channel.mention_count,
      };
    }
  }
  return next;
}

export function applyUnreadUpdate(
  state: UnreadState,
  payload: UnreadUpdatedPayload,
  openChannelId: string | null,
): UnreadState {
  const id = payload.channel_id;
  const serverId = payload.server_id ?? state[id]?.serverId;
  if (!payload.unread || id === openChannelId || !serverId) {
    return markUnreadChannelRead(state, id);
  }
  const current = state[id];
  if (current?.mentionCount === payload.mention_count) return state;
  return {
    ...state,
    [id]: { serverId, unread: true, mentionCount: payload.mention_count },
  };
}

export function markUnreadChannelRead(
  state: UnreadState,
  channelId: string,
): UnreadState {
  if (!(channelId in state)) return state;
  const next = { ...state };
  delete next[channelId];
  return next;
}

export function snapshotHasUnreadChannel(
  snapshot: UnreadSnapshotPayload,
  channelId: string,
): boolean {
  return snapshot.servers.some((server) =>
    server.channels.some(
      (channel) => channel.channel_id === channelId && channel.unread,
    ),
  );
}

export function unreadFlagsByChannel(
  state: UnreadState,
): Record<string, UnreadFlags> {
  return Object.fromEntries(
    Object.entries(state).map(([id, { unread, mentionCount }]) => [
      id,
      { unread, mentionCount },
    ]),
  );
}

export function unreadFlagsByServer(
  state: UnreadState,
): Record<string, UnreadFlags> {
  const servers: Record<string, UnreadFlags> = {};
  for (const channel of Object.values(state)) {
    const current = servers[channel.serverId] ?? NO_UNREAD_FLAGS;
    servers[channel.serverId] = {
      unread: current.unread || channel.unread,
      mentionCount: current.mentionCount + channel.mentionCount,
    };
  }
  return servers;
}

export interface UnreadTracker {
  setOpenChannel: (channelId: string | null) => void;
  applySnapshot: (payload: UnreadSnapshotPayload) => void;
  applyUpdate: (payload: UnreadUpdatedPayload) => void;
}

export function createUnreadTracker(options: {
  markRead: (channelId: string) => void;
  onChange: (state: UnreadState) => void;
}): UnreadTracker {
  let state = NO_UNREAD;
  let openChannelId: string | null = null;

  function commit(next: UnreadState): void {
    if (next === state) return;
    state = next;
    options.onChange(state);
  }

  return {
    setOpenChannel: (channelId) => {
      if (channelId === openChannelId) return;
      openChannelId = channelId;
      if (!channelId) return;
      commit(markUnreadChannelRead(state, channelId));
      options.markRead(channelId);
    },
    applySnapshot: (payload) => {
      commit(applyUnreadSnapshot(payload, openChannelId));
      if (openChannelId && snapshotHasUnreadChannel(payload, openChannelId)) {
        options.markRead(openChannelId);
      }
    },
    applyUpdate: (payload) => {
      commit(applyUnreadUpdate(state, payload, openChannelId));
      if (payload.unread && payload.channel_id === openChannelId) {
        options.markRead(openChannelId);
      }
    },
  };
}

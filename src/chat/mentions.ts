import type {
  MentionEventPayload,
  UnreadMentions,
  UserMention,
} from "../domain/mention";

export const NO_UNREAD_MENTIONS: UnreadMentions = {};

export function mergeUnreadMentions(
  current: UnreadMentions,
  incoming: readonly UserMention[],
): UnreadMentions {
  const added = incoming.filter((mention) => !(mention.message_id in current));
  if (added.length === 0) return current;

  const next: Record<string, { channelId: string; serverId: string }> = {
    ...current,
  };
  for (const mention of added) {
    next[mention.message_id] = {
      channelId: mention.channel_id,
      serverId: mention.server_id,
    };
  }
  return next;
}

export function addUnreadMention(
  current: UnreadMentions,
  payload: MentionEventPayload,
): UnreadMentions {
  if (payload.message.id in current) return current;
  return {
    ...current,
    [payload.message.id]: {
      channelId: payload.channel_id,
      serverId: payload.server_id,
    },
  };
}

export function clearChannelMentions(
  current: UnreadMentions,
  channelId: string,
): UnreadMentions {
  const remaining = Object.entries(current).filter(
    ([, mention]) => mention.channelId !== channelId,
  );
  return remaining.length === Object.keys(current).length
    ? current
    : Object.fromEntries(remaining);
}

export function unreadByChannel(
  unread: UnreadMentions,
): Record<string, number> {
  return countBy(unread, (mention) => mention.channelId);
}

export function unreadByServer(unread: UnreadMentions): Record<string, number> {
  return countBy(unread, (mention) => mention.serverId);
}

function countBy(
  unread: UnreadMentions,
  keyOf: (mention: { channelId: string; serverId: string }) => string,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const mention of Object.values(unread)) {
    const key = keyOf(mention);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

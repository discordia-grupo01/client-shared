import type { UnreadMentions } from "../domain/mention";
import type {
  NotificationLevel,
  NotificationSettings,
  NotificationSettingsPatch,
  NotificationSettingsResponse,
} from "../domain/notification-settings";

export const NOTIFICATION_LEVELS: readonly NotificationLevel[] = [
  "all",
  "mentions",
  "none",
];

export const DEFAULT_NOTIFICATION_LEVEL: NotificationLevel = "mentions";

export const NO_NOTIFICATION_SETTINGS: NotificationSettings = {
  mutedServers: {},
  mutedChannels: {},
  serverLevels: {},
  channelLevels: {},
};

export function parseNotificationSettings(
  response: NotificationSettingsResponse,
): NotificationSettings {
  const mutedServers: Record<string, true> = {};
  for (const serverId of response.servers) mutedServers[serverId] = true;

  const mutedChannels: Record<string, true> = {};
  for (const channel of response.channels) {
    mutedChannels[channel.channel_id] = true;
  }

  const serverLevels: Record<string, NotificationLevel> = {};
  for (const server of response.preferences.servers) {
    serverLevels[server.server_id] = server.level;
  }

  const channelLevels: Record<string, NotificationLevel> = {};
  for (const channel of response.preferences.channels) {
    channelLevels[channel.channel_id] = channel.level;
  }

  return { mutedServers, mutedChannels, serverLevels, channelLevels };
}

export function channelHasNotifications(channel: { kind: string }): boolean {
  return channel.kind === "text";
}

export function isServerMuted(
  settings: NotificationSettings,
  serverId: string,
): boolean {
  return settings.mutedServers[serverId] === true;
}

export function isChannelMuted(
  settings: NotificationSettings,
  channelId: string,
): boolean {
  return settings.mutedChannels[channelId] === true;
}

export function isChannelSilenced(
  settings: NotificationSettings,
  serverId: string,
  channelId: string,
): boolean {
  return (
    isServerMuted(settings, serverId) || isChannelMuted(settings, channelId)
  );
}

export function serverNotificationLevel(
  settings: NotificationSettings,
  serverId: string,
): NotificationLevel | null {
  return settings.serverLevels[serverId] ?? null;
}

export function channelNotificationLevel(
  settings: NotificationSettings,
  channelId: string,
): NotificationLevel | null {
  return settings.channelLevels[channelId] ?? null;
}

export function configuredServerLevel(
  settings: NotificationSettings,
  serverId: string,
): NotificationLevel {
  return (
    serverNotificationLevel(settings, serverId) ?? DEFAULT_NOTIFICATION_LEVEL
  );
}

export function configuredChannelLevel(
  settings: NotificationSettings,
  serverId: string,
  channelId: string,
): NotificationLevel {
  return (
    channelNotificationLevel(settings, channelId) ??
    configuredServerLevel(settings, serverId)
  );
}

export function effectiveNotificationLevel(
  settings: NotificationSettings,
  serverId: string,
  channelId: string,
): NotificationLevel {
  if (isChannelSilenced(settings, serverId, channelId)) return "none";
  return configuredChannelLevel(settings, serverId, channelId);
}

export function isMentionHighlighted(
  settings: NotificationSettings,
  serverId: string,
  channelId: string,
): boolean {
  return effectiveNotificationLevel(settings, serverId, channelId) !== "none";
}

export function filterHighlightedMentions(
  unread: UnreadMentions,
  settings: NotificationSettings,
): UnreadMentions {
  const entries = Object.entries(unread);
  const kept = entries.filter(([, mention]) =>
    isMentionHighlighted(settings, mention.serverId, mention.channelId),
  );
  return kept.length === entries.length ? unread : Object.fromEntries(kept);
}

export function parseNotificationSettingsPatch(
  body: unknown,
): NotificationSettingsPatch | null {
  if (typeof body !== "object" || body === null) return null;
  const input = body as Record<string, unknown>;
  const patch: NotificationSettingsPatch = {};

  if ("muted" in input) {
    if (typeof input.muted !== "boolean") return null;
    patch.muted = input.muted;
  }
  if ("level" in input) {
    const level = input.level;
    if (level !== null && !NOTIFICATION_LEVELS.includes(level as never)) {
      return null;
    }
    patch.level = level as NotificationLevel | null;
  }

  return patch.muted === undefined && patch.level === undefined ? null : patch;
}

export function applyServerNotificationSetting(
  settings: NotificationSettings,
  serverId: string,
  patch: NotificationSettingsPatch,
): NotificationSettings {
  return {
    ...settings,
    mutedServers: patchFlag(settings.mutedServers, serverId, patch.muted),
    serverLevels: patchLevel(settings.serverLevels, serverId, patch.level),
  };
}

export function applyChannelNotificationSetting(
  settings: NotificationSettings,
  channelId: string,
  patch: NotificationSettingsPatch,
): NotificationSettings {
  return {
    ...settings,
    mutedChannels: patchFlag(settings.mutedChannels, channelId, patch.muted),
    channelLevels: patchLevel(settings.channelLevels, channelId, patch.level),
  };
}

function patchFlag(
  current: Readonly<Record<string, true>>,
  id: string,
  muted: boolean | undefined,
): Readonly<Record<string, true>> {
  if (muted === undefined) return current;
  if (muted) return { ...current, [id]: true };
  return without(current, id);
}

function patchLevel(
  current: Readonly<Record<string, NotificationLevel>>,
  id: string,
  level: NotificationLevel | null | undefined,
): Readonly<Record<string, NotificationLevel>> {
  if (level === undefined) return current;
  if (level === null) return without(current, id);
  return { ...current, [id]: level };
}

function without<T>(
  current: Readonly<Record<string, T>>,
  id: string,
): Readonly<Record<string, T>> {
  return Object.fromEntries(
    Object.entries(current).filter(([key]) => key !== id),
  );
}

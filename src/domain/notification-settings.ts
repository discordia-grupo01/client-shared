export type NotificationLevel = "all" | "mentions" | "none";

export interface NotificationSettingsResponse {
  servers: string[];
  channels: { channel_id: string; server_id: string }[];
  preferences: {
    servers: { server_id: string; level: NotificationLevel }[];
    channels: {
      channel_id: string;
      server_id: string;
      level: NotificationLevel;
    }[];
  };
}

export interface NotificationSettings {
  mutedServers: Readonly<Record<string, true>>;
  mutedChannels: Readonly<Record<string, true>>;
  serverLevels: Readonly<Record<string, NotificationLevel>>;
  channelLevels: Readonly<Record<string, NotificationLevel>>;
}

export interface NotificationSettingsPatch {
  muted?: boolean;
  level?: NotificationLevel | null;
}

export interface NotificationSettingState {
  muted: boolean;
  level: NotificationLevel | null;
}

export type ListNotificationSettingsResult =
  | ({ ok: true } & NotificationSettingsResponse)
  | { ok: false; message: string };

export type UpdateNotificationSettingsResult =
  ({ ok: true } & NotificationSettingState) | { ok: false; message: string };

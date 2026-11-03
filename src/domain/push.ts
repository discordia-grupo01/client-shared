export type PushProvider = "webpush" | "expo";

export type PushPlatform = "web" | "android" | "ios";

export interface WebPushDeviceRequest {
  provider: "webpush";
  platform: "web";
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface ExpoPushDeviceRequest {
  provider: "expo";
  platform: "android" | "ios";
  token: string;
}

export type PushDeviceRequest = WebPushDeviceRequest | ExpoPushDeviceRequest;

export interface PushDevice {
  id: string;
}

export interface PushSettings {
  enabled: boolean;
}

export interface VapidPublicKey {
  public_key: string;
}

export interface PushNotificationData {
  message_id: string;
  author_id: string;
  server_id?: string;
  channel_id?: string;
  conversation_id?: string;
  edited?: boolean;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  data: PushNotificationData;
}

export type LoadPushSettingsResult =
  ({ ok: true } & PushSettings) | { ok: false; message: string };

export type SavePushSettingsResult = LoadPushSettingsResult;

export type LoadVapidKeyResult =
  { ok: true; publicKey: string } | { ok: false; message: string };

export type RegisterPushDeviceResult =
  | ({ ok: true } & PushDevice)
  | { ok: false; message: string; limitReached?: boolean };

export type UnregisterPushDeviceResult =
  { ok: true } | { ok: false; message: string };

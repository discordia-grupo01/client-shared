import type {
  PushDeviceRequest,
  PushSettings,
  PushTarget,
  WebPushDeviceRequest,
} from "../domain/push";

export const PUSH_DEVICE_LIMIT = 10;

const EXPO_TOKEN = /^(Exponent|Expo)PushToken\[.+\]$/;

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim() !== "";

const isHttpsUrl = (value: unknown): value is string =>
  typeof value === "string" && /^https:\/\/[^\s/]+/.test(value);

const BASE64_URL_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

export function urlBase64ToBytes(value: string): Uint8Array {
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;

  for (const char of value.replace(/=+$/, "")) {
    const index = BASE64_URL_ALPHABET.indexOf(
      char === "+" ? "-" : char === "/" ? "_" : char,
    );
    if (index === -1) throw new RangeError("Invalid base64url character");
    buffer = (buffer << 6) | index;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }

  return Uint8Array.from(bytes);
}

export function webPushDeviceFromSubscription(subscription: {
  endpoint?: unknown;
  keys?: Record<string, unknown> | null;
}): WebPushDeviceRequest | null {
  const { endpoint, keys } = subscription;
  const p256dh = keys?.p256dh;
  const auth = keys?.auth;
  if (!isHttpsUrl(endpoint) || !isText(p256dh) || !isText(auth)) return null;
  return { provider: "webpush", platform: "web", endpoint, p256dh, auth };
}

export function parsePushDeviceRequest(
  body: unknown,
): PushDeviceRequest | null {
  if (typeof body !== "object" || body === null) return null;
  const input = body as Record<string, unknown>;

  if (input.provider === "webpush") {
    if (input.platform !== "web") return null;
    return webPushDeviceFromSubscription({
      endpoint: input.endpoint,
      keys: { p256dh: input.p256dh, auth: input.auth },
    });
  }

  if (input.provider === "expo") {
    const { platform, token } = input;
    if (platform !== "android" && platform !== "ios") return null;
    if (typeof token !== "string" || !EXPO_TOKEN.test(token)) return null;
    return { provider: "expo", platform, token };
  }

  return null;
}

export function parsePushSettings(body: unknown): PushSettings | null {
  if (typeof body !== "object" || body === null) return null;
  const { enabled } = body as Record<string, unknown>;
  return typeof enabled === "boolean" ? { enabled } : null;
}

export function pushNotificationTarget(data: unknown): PushTarget | null {
  if (typeof data !== "object" || data === null) return null;
  const { server_id, channel_id, author_id, conversation_id } = data as Record<
    string,
    unknown
  >;

  if (isText(server_id) && isText(channel_id)) {
    return { kind: "channel", serverId: server_id, channelId: channel_id };
  }
  if (isText(conversation_id) && isText(author_id)) {
    return { kind: "direct", partnerId: author_id };
  }
  return null;
}

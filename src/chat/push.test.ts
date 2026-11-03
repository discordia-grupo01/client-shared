import { describe, expect, it } from "vitest";

import {
  parsePushDeviceRequest,
  parsePushSettings,
  urlBase64ToBytes,
  webPushDeviceFromSubscription,
} from "./push";

const subscription = {
  endpoint: "https://fcm.googleapis.com/fcm/send/abc",
  keys: { p256dh: "BKey_-p256dh", auth: "auth_-secret" },
};

describe("urlBase64ToBytes", () => {
  it("decodes base64url without padding", () => {
    expect(Array.from(urlBase64ToBytes("AQID"))).toEqual([1, 2, 3]);
  });

  it("restores the missing padding", () => {
    expect(Array.from(urlBase64ToBytes("AQI"))).toEqual([1, 2]);
    expect(Array.from(urlBase64ToBytes("AQ"))).toEqual([1]);
  });

  it("understands the url alphabet", () => {
    expect(Array.from(urlBase64ToBytes("-_8"))).toEqual([251, 255]);
  });

  it("an empty key is an empty array", () => {
    expect(urlBase64ToBytes("")).toHaveLength(0);
  });

  it("accepts the standard alphabet and explicit padding", () => {
    expect(Array.from(urlBase64ToBytes("+/8="))).toEqual([251, 255]);
  });

  it("decodes a 65 byte public key", () => {
    const bytes = Uint8Array.from({ length: 65 }, (_, index) => index * 3);
    const encoded = Buffer.from(bytes)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    expect(Array.from(urlBase64ToBytes(encoded))).toEqual(Array.from(bytes));
  });

  it("refuses characters outside the base64 alphabets", () => {
    expect(() => urlBase64ToBytes("AQ*D")).toThrow(RangeError);
  });
});

describe("webPushDeviceFromSubscription", () => {
  it("builds the device request from a browser subscription", () => {
    expect(webPushDeviceFromSubscription(subscription)).toEqual({
      provider: "webpush",
      platform: "web",
      endpoint: subscription.endpoint,
      p256dh: "BKey_-p256dh",
      auth: "auth_-secret",
    });
  });

  it("refuses an endpoint that is not https", () => {
    expect(
      webPushDeviceFromSubscription({
        ...subscription,
        endpoint: "http://push.example.com/abc",
      }),
    ).toBeNull();
    expect(
      webPushDeviceFromSubscription({ ...subscription, endpoint: "" }),
    ).toBeNull();
    expect(
      webPushDeviceFromSubscription({ ...subscription, endpoint: 5 }),
    ).toBeNull();
  });

  it("refuses a subscription without its keys", () => {
    expect(
      webPushDeviceFromSubscription({ endpoint: subscription.endpoint }),
    ).toBeNull();
    expect(
      webPushDeviceFromSubscription({
        endpoint: subscription.endpoint,
        keys: null,
      }),
    ).toBeNull();
    expect(
      webPushDeviceFromSubscription({
        endpoint: subscription.endpoint,
        keys: { p256dh: "x" },
      }),
    ).toBeNull();
    expect(
      webPushDeviceFromSubscription({
        endpoint: subscription.endpoint,
        keys: { p256dh: "  ", auth: "y" },
      }),
    ).toBeNull();
  });
});

describe("parsePushDeviceRequest", () => {
  it("accepts a web push device", () => {
    expect(
      parsePushDeviceRequest({
        provider: "webpush",
        platform: "web",
        endpoint: subscription.endpoint,
        p256dh: "p",
        auth: "a",
      }),
    ).toEqual({
      provider: "webpush",
      platform: "web",
      endpoint: subscription.endpoint,
      p256dh: "p",
      auth: "a",
    });
  });

  it("accepts an Expo device on android and ios", () => {
    for (const platform of ["android", "ios"] as const) {
      expect(
        parsePushDeviceRequest({
          provider: "expo",
          platform,
          token: "ExponentPushToken[abc123]",
        }),
      ).toEqual({
        provider: "expo",
        platform,
        token: "ExponentPushToken[abc123]",
      });
    }
  });

  it("accepts the newer ExpoPushToken prefix", () => {
    expect(
      parsePushDeviceRequest({
        provider: "expo",
        platform: "android",
        token: "ExpoPushToken[abc]",
      }),
    ).not.toBeNull();
  });

  it("keeps only the known fields", () => {
    const parsed = parsePushDeviceRequest({
      provider: "expo",
      platform: "android",
      token: "ExponentPushToken[abc]",
      extra: "x",
    });

    expect(parsed).toEqual({
      provider: "expo",
      platform: "android",
      token: "ExponentPushToken[abc]",
    });
  });

  it("rejects a web push device on another platform", () => {
    expect(
      parsePushDeviceRequest({
        provider: "webpush",
        platform: "android",
        endpoint: subscription.endpoint,
        p256dh: "p",
        auth: "a",
      }),
    ).toBeNull();
  });

  it("rejects a web push device without https or keys", () => {
    expect(
      parsePushDeviceRequest({
        provider: "webpush",
        platform: "web",
        endpoint: "http://x.example.com",
        p256dh: "p",
        auth: "a",
      }),
    ).toBeNull();
    expect(
      parsePushDeviceRequest({
        provider: "webpush",
        platform: "web",
        endpoint: subscription.endpoint,
      }),
    ).toBeNull();
  });

  it("rejects an Expo device on the web or with a malformed token", () => {
    expect(
      parsePushDeviceRequest({
        provider: "expo",
        platform: "web",
        token: "ExponentPushToken[abc]",
      }),
    ).toBeNull();
    expect(
      parsePushDeviceRequest({
        provider: "expo",
        platform: "android",
        token: "not-a-token",
      }),
    ).toBeNull();
    expect(
      parsePushDeviceRequest({ provider: "expo", platform: "android" }),
    ).toBeNull();
  });

  it("rejects an unknown provider and anything that is not an object", () => {
    expect(
      parsePushDeviceRequest({ provider: "apns", platform: "ios" }),
    ).toBeNull();
    expect(parsePushDeviceRequest(null)).toBeNull();
    expect(parsePushDeviceRequest("webpush")).toBeNull();
    expect(parsePushDeviceRequest(undefined)).toBeNull();
  });
});

describe("parsePushSettings", () => {
  it("accepts a boolean enabled", () => {
    expect(parsePushSettings({ enabled: true })).toEqual({ enabled: true });
    expect(parsePushSettings({ enabled: false })).toEqual({ enabled: false });
  });

  it("rejects a missing or non boolean enabled", () => {
    expect(parsePushSettings({})).toBeNull();
    expect(parsePushSettings({ enabled: "yes" })).toBeNull();
    expect(parsePushSettings({ enabled: 1 })).toBeNull();
    expect(parsePushSettings(null)).toBeNull();
    expect(parsePushSettings("true")).toBeNull();
  });
});

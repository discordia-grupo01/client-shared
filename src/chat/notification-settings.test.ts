import { describe, expect, it } from "vitest";

import type { UnreadMentions } from "../domain/mention";
import type {
  NotificationSettings,
  NotificationSettingsResponse,
} from "../domain/notification-settings";
import {
  applyChannelNotificationSetting,
  applyServerNotificationSetting,
  channelNotificationLevel,
  configuredChannelLevel,
  configuredServerLevel,
  DEFAULT_NOTIFICATION_LEVEL,
  effectiveNotificationLevel,
  filterHighlightedMentions,
  isChannelMuted,
  isChannelSilenced,
  isMentionHighlighted,
  isServerMuted,
  NO_NOTIFICATION_SETTINGS,
  parseNotificationSettings,
  parseNotificationSettingsPatch,
  serverNotificationLevel,
} from "./notification-settings";

const settings = (
  overrides: Partial<NotificationSettings> = {},
): NotificationSettings => ({ ...NO_NOTIFICATION_SETTINGS, ...overrides });

describe("parseNotificationSettings", () => {
  it("turns the API listing into lookups by id", () => {
    const response: NotificationSettingsResponse = {
      servers: ["s1"],
      channels: [{ channel_id: "c1", server_id: "s2" }],
      preferences: {
        servers: [{ server_id: "s3", level: "all" }],
        channels: [{ channel_id: "c2", server_id: "s3", level: "none" }],
      },
    };

    expect(parseNotificationSettings(response)).toEqual({
      mutedServers: { s1: true },
      mutedChannels: { c1: true },
      serverLevels: { s3: "all" },
      channelLevels: { c2: "none" },
    });
  });

  it("parses an empty listing as no settings", () => {
    expect(
      parseNotificationSettings({
        servers: [],
        channels: [],
        preferences: { servers: [], channels: [] },
      }),
    ).toEqual(NO_NOTIFICATION_SETTINGS);
  });
});

describe("silenced", () => {
  it("reads the muted flags of a server and a channel", () => {
    const current = settings({
      mutedServers: { s1: true },
      mutedChannels: { c1: true },
    });

    expect(isServerMuted(current, "s1")).toBe(true);
    expect(isServerMuted(current, "s2")).toBe(false);
    expect(isChannelMuted(current, "c1")).toBe(true);
    expect(isChannelMuted(current, "c2")).toBe(false);
  });

  it("silences every channel of a muted server", () => {
    const current = settings({ mutedServers: { s1: true } });

    expect(isChannelSilenced(current, "s1", "any")).toBe(true);
    expect(isChannelSilenced(current, "s2", "any")).toBe(false);
  });
});

describe("effectiveNotificationLevel", () => {
  it("defaults to mentions", () => {
    expect(
      effectiveNotificationLevel(NO_NOTIFICATION_SETTINGS, "s1", "c1"),
    ).toBe(DEFAULT_NOTIFICATION_LEVEL);
    expect(DEFAULT_NOTIFICATION_LEVEL).toBe("mentions");
  });

  it("uses the server level when the channel has none", () => {
    const current = settings({ serverLevels: { s1: "all" } });

    expect(effectiveNotificationLevel(current, "s1", "c1")).toBe("all");
    expect(effectiveNotificationLevel(current, "s2", "c1")).toBe("mentions");
  });

  it("lets the channel level win over the server level", () => {
    const current = settings({
      serverLevels: { s1: "none" },
      channelLevels: { c1: "all" },
    });

    expect(effectiveNotificationLevel(current, "s1", "c1")).toBe("all");
    expect(effectiveNotificationLevel(current, "s1", "c2")).toBe("none");
  });

  it("always lets muting win, even over a permissive level", () => {
    const mutedChannel = settings({
      mutedChannels: { c1: true },
      channelLevels: { c1: "all" },
    });
    const mutedServer = settings({
      mutedServers: { s1: true },
      channelLevels: { c1: "all" },
    });

    expect(effectiveNotificationLevel(mutedChannel, "s1", "c1")).toBe("none");
    expect(effectiveNotificationLevel(mutedServer, "s1", "c1")).toBe("none");
  });
});

describe("configured levels", () => {
  it("a server without level uses the default", () => {
    expect(configuredServerLevel(NO_NOTIFICATION_SETTINGS, "s1")).toBe(
      "mentions",
    );
    expect(
      configuredServerLevel(settings({ serverLevels: { s1: "all" } }), "s1"),
    ).toBe("all");
  });

  it("a channel follows its own level, then the server, then the default", () => {
    const current = settings({
      serverLevels: { s1: "all" },
      channelLevels: { c1: "none" },
    });

    expect(configuredChannelLevel(current, "s1", "c1")).toBe("none");
    expect(configuredChannelLevel(current, "s1", "c2")).toBe("all");
    expect(configuredChannelLevel(current, "s2", "c2")).toBe("mentions");
  });

  it("keeps the configured level while muted", () => {
    const current = settings({
      mutedChannels: { c1: true },
      channelLevels: { c1: "all" },
    });

    expect(configuredChannelLevel(current, "s1", "c1")).toBe("all");
    expect(effectiveNotificationLevel(current, "s1", "c1")).toBe("none");
  });
});

describe("explicit levels", () => {
  it("returns null when nothing was set", () => {
    expect(serverNotificationLevel(NO_NOTIFICATION_SETTINGS, "s1")).toBeNull();
    expect(channelNotificationLevel(NO_NOTIFICATION_SETTINGS, "c1")).toBeNull();
  });

  it("returns what was set", () => {
    const current = settings({
      serverLevels: { s1: "all" },
      channelLevels: { c1: "none" },
    });

    expect(serverNotificationLevel(current, "s1")).toBe("all");
    expect(channelNotificationLevel(current, "c1")).toBe("none");
  });
});

describe("isMentionHighlighted", () => {
  it("highlights mentions except when the level is none or it is muted", () => {
    expect(isMentionHighlighted(NO_NOTIFICATION_SETTINGS, "s1", "c1")).toBe(
      true,
    );
    expect(
      isMentionHighlighted(
        settings({ channelLevels: { c1: "none" } }),
        "s1",
        "c1",
      ),
    ).toBe(false);
    expect(
      isMentionHighlighted(
        settings({ mutedServers: { s1: true } }),
        "s1",
        "c1",
      ),
    ).toBe(false);
    expect(
      isMentionHighlighted(
        settings({ serverLevels: { s1: "all" } }),
        "s1",
        "c1",
      ),
    ).toBe(true);
  });
});

describe("filterHighlightedMentions", () => {
  const unread: UnreadMentions = {
    m1: { channelId: "c1", serverId: "s1" },
    m2: { channelId: "c2", serverId: "s1" },
    m3: { channelId: "c3", serverId: "s2" },
  };

  it("returns the same object when nothing is silenced", () => {
    expect(filterHighlightedMentions(unread, NO_NOTIFICATION_SETTINGS)).toBe(
      unread,
    );
  });

  it("drops the mentions of silenced channels and servers", () => {
    const current = settings({
      mutedChannels: { c1: true },
      mutedServers: { s2: true },
    });

    expect(filterHighlightedMentions(unread, current)).toEqual({
      m2: { channelId: "c2", serverId: "s1" },
    });
  });
});

describe("applyServerNotificationSetting", () => {
  it("mutes and unmutes without touching the rest", () => {
    const muted = applyServerNotificationSetting(
      settings({ serverLevels: { s1: "all" } }),
      "s1",
      { muted: true },
    );
    expect(muted.mutedServers).toEqual({ s1: true });
    expect(muted.serverLevels).toEqual({ s1: "all" });

    const unmuted = applyServerNotificationSetting(muted, "s1", {
      muted: false,
    });
    expect(unmuted.mutedServers).toEqual({});
  });

  it("sets and clears the level", () => {
    const set = applyServerNotificationSetting(NO_NOTIFICATION_SETTINGS, "s1", {
      level: "none",
    });
    expect(set.serverLevels).toEqual({ s1: "none" });

    const cleared = applyServerNotificationSetting(set, "s1", { level: null });
    expect(cleared.serverLevels).toEqual({});
  });

  it("applies both fields of one patch", () => {
    const applied = applyServerNotificationSetting(
      NO_NOTIFICATION_SETTINGS,
      "s1",
      { muted: true, level: "all" },
    );

    expect(applied.mutedServers).toEqual({ s1: true });
    expect(applied.serverLevels).toEqual({ s1: "all" });
  });

  it("does not mutate the previous settings", () => {
    const previous = settings({ mutedServers: { s1: true } });
    applyServerNotificationSetting(previous, "s1", { muted: false });

    expect(previous.mutedServers).toEqual({ s1: true });
  });
});

describe("applyChannelNotificationSetting", () => {
  it("mutes, sets a level and clears both", () => {
    const set = applyChannelNotificationSetting(
      NO_NOTIFICATION_SETTINGS,
      "c1",
      {
        muted: true,
        level: "all",
      },
    );
    expect(set.mutedChannels).toEqual({ c1: true });
    expect(set.channelLevels).toEqual({ c1: "all" });

    const cleared = applyChannelNotificationSetting(set, "c1", {
      muted: false,
      level: null,
    });
    expect(cleared.mutedChannels).toEqual({});
    expect(cleared.channelLevels).toEqual({});
  });

  it("leaves a field alone when the patch does not mention it", () => {
    const current = settings({
      mutedChannels: { c1: true },
      channelLevels: { c1: "none" },
    });

    expect(
      applyChannelNotificationSetting(current, "c1", { level: "all" })
        .mutedChannels,
    ).toEqual({ c1: true });
    expect(
      applyChannelNotificationSetting(current, "c1", { muted: false })
        .channelLevels,
    ).toEqual({ c1: "none" });
  });
});

describe("parseNotificationSettingsPatch", () => {
  it("accepts muted, level or both", () => {
    expect(parseNotificationSettingsPatch({ muted: true })).toEqual({
      muted: true,
    });
    expect(parseNotificationSettingsPatch({ level: "all" })).toEqual({
      level: "all",
    });
    expect(
      parseNotificationSettingsPatch({ muted: false, level: "none" }),
    ).toEqual({ muted: false, level: "none" });
  });

  it("accepts a null level to inherit again", () => {
    expect(parseNotificationSettingsPatch({ level: null })).toEqual({
      level: null,
    });
  });

  it("rejects an empty body and anything that is not an object", () => {
    expect(parseNotificationSettingsPatch({})).toBeNull();
    expect(parseNotificationSettingsPatch(null)).toBeNull();
    expect(parseNotificationSettingsPatch("muted")).toBeNull();
    expect(parseNotificationSettingsPatch(undefined)).toBeNull();
  });

  it("rejects a muted that is not a boolean", () => {
    expect(parseNotificationSettingsPatch({ muted: "yes" })).toBeNull();
    expect(parseNotificationSettingsPatch({ muted: 1 })).toBeNull();
  });

  it("rejects a level outside all, mentions and none", () => {
    expect(parseNotificationSettingsPatch({ level: "loud" })).toBeNull();
    expect(parseNotificationSettingsPatch({ level: 1 })).toBeNull();
    expect(
      parseNotificationSettingsPatch({ muted: true, level: "loud" }),
    ).toBeNull();
  });

  it("ignores unknown fields", () => {
    expect(parseNotificationSettingsPatch({ muted: true, other: 1 })).toEqual({
      muted: true,
    });
  });
});

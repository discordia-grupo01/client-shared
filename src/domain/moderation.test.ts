import { describe, expect, it } from "vitest";

import { isMemberMuted, MUTE_DURATIONS, muteUntilFrom } from "./moderation";

const NOW = new Date("2026-10-12T15:00:00.000Z");

describe("muteUntilFrom", () => {
  it("suma la duracion a ahora, en ISO UTC", () => {
    const hour = MUTE_DURATIONS.find((d) => d.id === "1h")!;
    expect(muteUntilFrom(hour, NOW)).toBe("2026-10-12T16:00:00.000Z");
  });

  it("las duraciones van de menor a mayor", () => {
    const ms = MUTE_DURATIONS.map((d) => d.ms);
    expect(ms).toEqual([...ms].sort((a, b) => a - b));
  });
});

describe("isMemberMuted", () => {
  it("solo cuenta un silencio que todavia no vencio", () => {
    expect(isMemberMuted({ muted_until: "2026-10-12T16:00:00Z" }, NOW)).toBe(
      true,
    );
    expect(isMemberMuted({ muted_until: "2026-10-12T14:00:00Z" }, NOW)).toBe(
      false,
    );
    expect(isMemberMuted({ muted_until: null }, NOW)).toBe(false);
    expect(isMemberMuted({}, NOW)).toBe(false);
  });
});

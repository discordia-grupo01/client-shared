import { describe, expect, it } from "vitest";

import type { VoiceParticipant } from "./voice";
import {
  isScreenShareIdentity,
  mergeScreenShareCompanions,
  ownerOfScreenShareIdentity,
  screenShareIdentityOf,
} from "./voice-screen-share";

const participant = (
  identity: string,
  overrides: Partial<VoiceParticipant> = {},
): VoiceParticipant => ({
  identity,
  name: identity,
  isLocal: false,
  muted: false,
  speaking: false,
  cameraOn: false,
  screenSharing: false,
  mutedForMe: false,
  ...overrides,
});

describe("screenShareIdentityOf", () => {
  it("arma la identidad del acompañante", () => {
    expect(screenShareIdentityOf("u-ana")).toBe("u-ana:screen");
  });
});

describe("ownerOfScreenShareIdentity", () => {
  it("devuelve el dueño de un acompañante", () => {
    expect(ownerOfScreenShareIdentity("u-ana:screen")).toBe("u-ana");
  });

  it("es null para una persona", () => {
    expect(ownerOfScreenShareIdentity("u-ana")).toBeNull();
  });

  it("es null si no hay dueño antes del sufijo", () => {
    expect(ownerOfScreenShareIdentity(":screen")).toBeNull();
  });
});

describe("isScreenShareIdentity", () => {
  it("distingue acompañantes de personas", () => {
    expect(isScreenShareIdentity("u-ana:screen")).toBe(true);
    expect(isScreenShareIdentity("u-ana")).toBe(false);
  });
});

describe("mergeScreenShareCompanions", () => {
  it("marca al dueño como compartiendo y saca al acompañante", () => {
    const merged = mergeScreenShareCompanions([
      participant("yo", { isLocal: true }),
      participant("u-ana"),
      participant("u-ana:screen", { screenSharing: true }),
    ]);

    expect(merged.map(({ identity }) => identity)).toEqual(["yo", "u-ana"]);
    expect(merged[1]?.screenSharing).toBe(true);
  });

  it("no marca al dueño si el acompañante todavia no publico la pantalla", () => {
    const merged = mergeScreenShareCompanions([
      participant("u-ana"),
      participant("u-ana:screen"),
    ]);

    expect(merged).toEqual([participant("u-ana")]);
  });

  it("descarta un acompañante cuyo dueño ya no esta", () => {
    expect(
      mergeScreenShareCompanions([
        participant("yo", { isLocal: true }),
        participant("u-ana:screen", { screenSharing: true }),
      ]),
    ).toEqual([participant("yo", { isLocal: true })]);
  });

  it("deja igual la lista sin acompañantes", () => {
    const participants = [participant("yo"), participant("u-ana")];
    expect(mergeScreenShareCompanions(participants)).toEqual(participants);
  });
});

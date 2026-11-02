import { describe, expect, it } from "vitest";

import type { VoiceParticipant } from "./voice";
import {
  isScreenShareIdentity,
  mergeScreenShareCompanions,
  ownerOfScreenShareIdentity,
  screenShareIdentityOf,
  voiceParticipantRows,
  voiceTilesOf,
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

describe("voiceTilesOf", () => {
  it("separa a quien comparte en su tile y el de su pantalla", () => {
    const tiles = voiceTilesOf([
      participant("yo", { isLocal: true, cameraOn: true, screenSharing: true }),
      participant("u-ana"),
    ]);

    expect(tiles).toEqual([
      participant("yo", { isLocal: true, cameraOn: true }),
      participant("yo:screen", {
        name: "yo",
        isLocal: true,
        screenSharing: true,
      }),
      participant("u-ana"),
    ]);
  });

  it("el tile de pantalla no repite microfono, habla ni silencio para mi", () => {
    const [, screenTile] = voiceTilesOf([
      participant("u-ana", {
        muted: true,
        speaking: true,
        mutedForMe: true,
        screenSharing: true,
      }),
    ]);

    expect(screenTile).toMatchObject({
      identity: "u-ana:screen",
      muted: false,
      speaking: false,
      mutedForMe: false,
    });
  });

  it("sin nadie compartiendo deja la lista igual", () => {
    const participants = [participant("yo"), participant("u-ana")];
    expect(voiceTilesOf(participants)).toEqual(participants);
  });
});

describe("voiceParticipantRows", () => {
  it("pone la pantalla de cada persona debajo de ella", () => {
    const rows = voiceParticipantRows([
      participant("u-ana", { screenSharing: true }),
      participant("u-beto"),
    ]);

    expect(rows.map(({ identity }) => identity)).toEqual([
      "u-ana",
      "u-ana:screen",
      "u-beto",
    ]);
  });

  it("no lista tu propia pantalla", () => {
    const me = participant("yo", { isLocal: true, screenSharing: true });
    expect(voiceParticipantRows([me])).toEqual([me]);
  });
});

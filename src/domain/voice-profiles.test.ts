import { describe, expect, it } from "vitest";

import type { VoiceParticipant } from "./voice";
import type { VoiceParticipantProfile } from "./voice-bridge";
import { voiceAvatarOf, voiceProfileIds } from "./voice-profiles";

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

const present = (...ids: string[]) =>
  ids.map((id) => ({ participant_id: id, name: id }));

describe("voiceProfileIds", () => {
  it("junta los de todos los canales y los de la llamada en vivo", () => {
    const presence = {
      "ch-1": present("u-ana", "u-beto"),
      "ch-2": present("u-caro"),
    };

    expect(voiceProfileIds(presence, [participant("u-dani")], "u-yo")).toEqual([
      "u-ana",
      "u-beto",
      "u-caro",
      "u-dani",
    ]);
  });

  it("no repite a quien aparece en la presencia y en vivo", () => {
    const presence = { "ch-1": present("u-ana") };

    expect(voiceProfileIds(presence, [participant("u-ana")], null)).toEqual([
      "u-ana",
    ]);
  });

  it("cuenta la pantalla compartida como su dueño", () => {
    expect(
      voiceProfileIds(
        { "ch-1": present("u-beto:screen") },
        [participant("u-ana"), participant("u-ana:screen")],
        null,
      ),
    ).toEqual(["u-beto", "u-ana"]);
  });

  it("saca el propio, tambien su pantalla compartida", () => {
    expect(
      voiceProfileIds(
        { "ch-1": present("u-yo", "u-ana") },
        [participant("u-yo", { isLocal: true }), participant("u-yo:screen")],
        "u-yo",
      ),
    ).toEqual(["u-ana"]);
  });

  it("sin nadie en voz no hay nada que pedir", () => {
    expect(voiceProfileIds({}, [], "u-yo")).toEqual([]);
  });
});

describe("voiceAvatarOf", () => {
  const profiles: VoiceParticipantProfile[] = [
    { identity: "u-ana", name: "Ana", avatarUrl: "https://cdn/ana.png?v=1" },
    { identity: "u-beto", name: "Beto", avatarUrl: null },
  ];

  it("devuelve la foto de la persona", () => {
    expect(voiceAvatarOf(profiles, "u-ana")).toBe("https://cdn/ana.png?v=1");
  });

  it("el tile de pantalla compartida usa la foto del dueño", () => {
    expect(voiceAvatarOf(profiles, "u-ana:screen")).toBe(
      "https://cdn/ana.png?v=1",
    );
  });

  it("es null si la persona no tiene foto", () => {
    expect(voiceAvatarOf(profiles, "u-beto")).toBeNull();
  });

  it("es null si todavia no se conoce el perfil", () => {
    expect(voiceAvatarOf(profiles, "u-caro")).toBeNull();
  });
});

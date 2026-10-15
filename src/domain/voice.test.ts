import { describe, expect, it } from "vitest";

import {
  pinOnScreenShareChange,
  presenceByChannel,
  screenSharerOf,
  sortVoiceParticipants,
  toVoicePresence,
  voiceErrorCodeOf,
  voiceSidebarPreview,
  withLivePresence,
  type VoiceParticipant,
} from "./voice";

const ana = { participant_id: "u-ana", name: "Ana" };
const beto = { participant_id: "u-beto", name: "beto" };
const carla = { participant_id: "u-carla", name: "Carla" };

describe("presenceByChannel", () => {
  it("arma un mapa por canal con cada lista ordenada por nombre", () => {
    const byChannel = presenceByChannel({
      server_id: "s1",
      channels: [
        { channel_id: "general", participants: [carla, ana] },
        { channel_id: "juegos", participants: [beto] },
      ],
    });

    expect(byChannel).toEqual({ general: [ana, carla], juegos: [beto] });
  });

  it("ordena sin distinguir mayusculas", () => {
    const byChannel = presenceByChannel({
      server_id: "s1",
      channels: [{ channel_id: "general", participants: [carla, beto, ana] }],
    });

    expect(byChannel.general?.map((p) => p.name)).toEqual([
      "Ana",
      "beto",
      "Carla",
    ]);
  });

  it("no incluye canales sin participantes", () => {
    const byChannel = presenceByChannel({
      server_id: "s1",
      channels: [{ channel_id: "vacio", participants: [] }],
    });

    expect(byChannel).toEqual({});
  });
});

describe("withLivePresence", () => {
  it("reemplaza el canal propio con lo que se ve en vivo", () => {
    const result = withLivePresence({ general: [ana] }, "general", [ana, beto]);

    expect(result.general).toEqual([ana, beto]);
  });

  it("saca de los otros canales a quien ya esta en vivo en el propio", () => {
    const polled = { general: [ana, carla], juegos: [beto] };

    const result = withLivePresence(polled, "juegos", [beto, ana]);

    expect(result).toEqual({ general: [carla], juegos: [ana, beto] });
  });

  it("borra un canal que queda vacio", () => {
    const result = withLivePresence({ general: [ana] }, "juegos", [ana]);

    expect(result).toEqual({ juegos: [ana] });
  });

  it("con la sala vacia saca el canal propio", () => {
    expect(withLivePresence({ general: [ana] }, "general", [])).toEqual({});
  });

  it("no modifica el mapa original", () => {
    const polled = { general: [ana, beto] };

    withLivePresence(polled, "juegos", [ana]);

    expect(polled).toEqual({ general: [ana, beto] });
  });
});

describe("sortVoiceParticipants", () => {
  const participant = (name: string, isLocal = false): VoiceParticipant => ({
    identity: name.toLowerCase(),
    name,
    isLocal,
    muted: false,
    speaking: false,
    cameraOn: false,
    screenSharing: false,
    mutedForMe: false,
  });

  it("pone primero al participante local y despues ordena por nombre", () => {
    const sorted = sortVoiceParticipants([
      participant("Carla"),
      participant("Zoe", true),
      participant("Ana"),
    ]);

    expect(sorted.map((p) => p.name)).toEqual(["Zoe", "Ana", "Carla"]);
  });
});

describe("toVoicePresence", () => {
  it("usa la identidad de LiveKit como id de presencia", () => {
    const live: VoiceParticipant = {
      identity: "u-ana",
      name: "Ana",
      isLocal: true,
      muted: true,
      speaking: false,
      cameraOn: true,
      screenSharing: false,
      mutedForMe: false,
    };

    expect(toVoicePresence([live])).toEqual([ana]);
  });
});

describe("voiceErrorCodeOf", () => {
  it("lee el codigo de un error de signaling", () => {
    expect(voiceErrorCodeOf({ error: "voice_forbidden" })).toBe(
      "voice_forbidden",
    );
  });

  it("ignora codigos desconocidos y bodies con otra forma", () => {
    expect(voiceErrorCodeOf({ error: "algo_raro" })).toBeUndefined();
    expect(
      voiceErrorCodeOf({ error: { details: { reason: "voice_forbidden" } } }),
    ).toBeUndefined();
    expect(voiceErrorCodeOf({ message: "Unauthorized" })).toBeUndefined();
    expect(voiceErrorCodeOf(null)).toBeUndefined();
    expect(voiceErrorCodeOf("voice_forbidden")).toBeUndefined();
  });
});

describe("voiceSidebarPreview", () => {
  const people = [
    { name: "Ana", speaking: false },
    { name: "Beto", speaking: false },
    { name: "Carla", speaking: true },
    { name: "Dani", speaking: false },
  ];

  it("muestra primero a quien habla y respeta el orden del resto", () => {
    const { shown, hidden } = voiceSidebarPreview(people, 2);

    expect(shown.map((p) => p.name)).toEqual(["Carla", "Ana"]);
    expect(hidden.map((p) => p.name)).toEqual(["Beto", "Dani"]);
  });

  it("no esconde a nadie si entran todos", () => {
    const { shown, hidden } = voiceSidebarPreview(people, 5);

    expect(shown).toHaveLength(4);
    expect(hidden).toEqual([]);
  });
});

describe("screenSharerOf", () => {
  const base: VoiceParticipant = {
    identity: "u-ana",
    name: "Ana",
    isLocal: false,
    muted: false,
    speaking: false,
    cameraOn: false,
    screenSharing: false,
    mutedForMe: false,
  };

  it("devuelve a quien comparte pantalla, sin contarte a vos", () => {
    expect(
      screenSharerOf([
        { ...base, identity: "yo", isLocal: true, screenSharing: true },
        { ...base, identity: "u-beto", screenSharing: true },
      ]),
    ).toBe("u-beto");
  });

  it("devuelve null si nadie comparte", () => {
    expect(screenSharerOf([base])).toBeNull();
  });
});

describe("pinOnScreenShareChange", () => {
  it("fija a quien empieza a compartir", () => {
    expect(pinOnScreenShareChange(null, null, "u-ana")).toBe("u-ana");
    expect(pinOnScreenShareChange("u-beto", null, "u-ana")).toBe("u-ana");
  });

  it("vuelve a la grilla cuando deja de compartir quien estaba fijado", () => {
    expect(pinOnScreenShareChange("u-ana", "u-ana", null)).toBeNull();
  });

  it("respeta lo que elegiste mientras no cambie quien comparte", () => {
    expect(pinOnScreenShareChange(null, "u-ana", "u-ana")).toBeNull();
    expect(pinOnScreenShareChange("u-beto", "u-ana", null)).toBe("u-beto");
  });
});

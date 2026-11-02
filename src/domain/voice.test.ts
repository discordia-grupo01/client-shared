import { describe, expect, it } from "vitest";

import {
  callStartsByChannel,
  hasExpandableVideo,
  pinOnScreenShareChange,
  presenceByChannel,
  screenSharingIds,
  sortVoiceParticipants,
  toVoicePresence,
  voiceErrorCodeOf,
  voiceSidebarPreview,
  withCallStart,
  withLivePresence,
  type VoicePresenceEvent,
  type VoiceParticipant,
} from "./voice";

const ana = { participant_id: "u-ana", name: "Ana" };
const beto = { participant_id: "u-beto", name: "beto" };
const carla = { participant_id: "u-carla", name: "Carla" };

const START = "2026-11-01T16:00:00.123Z";
const START_MS = Date.parse(START);

describe("callStartsByChannel", () => {
  it("toma el inicio de cada canal con gente, en ms", () => {
    const starts = callStartsByChannel({
      server_id: "s1",
      channels: [
        { channel_id: "general", started_at: START, participants: [ana] },
        {
          channel_id: "juegos",
          started_at: "2026-11-01T16:05:00Z",
          participants: [beto],
        },
      ],
    });

    expect(starts).toEqual({
      general: START_MS,
      juegos: Date.parse("2026-11-01T16:05:00Z"),
    });
  });

  it("ignora canales sin inicio, con un inicio ilegible o vacios", () => {
    const starts = callStartsByChannel({
      server_id: "s1",
      channels: [
        { channel_id: "back-viejo", participants: [ana] },
        { channel_id: "nulo", started_at: null, participants: [beto] },
        { channel_id: "roto", started_at: "ayer", participants: [carla] },
        { channel_id: "vacio", started_at: START, participants: [] },
      ],
    });

    expect(starts).toEqual({});
  });
});

describe("withCallStart", () => {
  const event = (
    room_started_at: string | null | undefined,
    room_id = "general",
  ): VoicePresenceEvent => ({
    event_type: "voice.participant_joined",
    server_id: "s1",
    room_id,
    participant_id: "u-ana",
    name: "Ana",
    ...(room_started_at === undefined ? {} : { room_started_at }),
  });

  it("guarda el inicio que manda el back", () => {
    expect(withCallStart({}, event(START))).toEqual({ general: START_MS });
  });

  it("lo borra cuando el canal queda vacio", () => {
    const starts = { general: START_MS, juegos: 1 };
    expect(withCallStart(starts, event(null))).toEqual({ juegos: 1 });
  });

  it("no toca nada con un evento de un back viejo o un valor ilegible", () => {
    const starts = { general: START_MS };
    expect(withCallStart(starts, event(undefined))).toBe(starts);
    expect(withCallStart(starts, event("ayer"))).toBe(starts);
  });

  it("devuelve el mismo objeto si no cambia, para no re-renderizar", () => {
    const starts = { general: START_MS };
    expect(withCallStart(starts, event(START))).toBe(starts);
    expect(withCallStart(starts, event(null, "otro"))).toBe(starts);
  });

  it("no modifica el mapa que recibe", () => {
    const starts = { general: START_MS };
    withCallStart(starts, event(null));
    withCallStart(starts, event(START, "juegos"));
    expect(starts).toEqual({ general: START_MS });
  });
});

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

const sharingBase: VoiceParticipant = {
  identity: "u-ana",
  name: "Ana",
  isLocal: false,
  muted: false,
  speaking: false,
  cameraOn: false,
  screenSharing: false,
  mutedForMe: false,
};
const viewer = { ...sharingBase, identity: "yo", isLocal: true };
const sharer = sharingBase;
const sharing = (participant: VoiceParticipant) => ({
  ...participant,
  screenSharing: true,
});

describe("screenSharingIds", () => {
  it("lista a todos los que comparten, vos incluido", () => {
    expect(screenSharingIds([sharing(viewer), sharer])).toEqual(["yo"]);
  });
});

describe("pinOnScreenShareChange", () => {
  it("fija la pantalla de quien empieza a compartir", () => {
    expect(pinOnScreenShareChange(null, [], [viewer, sharing(sharer)])).toBe(
      "u-ana:screen",
    );
  });

  it("no fija tu propia pantalla: seguis viendo la grilla", () => {
    expect(
      pinOnScreenShareChange(null, [], [sharing(viewer), sharer]),
    ).toBeNull();
  });

  it("vuelve a la grilla cuando deja de compartir la pantalla fijada", () => {
    expect(
      pinOnScreenShareChange("u-ana:screen", ["u-ana"], [viewer, sharer]),
    ).toBeNull();
    expect(
      pinOnScreenShareChange("u-ana:screen", ["u-ana"], [viewer]),
    ).toBeNull();
  });

  it("respeta lo que elegiste mientras sigue compartiendo", () => {
    expect(
      pinOnScreenShareChange(null, ["u-ana"], [viewer, sharing(sharer)]),
    ).toBeNull();
    expect(
      pinOnScreenShareChange("u-ana", ["u-ana"], [viewer, sharing(sharer)]),
    ).toBe("u-ana");
  });

  it("no toca a una persona fijada a mano cuando otro deja de compartir", () => {
    expect(pinOnScreenShareChange("u-ana", ["yo"], [viewer, sharer])).toBe(
      "u-ana",
    );
  });
});

describe("hasExpandableVideo", () => {
  it("el tile de la persona se amplia mientras tenga camara", () => {
    expect(
      hasExpandableVideo([viewer, { ...sharer, cameraOn: true }], "u-ana"),
    ).toBe(true);
    expect(hasExpandableVideo([viewer, sharing(sharer)], "u-ana")).toBe(false);
  });

  it("el tile de pantalla se amplia mientras siga compartiendo", () => {
    expect(hasExpandableVideo([viewer, sharing(sharer)], "u-ana:screen")).toBe(
      true,
    );
    expect(hasExpandableVideo([viewer, sharer], "u-ana:screen")).toBe(false);
  });

  it("es false si se fue de la llamada", () => {
    expect(hasExpandableVideo([viewer], "u-ana")).toBe(false);
    expect(hasExpandableVideo([viewer], "u-ana:screen")).toBe(false);
  });
});

import { describe, expect, it } from "vitest";

import {
  parseVoiceBridgeCommand,
  parseVoiceBridgeEvent,
  serializeVoiceBridgeMessage,
  type VoiceBridgeCommand,
  type VoiceBridgeEvent,
  withParticipantProfiles,
} from "./voice-bridge";
import type { VoiceParticipant } from "./voice";

const ana: VoiceParticipant = {
  identity: "u-ana",
  name: "Ana",
  isLocal: true,
  muted: false,
  speaking: true,
  cameraOn: false,
  screenSharing: false,
  mutedForMe: false,
};

describe("parseVoiceBridgeEvent", () => {
  const events: VoiceBridgeEvent[] = [
    { type: "ready" },
    { type: "status", status: "reconnecting" },
    { type: "participants", participants: [ana] },
    { type: "participants", participants: [] },
    { type: "speakPermission", allowed: false },
    { type: "cameraStopped" },
    { type: "muteForMeRequested", identity: "u-beto" },
    { type: "participantsRequested" },
    { type: "pinRequested", identity: "u-beto" },
    { type: "pinRequested", identity: null },
    { type: "expandRequested", identity: "u-beto" },
    { type: "expandRequested", identity: null },
    { type: "disconnected", reason: "removed" },
    { type: "error", error: "mic_denied" },
    { type: "error", error: "camera_denied" },
  ];

  it.each(events)("vuelve igual despues de serializar: $type", (event) => {
    expect(parseVoiceBridgeEvent(serializeVoiceBridgeMessage(event))).toEqual(
      event,
    );
  });

  it("descarta lo que no es JSON o no es un objeto", () => {
    expect(parseVoiceBridgeEvent("no es json")).toBeNull();
    expect(parseVoiceBridgeEvent("[1,2]")).toBeNull();
    expect(parseVoiceBridgeEvent("null")).toBeNull();
    expect(parseVoiceBridgeEvent(42)).toBeNull();
  });

  it("descarta tipos y valores desconocidos", () => {
    expect(parseVoiceBridgeEvent('{"type":"otro"}')).toBeNull();
    expect(
      parseVoiceBridgeEvent('{"type":"status","status":"dormido"}'),
    ).toBeNull();
    expect(
      parseVoiceBridgeEvent('{"type":"disconnected","reason":"porque si"}'),
    ).toBeNull();
    expect(parseVoiceBridgeEvent('{"type":"error","error":"x"}')).toBeNull();
    expect(
      parseVoiceBridgeEvent('{"type":"speakPermission","allowed":"si"}'),
    ).toBeNull();
  });

  it("descarta participantes incompletos", () => {
    const sinMutedForMe: Partial<VoiceParticipant> = { ...ana };
    delete sinMutedForMe.mutedForMe;
    const raw = JSON.stringify({
      type: "participants",
      participants: [ana, sinMutedForMe],
    });

    expect(parseVoiceBridgeEvent(raw)).toBeNull();
  });

  it("no deja pasar campos de mas en un participante", () => {
    const raw = JSON.stringify({
      type: "participants",
      participants: [{ ...ana, token: "secreto" }],
    });

    expect(parseVoiceBridgeEvent(raw)).toEqual({
      type: "participants",
      participants: [ana],
    });
  });
});

describe("parseVoiceBridgeCommand", () => {
  const commands: VoiceBridgeCommand[] = [
    { type: "connect", url: "wss://livekit.example", token: "t" },
    { type: "setMicrophoneEnabled", enabled: false },
    { type: "setCameraEnabled", enabled: true },
    { type: "setMutedForMe", identity: "u-beto", muted: true },
    {
      type: "setAppearance",
      theme: "light",
      localAvatarUrl: null,
      canExpand: false,
    },
    {
      type: "setAppearance",
      theme: "dark",
      localAvatarUrl: "https://cdn.example/a.png",
      canExpand: true,
    },
    { type: "setExpanded", identity: "u-beto" },
    { type: "setExpanded", identity: null },
    {
      type: "setParticipantProfiles",
      profiles: [
        { identity: "u-ana", name: "Ana", avatarUrl: null },
        {
          identity: "u-beto",
          name: "Beto",
          avatarUrl: "https://cdn.example/b.png",
        },
      ],
    },
    { type: "setParticipantProfiles", profiles: [] },
    { type: "disconnect" },
  ];

  it.each(commands)("acepta el objeto y su JSON: $type", (command) => {
    expect(parseVoiceBridgeCommand(command)).toEqual(command);
    expect(
      parseVoiceBridgeCommand(serializeVoiceBridgeMessage(command)),
    ).toEqual(command);
  });

  it("no conecta sin url o sin token", () => {
    expect(
      parseVoiceBridgeCommand({ type: "connect", url: "", token: "t" }),
    ).toBeNull();
    expect(
      parseVoiceBridgeCommand({ type: "connect", url: "wss://x" }),
    ).toBeNull();
  });

  it("descarta comandos desconocidos o mal formados", () => {
    expect(parseVoiceBridgeCommand({ type: "hackear" })).toBeNull();
    expect(
      parseVoiceBridgeCommand({ type: "setMicrophoneEnabled", enabled: 1 }),
    ).toBeNull();
    expect(
      parseVoiceBridgeCommand({ type: "setMutedForMe", muted: true }),
    ).toBeNull();
    expect(parseVoiceBridgeCommand("{roto")).toBeNull();
  });

  it("descarta un tema desconocido o una foto vacia", () => {
    expect(
      parseVoiceBridgeCommand({
        type: "setAppearance",
        theme: "sepia",
        localAvatarUrl: null,
      }),
    ).toBeNull();
    expect(
      parseVoiceBridgeCommand({
        type: "setAppearance",
        theme: "dark",
        localAvatarUrl: "",
      }),
    ).toBeNull();
    expect(
      parseVoiceBridgeCommand({ type: "setAppearance", theme: "dark" }),
    ).toBeNull();
  });

  it("fija a alguien o vuelve a la grilla", () => {
    expect(
      parseVoiceBridgeCommand({ type: "setPinned", identity: "u-beto" }),
    ).toEqual({ type: "setPinned", identity: "u-beto" });
    expect(
      parseVoiceBridgeCommand({ type: "setPinned", identity: null }),
    ).toEqual({ type: "setPinned", identity: null });
    expect(
      parseVoiceBridgeCommand({ type: "setPinned", identity: "" }),
    ).toBeNull();
    expect(parseVoiceBridgeCommand({ type: "setPinned" })).toBeNull();
  });

  it("sin canExpand (app vieja) no habilita la pantalla grande", () => {
    expect(
      parseVoiceBridgeCommand({
        type: "setAppearance",
        theme: "dark",
        localAvatarUrl: null,
      }),
    ).toEqual({
      type: "setAppearance",
      theme: "dark",
      localAvatarUrl: null,
      canExpand: false,
    });
    expect(
      parseVoiceBridgeCommand({
        type: "setAppearance",
        theme: "dark",
        localAvatarUrl: null,
        canExpand: "si",
      }),
    ).toMatchObject({ canExpand: false });
  });

  it("amplia a alguien o vuelve a la llamada", () => {
    expect(
      parseVoiceBridgeCommand({ type: "setExpanded", identity: "" }),
    ).toBeNull();
    expect(parseVoiceBridgeCommand({ type: "setExpanded" })).toBeNull();
    expect(
      parseVoiceBridgeCommand({ type: "setExpanded", identity: 7 }),
    ).toBeNull();
  });
});

describe("expandRequested", () => {
  it("descarta una identidad vacia o faltante", () => {
    expect(
      parseVoiceBridgeEvent({ type: "expandRequested", identity: "" }),
    ).toBeNull();
    expect(parseVoiceBridgeEvent({ type: "expandRequested" })).toBeNull();
  });
});

describe("setParticipantProfiles", () => {
  it("descarta perfiles sin identidad, sin nombre o con foto vacia", () => {
    const withProfile = (profile: unknown) =>
      parseVoiceBridgeCommand({
        type: "setParticipantProfiles",
        profiles: [profile],
      });

    expect(withProfile({ name: "Ana", avatarUrl: null })).toBeNull();
    expect(
      withProfile({ identity: "u-ana", name: "", avatarUrl: null }),
    ).toBeNull();
    expect(
      withProfile({ identity: "u-ana", name: "Ana", avatarUrl: "" }),
    ).toBeNull();
    expect(withProfile({ identity: "u-ana", name: "Ana" })).toBeNull();
    expect(
      parseVoiceBridgeCommand({ type: "setParticipantProfiles" }),
    ).toBeNull();
  });
});

describe("withParticipantProfiles", () => {
  const beto: VoiceParticipant = {
    ...ana,
    identity: "u-beto",
    name: "u-beto",
    isLocal: false,
  };

  it("usa el nombre del perfil de cada uno", () => {
    const named = withParticipantProfiles(
      [{ ...ana, name: "u-ana" }, beto],
      [
        { identity: "u-ana", name: "Ana", avatarUrl: null },
        { identity: "u-beto", name: "Beto", avatarUrl: null },
      ],
    );

    expect(named.map((participant) => participant.name)).toEqual([
      "Ana",
      "Beto",
    ]);
  });

  it("deja como esta a quien no tiene perfil", () => {
    expect(withParticipantProfiles([beto], [])).toEqual([beto]);
  });
});

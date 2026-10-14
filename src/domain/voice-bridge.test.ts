import { describe, expect, it } from "vitest";

import {
  parseVoiceBridgeCommand,
  parseVoiceBridgeEvent,
  serializeVoiceBridgeMessage,
  type VoiceBridgeCommand,
  type VoiceBridgeEvent,
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
    { type: "setAppearance", theme: "light", localAvatarUrl: null },
    {
      type: "setAppearance",
      theme: "dark",
      localAvatarUrl: "https://cdn.example/a.png",
    },
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
});

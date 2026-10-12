import { describe, expect, it } from "vitest";

import type { VoiceParticipant } from "./voice";
import {
  initialVoiceSessionState,
  voiceParticipantsOf,
  voiceSessionReducer,
  type VoiceSessionAction,
  type VoiceSessionState,
  type VoiceSessionTarget,
} from "./voice-session";

const general: VoiceSessionTarget = {
  serverId: "s1",
  serverName: "Discordia HQ",
  channelId: "voz-1",
  channelName: "General",
};
const gaming: VoiceSessionTarget = {
  ...general,
  channelId: "voz-2",
  channelName: "Gaming Room",
};

function participant(
  identity: string,
  overrides: Partial<VoiceParticipant> = {},
): VoiceParticipant {
  return {
    identity,
    name: identity,
    isLocal: false,
    muted: false,
    speaking: false,
    cameraOn: false,
    screenSharing: false,
    mutedForMe: false,
    ...overrides,
  };
}

function reduce(
  actions: VoiceSessionAction[],
  state: VoiceSessionState = initialVoiceSessionState,
): VoiceSessionState {
  return actions.reduce(voiceSessionReducer, state);
}

const connected = (participants: VoiceParticipant[] = []) =>
  reduce([
    { type: "join_requested", target: general },
    { type: "status", status: "connected" },
    { type: "participants", participants },
  ]);

describe("voiceSessionReducer", () => {
  it("entra conectando, sin nadie hasta que LiveKit avise", () => {
    const state = reduce([{ type: "join_requested", target: general }]);
    expect(state.target).toEqual(general);
    expect(state.status).toBe("connecting");
    expect(state.participants).toEqual([]);
  });

  it("toma los participantes y el estado que informa LiveKit", () => {
    const state = connected([participant("ana")]);
    expect(state.status).toBe("connected");
    expect(state.participants.map((p) => p.identity)).toEqual(["ana"]);
  });

  it("sin llamada ignora estado y participantes viejos", () => {
    const state = reduce([
      { type: "status", status: "connected" },
      { type: "participants", participants: [participant("ana")] },
    ]);
    expect(state).toEqual(initialVoiceSessionState);
  });

  it("al cambiar de canal conserva el mute pero corta camara y pantalla", () => {
    const state = reduce(
      [
        { type: "toggle_mute" },
        { type: "toggle_camera" },
        { type: "toggle_screen_share" },
        { type: "toggle_muted_for_me", identity: "ana" },
        { type: "join_requested", target: gaming },
      ],
      connected([participant("ana")]),
    );

    expect(state.target).toEqual(gaming);
    expect(state.status).toBe("connecting");
    expect(state.muted).toBe(true);
    expect(state.cameraOn).toBe(false);
    expect(state.screenSharing).toBe(false);
    expect(state.mutedForMe).toEqual([]);
    expect(state.participants).toEqual([]);
  });

  it("volver a entrar al mismo canal no reinicia la llamada", () => {
    const state = connected([participant("ana")]);
    expect(
      voiceSessionReducer(state, { type: "join_requested", target: general }),
    ).toBe(state);
  });

  it("al terminar limpia la llamada, conserva el mute y deja el aviso", () => {
    const state = reduce(
      [{ type: "toggle_mute" }, { type: "ended", notice: "Se cortó" }],
      connected([participant("ana")]),
    );
    expect(state.target).toBeNull();
    expect(state.status).toBe("idle");
    expect(state.participants).toEqual([]);
    expect(state.muted).toBe(true);
    expect(state.notice).toBe("Se cortó");
  });

  it("descarta el aviso", () => {
    const state = reduce([
      { type: "ended", notice: "Se cortó" },
      { type: "dismiss_notice" },
    ]);
    expect(state.notice).toBeNull();
  });

  it("silenciado por un moderador no puede activar el microfono", () => {
    const silenced = voiceSessionReducer(connected(), {
      type: "speak_permission",
      allowed: false,
    });
    expect(silenced.canSpeak).toBe(false);
    expect(silenced.muted).toBe(true);
    expect(voiceSessionReducer(silenced, { type: "toggle_mute" }).muted).toBe(
      true,
    );

    const restored = voiceSessionReducer(silenced, {
      type: "speak_permission",
      allowed: true,
    });
    expect(restored.canSpeak).toBe(true);
    expect(voiceSessionReducer(restored, { type: "toggle_mute" }).muted).toBe(
      false,
    );
  });

  it("camara y pantalla no se prenden sin llamada", () => {
    const state = reduce([
      { type: "toggle_camera" },
      { type: "toggle_screen_share" },
    ]);
    expect(state.cameraOn).toBe(false);
    expect(state.screenSharing).toBe(false);
  });

  it("silenciar para mi alterna", () => {
    const once = voiceSessionReducer(connected(), {
      type: "toggle_muted_for_me",
      identity: "ana",
    });
    expect(once.mutedForMe).toEqual(["ana"]);
    expect(
      voiceSessionReducer(once, {
        type: "toggle_muted_for_me",
        identity: "ana",
      }).mutedForMe,
    ).toEqual([]);
  });

  it("cada pedido de ir al canal cambia el nonce", () => {
    const first = voiceSessionReducer(connected(), { type: "focus" });
    const second = voiceSessionReducer(first, { type: "focus" });
    expect(first.focus).toEqual({
      serverId: "s1",
      channelId: "voz-1",
      nonce: 1,
    });
    expect(second.focus?.nonce).toBe(2);
  });

  it("sin llamada no hay a donde ir", () => {
    expect(
      voiceSessionReducer(initialVoiceSessionState, { type: "focus" }).focus,
    ).toBeNull();
  });
});

describe("voiceParticipantsOf", () => {
  it("pone a uno primero y aplica el silenciar para mi solo a los demas", () => {
    const state = reduce(
      [
        { type: "toggle_muted_for_me", identity: "zoe" },
        { type: "toggle_muted_for_me", identity: "yo" },
      ],
      connected([
        participant("zoe", { name: "Zoe" }),
        participant("yo", { name: "Yo", isLocal: true }),
        participant("ana", { name: "Ana" }),
      ]),
    );

    const participants = voiceParticipantsOf(state);

    expect(participants.map((p) => p.identity)).toEqual(["yo", "ana", "zoe"]);
    expect(participants[0]?.mutedForMe).toBe(false);
    expect(participants[2]?.mutedForMe).toBe(true);
  });

  it("sin llamada no hay nadie", () => {
    expect(voiceParticipantsOf(initialVoiceSessionState)).toEqual([]);
  });
});

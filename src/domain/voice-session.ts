import {
  sortVoiceParticipants,
  type VoiceConnectionStatus,
  type VoiceParticipant,
} from "./voice";

/**
 * Estado de la llamada de voz, igual en las dos apps. Web lo alimenta con los
 * eventos de `livekit-client`; mobile, con los del puente del WebView
 * (`voice-bridge.ts`). Las dos traducen lo suyo a estas mismas acciones, asi
 * que las reglas (que se conserva al cambiar de canal, cuando se puede hablar)
 * viven en un solo lugar.
 */
export interface VoiceSessionTarget {
  serverId: string;
  serverName: string;
  channelId: string;
  channelName: string;
}

export interface VoiceSessionState {
  target: VoiceSessionTarget | null;
  status: VoiceConnectionStatus;
  muted: boolean;
  cameraOn: boolean;
  screenSharing: boolean;
  canSpeak: boolean;
  participants: VoiceParticipant[];
  mutedForMe: string[];
  notice: string | null;
  focus: { serverId: string; channelId: string; nonce: number } | null;
}

export type VoiceSessionAction =
  | { type: "join_requested"; target: VoiceSessionTarget }
  | {
      type: "status";
      status: Exclude<VoiceConnectionStatus, "idle">;
    }
  | { type: "participants"; participants: VoiceParticipant[] }
  | { type: "speak_permission"; allowed: boolean }
  /** Se salio, se corto o no se pudo entrar. `notice` es el aviso, si hay. */
  | { type: "ended"; notice: string | null }
  | { type: "dismiss_notice" }
  | { type: "toggle_mute" }
  | { type: "toggle_camera" }
  | { type: "toggle_screen_share" }
  | { type: "toggle_muted_for_me"; identity: string }
  | { type: "focus" };

export const initialVoiceSessionState: VoiceSessionState = {
  target: null,
  status: "idle",
  muted: false,
  cameraOn: false,
  screenSharing: false,
  canSpeak: true,
  participants: [],
  mutedForMe: [],
  notice: null,
  focus: null,
};

export function voiceSessionReducer(
  state: VoiceSessionState,
  action: VoiceSessionAction,
): VoiceSessionState {
  switch (action.type) {
    case "join_requested":
      if (state.target?.channelId === action.target.channelId) return state;
      return {
        ...state,
        target: action.target,
        status: "connecting",
        cameraOn: false,
        screenSharing: false,
        canSpeak: true,
        participants: [],
        mutedForMe: [],
        notice: null,
      };
    case "status":
      return state.target ? { ...state, status: action.status } : state;
    case "participants":
      return state.target
        ? { ...state, participants: action.participants }
        : state;
    case "speak_permission":
      return {
        ...state,
        canSpeak: action.allowed,
        muted: action.allowed ? state.muted : true,
      };
    case "ended":
      return {
        ...initialVoiceSessionState,
        muted: state.muted,
        notice: action.notice,
        focus: state.focus,
      };
    case "dismiss_notice":
      return { ...state, notice: null };
    case "toggle_mute":
      if (!state.canSpeak) return state;
      return { ...state, muted: !state.muted };
    case "toggle_camera":
      return state.target ? { ...state, cameraOn: !state.cameraOn } : state;
    case "toggle_screen_share":
      return state.target
        ? { ...state, screenSharing: !state.screenSharing }
        : state;
    case "toggle_muted_for_me": {
      const isMuted = state.mutedForMe.includes(action.identity);
      return {
        ...state,
        mutedForMe: isMuted
          ? state.mutedForMe.filter((id) => id !== action.identity)
          : [...state.mutedForMe, action.identity],
      };
    }
    case "focus":
      return state.target
        ? {
            ...state,
            focus: {
              serverId: state.target.serverId,
              channelId: state.target.channelId,
              nonce: (state.focus?.nonce ?? 0) + 1,
            },
          }
        : state;
  }
}

export function voiceParticipantsOf(
  state: VoiceSessionState,
): VoiceParticipant[] {
  if (!state.target) return [];
  return sortVoiceParticipants(
    state.participants.map((participant) => ({
      ...participant,
      mutedForMe:
        !participant.isLocal && state.mutedForMe.includes(participant.identity),
    })),
  );
}

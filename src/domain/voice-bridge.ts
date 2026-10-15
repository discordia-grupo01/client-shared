/**
 * Contrato entre `app-mobile` y la pagina `/voice-embed` de `web-client`.
 *
 * Expo Go no puede cargar el SDK nativo de LiveKit, asi que mobile corre
 * `livekit-client` dentro de un WebView y le habla por mensajes. El WebView
 * se ve solo en la pantalla de la llamada, donde dibuja la grilla con los
 * videos; en el resto de la app queda escondido y solo suena:
 *
 *   app ── VoiceBridgeCommand (injectJavaScript) ──► pagina ──► LiveKit
 *   app ◄── VoiceBridgeEvent (postMessage) ───────── pagina
 *
 * Esta en el paquete porque lo escriben las dos apps: si un lado cambia un
 * mensaje y el otro no, la llamada se rompe sin error de compilacion. Los
 * mensajes cruzan como JSON, por eso cada lado valida lo que recibe.
 *
 * El token de LiveKit viaja en `connect` y no en la URL de la pagina, asi no
 * queda en el historial del WebView ni en logs.
 */

import type { ThemeName } from "../theme/tokens";
import type {
  VoiceConnectionStatus,
  VoiceDisconnectReason,
  VoiceParticipant,
} from "./voice";

export type VoiceBridgeCommand =
  | { type: "connect"; url: string; token: string }
  | { type: "setMicrophoneEnabled"; enabled: boolean }
  | { type: "setCameraEnabled"; enabled: boolean }
  | { type: "setMutedForMe"; identity: string; muted: boolean }
  | { type: "setPinned"; identity: string | null }
  | {
      type: "setAppearance";
      theme: ThemeName;
      localAvatarUrl: string | null;
    }
  | { type: "disconnect" };

export type VoiceMediaError =
  "mic_denied" | "camera_denied" | "connect_failed" | "audio_blocked";

export type VoiceBridgeEvent =
  | { type: "ready" }
  | { type: "status"; status: VoiceConnectionStatus }
  | { type: "participants"; participants: VoiceParticipant[] }
  | { type: "speakPermission"; allowed: boolean }
  | { type: "cameraStopped" }
  | { type: "muteForMeRequested"; identity: string }
  | { type: "participantsRequested" }
  | { type: "pinRequested"; identity: string | null }
  | { type: "disconnected"; reason: VoiceDisconnectReason }
  | { type: "error"; error: VoiceMediaError };

const STATUSES: readonly VoiceConnectionStatus[] = [
  "idle",
  "connecting",
  "connected",
  "reconnecting",
];
const DISCONNECT_REASONS: readonly VoiceDisconnectReason[] = [
  "client",
  "removed",
  "room_closed",
  "error",
];
const MEDIA_ERRORS: readonly VoiceMediaError[] = [
  "mic_denied",
  "camera_denied",
  "connect_failed",
  "audio_blocked",
];
const THEME_NAMES: readonly ThemeName[] = ["dark", "light"];

type Json = Record<string, unknown>;

function isObject(value: unknown): value is Json {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value !== "";
}

function oneOf<T extends string>(
  allowed: readonly T[],
  value: unknown,
): value is T {
  return (
    typeof value === "string" && (allowed as readonly string[]).includes(value)
  );
}

function toObject(raw: unknown): Json | null {
  if (isObject(raw)) return raw;
  if (typeof raw !== "string") return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function toParticipant(value: unknown): VoiceParticipant | null {
  if (!isObject(value)) return null;
  const {
    identity,
    name,
    isLocal,
    muted,
    speaking,
    cameraOn,
    screenSharing,
    mutedForMe,
  } = value;
  if (!isNonEmptyString(identity) || typeof name !== "string") return null;
  const flags = [isLocal, muted, speaking, cameraOn, screenSharing, mutedForMe];
  if (!flags.every((flag) => typeof flag === "boolean")) return null;
  return {
    identity,
    name,
    isLocal: isLocal as boolean,
    muted: muted as boolean,
    speaking: speaking as boolean,
    cameraOn: cameraOn as boolean,
    screenSharing: screenSharing as boolean,
    mutedForMe: mutedForMe as boolean,
  };
}

export function parseVoiceBridgeEvent(raw: unknown): VoiceBridgeEvent | null {
  const message = toObject(raw);
  if (!message) return null;

  switch (message.type) {
    case "ready":
      return { type: "ready" };
    case "status":
      return oneOf(STATUSES, message.status)
        ? { type: "status", status: message.status }
        : null;
    case "participants": {
      if (!Array.isArray(message.participants)) return null;
      const participants = message.participants.map(toParticipant);
      return participants.every((p): p is VoiceParticipant => p !== null)
        ? { type: "participants", participants }
        : null;
    }
    case "speakPermission":
      return typeof message.allowed === "boolean"
        ? { type: "speakPermission", allowed: message.allowed }
        : null;
    case "cameraStopped":
      return { type: "cameraStopped" };
    case "muteForMeRequested":
      return isNonEmptyString(message.identity)
        ? { type: "muteForMeRequested", identity: message.identity }
        : null;
    case "participantsRequested":
      return { type: "participantsRequested" };
    case "pinRequested":
      return message.identity === null || isNonEmptyString(message.identity)
        ? { type: "pinRequested", identity: message.identity }
        : null;
    case "disconnected":
      return oneOf(DISCONNECT_REASONS, message.reason)
        ? { type: "disconnected", reason: message.reason }
        : null;
    case "error":
      return oneOf(MEDIA_ERRORS, message.error)
        ? { type: "error", error: message.error }
        : null;
    default:
      return null;
  }
}

export function parseVoiceBridgeCommand(
  raw: unknown,
): VoiceBridgeCommand | null {
  const message = toObject(raw);
  if (!message) return null;

  switch (message.type) {
    case "connect":
      return isNonEmptyString(message.url) && isNonEmptyString(message.token)
        ? { type: "connect", url: message.url, token: message.token }
        : null;
    case "setMicrophoneEnabled":
      return typeof message.enabled === "boolean"
        ? { type: "setMicrophoneEnabled", enabled: message.enabled }
        : null;
    case "setCameraEnabled":
      return typeof message.enabled === "boolean"
        ? { type: "setCameraEnabled", enabled: message.enabled }
        : null;
    case "setMutedForMe":
      return isNonEmptyString(message.identity) &&
        typeof message.muted === "boolean"
        ? {
            type: "setMutedForMe",
            identity: message.identity,
            muted: message.muted,
          }
        : null;
    case "setPinned":
      return message.identity === null || isNonEmptyString(message.identity)
        ? { type: "setPinned", identity: message.identity }
        : null;
    case "setAppearance": {
      const { localAvatarUrl } = message;
      if (!oneOf(THEME_NAMES, message.theme)) return null;
      if (localAvatarUrl !== null && !isNonEmptyString(localAvatarUrl)) {
        return null;
      }
      return { type: "setAppearance", theme: message.theme, localAvatarUrl };
    }
    case "disconnect":
      return { type: "disconnect" };
    default:
      return null;
  }
}

export function serializeVoiceBridgeMessage(
  message: VoiceBridgeCommand | VoiceBridgeEvent,
): string {
  return JSON.stringify(message);
}

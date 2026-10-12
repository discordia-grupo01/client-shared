/**
 * Contrato entre `app-mobile` y la pagina `/voice-embed` de `web-client`.
 *
 * Expo Go no puede cargar el SDK nativo de LiveKit, asi que mobile corre
 * `livekit-client` dentro de un WebView invisible y le habla por mensajes:
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

import type {
  VoiceConnectionStatus,
  VoiceDisconnectReason,
  VoiceParticipant,
} from "./voice";

export type VoiceBridgeCommand =
  | { type: "connect"; url: string; token: string }
  | { type: "setMicrophoneEnabled"; enabled: boolean }
  /** #52: silenciar o volver a escuchar a otro participante solo para uno. */
  | { type: "setMutedForMe"; identity: string; muted: boolean }
  | { type: "disconnect" };

/** Fallas del lado del WebView, antes o despues de conectar. */
export type VoiceMediaError = "mic_denied" | "connect_failed" | "audio_blocked";

export type VoiceBridgeEvent =
  /** La pagina cargo y espera `connect`. */
  | { type: "ready" }
  | { type: "status"; status: VoiceConnectionStatus }
  | { type: "participants"; participants: VoiceParticipant[] }
  /**
   * Un moderador te silencio (`false`) o te devolvio la voz (`true`). Llega
   * tambien al conectar si ya estabas silenciado en el servidor.
   */
  | { type: "speakPermission"; allowed: boolean }
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
  "connect_failed",
  "audio_blocked",
];

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

/**
 * Lo que manda la pagina, validado. Recibe el `event.nativeEvent.data` de
 * `onMessage` tal cual (un string). Devuelve `null` si no es un evento
 * conocido o le falta algo: el WebView puede recibir mensajes de otros
 * scripts y no hay que confiar en la forma.
 */
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

/**
 * Lo que manda la app, validado del lado de la pagina. Acepta el objeto o su
 * JSON, segun como lo inyecte la app.
 */
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
    case "setMutedForMe":
      return isNonEmptyString(message.identity) &&
        typeof message.muted === "boolean"
        ? {
            type: "setMutedForMe",
            identity: message.identity,
            muted: message.muted,
          }
        : null;
    case "disconnect":
      return { type: "disconnect" };
    default:
      return null;
  }
}

/** Serializa un mensaje del puente para `postMessage` o `injectJavaScript`. */
export function serializeVoiceBridgeMessage(
  message: VoiceBridgeCommand | VoiceBridgeEvent,
): string {
  return JSON.stringify(message);
}

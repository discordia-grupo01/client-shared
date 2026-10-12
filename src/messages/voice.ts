/**
 * Errores y avisos de la voz. Los textos de pantalla (botones, "Voz
 * conectada", "N conectados") estan en `ui.ts`.
 */

import type { VoiceDisconnectReason, VoiceErrorCode } from "../domain/voice";
import type { VoiceMediaError } from "../domain/voice-bridge";

import { UNEXPECTED_ERROR_MESSAGE } from "./errors";
import { VOICE_CONNECT_FORBIDDEN } from "./permissions";

export const VOICE_UNAVAILABLE =
  "La voz no está disponible en este momento. Intentá de nuevo en unos minutos.";
export const VOICE_CONNECT_FAILED =
  "No pudimos conectarte al canal de voz. Intentá de nuevo.";
export const VOICE_LEAVE_FAILED =
  "No pudimos avisar que saliste del canal de voz. Ya no se te escucha.";
export const VOICE_PARTICIPANTS_FAILED =
  "No pudimos cargar quién está en los canales de voz.";
export const VOICE_MIC_DENIED =
  "Necesitamos acceso al micrófono para que te escuchen. Habilitalo en la configuración y volvé a entrar.";
export const VOICE_AUDIO_BLOCKED =
  "Tocá en cualquier lugar de la pantalla para escuchar la llamada.";
export const VOICE_MODERATOR_MUTED =
  "Un moderador te silenció en este servidor. Seguís escuchando la llamada.";
export const VOICE_REMOVED = "Te desconectaron del canal de voz.";
export const VOICE_ROOM_CLOSED = "El canal de voz se cerró.";
export const VOICE_CONNECTION_LOST =
  "Se cortó la conexión con el canal de voz.";

/**
 * Por codigo de signaling. `voice_not_configured` sale tambien cuando
 * `servers` no responde, y desde la UI nunca se pide un canal de texto ni un
 * id roto, asi que para la persona todo eso es "no anda la voz ahora".
 */
const VOICE_ERROR_MESSAGES: Readonly<Record<VoiceErrorCode, string>> = {
  voice_forbidden: VOICE_CONNECT_FORBIDDEN,
  voice_not_configured: VOICE_UNAVAILABLE,
  voice_unavailable: VOICE_UNAVAILABLE,
  invalid_channel_id: VOICE_CONNECT_FAILED,
  channel_id_required: VOICE_CONNECT_FAILED,
  server_id_required: VOICE_PARTICIPANTS_FAILED,
};

/** El mensaje para un error de signaling (ver `voiceErrorCodeOf`). */
export function voiceErrorMessage(
  code: VoiceErrorCode | undefined,
  fallback: string = UNEXPECTED_ERROR_MESSAGE,
): string {
  return code ? VOICE_ERROR_MESSAGES[code] : fallback;
}

const MEDIA_ERROR_MESSAGES: Readonly<Record<VoiceMediaError, string>> = {
  mic_denied: VOICE_MIC_DENIED,
  connect_failed: VOICE_CONNECT_FAILED,
  audio_blocked: VOICE_AUDIO_BLOCKED,
};

export function voiceMediaErrorMessage(error: VoiceMediaError): string {
  return MEDIA_ERROR_MESSAGES[error];
}

/**
 * El aviso cuando la llamada se corta sola. `client` no tiene aviso: la
 * cortaste vos.
 */
export function voiceDisconnectMessage(
  reason: VoiceDisconnectReason,
): string | null {
  switch (reason) {
    case "client":
      return null;
    case "removed":
      return VOICE_REMOVED;
    case "room_closed":
      return VOICE_ROOM_CLOSED;
    case "error":
      return VOICE_CONNECTION_LOST;
  }
}

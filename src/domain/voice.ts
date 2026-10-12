/**
 * Contrato de voz con `voice-sfu/signaling` (Phoenix) a traves del Gateway:
 *
 * - `POST /api/voice/token` -> `VoiceToken` (entrar o cambiar de canal).
 * - `DELETE /api/voice/session` -> 204 (salir).
 * - `GET /api/voice/participants?server_id=` -> `VoiceParticipantsResponse`
 *   (quien esta en cada canal de voz, sin estar conectado: #20).
 *
 * El audio no pasa por el Gateway: con `url` y `token` cada app se conecta
 * directo a LiveKit. Web con `livekit-client`; mobile desde un WebView que
 * corre la misma libreria (ver `voice-bridge.ts`).
 */

/** Respuesta de `POST /api/voice/token`. `room_name` es `voice:<channelId>`. */
export interface VoiceToken {
  identity: string;
  /** Nombre de perfil: es el `name` que LiveKit muestra de este participante. */
  name: string;
  room_name: string;
  token: string;
  url: string;
}

/** Alguien conectado a un canal de voz, segun la presencia de signaling. */
export interface VoicePresenceParticipant {
  participant_id: string;
  name: string;
}

export interface VoiceChannelPresence {
  channel_id: string;
  participants: VoicePresenceParticipant[];
}

/** Respuesta de `GET /api/voice/participants?server_id=`. Los canales vacios no vienen. */
export interface VoiceParticipantsResponse {
  server_id: string;
  channels: VoiceChannelPresence[];
}

/** Participantes por canal de voz. Un canal sin nadie no tiene clave. */
export type VoicePresenceByChannel = Readonly<
  Record<string, readonly VoicePresenceParticipant[]>
>;

const byName = (a: { name: string }, b: { name: string }): number =>
  a.name.localeCompare(b.name, "es", { sensitivity: "base" });

/** Pasa la respuesta del back a un mapa por canal, cada lista ordenada por nombre. */
export function presenceByChannel(
  response: VoiceParticipantsResponse,
): VoicePresenceByChannel {
  const result: Record<string, VoicePresenceParticipant[]> = {};
  for (const { channel_id, participants } of response.channels) {
    if (participants.length === 0) continue;
    result[channel_id] = [...participants].sort(byName);
  }
  return result;
}

/**
 * Pisa la presencia de un canal con lo que se ve en vivo dentro de la sala.
 *
 * La lista de canales se refresca con polling, pero del canal en el que uno
 * esta conectado LiveKit avisa al instante. Sin esto, al cambiar de canal uno
 * se veria en los dos hasta el proximo poll. Por eso quien esta en vivo en
 * `channelId` se saca de los demas canales.
 */
export function withLivePresence(
  byChannel: VoicePresenceByChannel,
  channelId: string,
  live: readonly VoicePresenceParticipant[],
): VoicePresenceByChannel {
  const liveIds = new Set(live.map((p) => p.participant_id));
  const result: Record<string, readonly VoicePresenceParticipant[]> = {};

  for (const [id, participants] of Object.entries(byChannel)) {
    if (id === channelId) continue;
    const rest = participants.filter((p) => !liveIds.has(p.participant_id));
    if (rest.length > 0) result[id] = rest;
  }
  if (live.length > 0) result[channelId] = [...live].sort(byName);

  return result;
}

export type VoiceConnectionStatus =
  "idle" | "connecting" | "connected" | "reconnecting";

/**
 * Por que se corto la llamada:
 * - `client`: la cortaste vos.
 * - `removed`: signaling te saco de la sala. Pasa si entraste a otro canal
 *   desde otro dispositivo, o si te expulsaron, banearon o te sacaron el
 *   acceso al canal.
 * - `room_closed`: se borro el canal o el servidor.
 * - `error`: se cayo la conexion y no se pudo recuperar.
 */
export type VoiceDisconnectReason =
  "client" | "removed" | "room_closed" | "error";

/**
 * Lo que se muestra de cada participante dentro de la llamada: la grilla, el
 * borde de "hablando" (#51), el microfono tachado (#19) y el "silenciar para
 * mi" (#52). Web lo arma desde `livekit-client`; mobile lo recibe del WebView.
 */
export interface VoiceParticipant {
  identity: string;
  name: string;
  isLocal: boolean;
  /** Microfono apagado: lo silencio el propio participante o un moderador. */
  muted: boolean;
  speaking: boolean;
  cameraOn: boolean;
  screenSharing: boolean;
  /** Lo silenciaste solo para vos (#52). Siempre `false` para el participante local. */
  mutedForMe: boolean;
}

/**
 * Los participantes de la sala como presencia, para pasarlos a
 * `withLivePresence`.
 */
export function toVoicePresence(
  participants: readonly VoiceParticipant[],
): VoicePresenceParticipant[] {
  return participants.map(({ identity, name }) => ({
    participant_id: identity,
    name,
  }));
}

/** Vos primero y el resto por nombre, como en el prototipo. */
export function sortVoiceParticipants(
  participants: readonly VoiceParticipant[],
): VoiceParticipant[] {
  return [...participants].sort((a, b) => {
    if (a.isLocal !== b.isLocal) return a.isLocal ? -1 : 1;
    return byName(a, b);
  });
}

/**
 * Codigos de error de signaling. A diferencia de `servers`, signaling no
 * manda `{ error: { details: { reason } } }` sino `{ error: "<codigo>" }`,
 * asi que `reasonOf` no sirve aca: se lee con `voiceErrorCodeOf`.
 */
export const VOICE_ERROR_CODES = [
  "voice_forbidden",
  "voice_not_configured",
  "voice_unavailable",
  "invalid_channel_id",
  "channel_id_required",
  "server_id_required",
] as const;

export type VoiceErrorCode = (typeof VOICE_ERROR_CODES)[number];

function isVoiceErrorCode(value: unknown): value is VoiceErrorCode {
  return (
    typeof value === "string" &&
    (VOICE_ERROR_CODES as readonly string[]).includes(value)
  );
}

/** El codigo de un body de error de signaling, o `undefined` si no es uno conocido. */
export function voiceErrorCodeOf(body: unknown): VoiceErrorCode | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const error = (body as { error?: unknown }).error;
  return isVoiceErrorCode(error) ? error : undefined;
}

export type VoiceTokenResult =
  { ok: true; token: VoiceToken } | { ok: false; message: string };

export type LeaveVoiceResult = { ok: true } | { ok: false; message: string };

export type VoiceParticipantsResult =
  | { ok: true; byChannel: VoicePresenceByChannel }
  | { ok: false; message: string };

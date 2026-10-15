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
export interface VoiceToken {
  identity: string;
  name: string;
  room_name: string;
  token: string;
  url: string;
}

export interface VoicePresenceParticipant {
  participant_id: string;
  name: string;
}

export interface VoiceChannelPresence {
  channel_id: string;
  participants: VoicePresenceParticipant[];
}

export interface VoiceParticipantsResponse {
  server_id: string;
  channels: VoiceChannelPresence[];
}

export type VoicePresenceByChannel = Readonly<
  Record<string, readonly VoicePresenceParticipant[]>
>;

const byName = (a: { name: string }, b: { name: string }): number =>
  a.name.localeCompare(b.name, "es", { sensitivity: "base" });

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

export type VoiceDisconnectReason =
  "client" | "removed" | "room_closed" | "error";

export interface VoiceParticipant {
  identity: string;
  name: string;
  isLocal: boolean;
  muted: boolean;
  speaking: boolean;
  cameraOn: boolean;
  screenSharing: boolean;
  mutedForMe: boolean;
}

export function toVoicePresence(
  participants: readonly VoiceParticipant[],
): VoicePresenceParticipant[] {
  return participants.map(({ identity, name }) => ({
    participant_id: identity,
    name,
  }));
}

export function sortVoiceParticipants(
  participants: readonly VoiceParticipant[],
): VoiceParticipant[] {
  return [...participants].sort((a, b) => {
    if (a.isLocal !== b.isLocal) return a.isLocal ? -1 : 1;
    return byName(a, b);
  });
}

export function screenSharingIds(
  participants: readonly VoiceParticipant[],
): string[] {
  return participants
    .filter((participant) => participant.screenSharing)
    .map((participant) => participant.identity);
}

export function pinOnScreenShareChange(
  pinned: string | null,
  previousSharingIds: readonly string[],
  participants: readonly VoiceParticipant[],
): string | null {
  const started = participants.find(
    (participant) =>
      participant.screenSharing &&
      !participant.isLocal &&
      !previousSharingIds.includes(participant.identity),
  );
  if (started) return started.identity;
  const pinnedStopped =
    pinned !== null &&
    previousSharingIds.includes(pinned) &&
    !participants.some(
      (participant) =>
        participant.identity === pinned && participant.screenSharing,
    );
  return pinnedStopped ? null : pinned;
}

export interface VoiceSidebarPreview<T> {
  shown: T[];
  hidden: T[];
}

export function voiceSidebarPreview<T extends { speaking?: boolean }>(
  participants: readonly T[],
  limit: number,
): VoiceSidebarPreview<T> {
  const ordered = [
    ...participants.filter((participant) => participant.speaking),
    ...participants.filter((participant) => !participant.speaking),
  ];
  return { shown: ordered.slice(0, limit), hidden: ordered.slice(limit) };
}

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

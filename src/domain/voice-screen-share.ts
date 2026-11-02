/**
 * Pantalla compartida desde el celular (solo el APK de Android).
 */

import type { VoiceParticipant } from "./voice";

export const SCREEN_SHARE_IDENTITY_SUFFIX = ":screen";

export interface VoiceScreenShareToken {
  identity: string;
  token: string;
  url: string;
}

export type VoiceScreenShareTokenResult =
  { ok: true; token: VoiceScreenShareToken } | { ok: false; message: string };

export function screenShareIdentityOf(identity: string): string {
  return `${identity}${SCREEN_SHARE_IDENTITY_SUFFIX}`;
}

export function ownerOfScreenShareIdentity(identity: string): string | null {
  if (!identity.endsWith(SCREEN_SHARE_IDENTITY_SUFFIX)) return null;
  const owner = identity.slice(0, -SCREEN_SHARE_IDENTITY_SUFFIX.length);
  return owner === "" ? null : owner;
}

export function isScreenShareIdentity(identity: string): boolean {
  return ownerOfScreenShareIdentity(identity) !== null;
}

export function mergeScreenShareCompanions(
  participants: readonly VoiceParticipant[],
): VoiceParticipant[] {
  const sharingOwners = new Set(
    participants
      .filter((participant) => participant.screenSharing)
      .map((participant) => ownerOfScreenShareIdentity(participant.identity))
      .filter((owner): owner is string => owner !== null),
  );
  return participants
    .filter((participant) => !isScreenShareIdentity(participant.identity))
    .map((participant) =>
      sharingOwners.has(participant.identity) && !participant.screenSharing
        ? { ...participant, screenSharing: true }
        : participant,
    );
}

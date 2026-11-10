import type { VoicePresenceByChannel, VoiceParticipant } from "./voice";
import type { VoiceParticipantProfile } from "./voice-bridge";
import { ownerOfScreenShareIdentity } from "./voice-screen-share";

function personOf(identity: string): string {
  return ownerOfScreenShareIdentity(identity) ?? identity;
}

export function voiceProfileIds(
  presence: VoicePresenceByChannel,
  live: readonly VoiceParticipant[],
  ownId: string | null,
): string[] {
  const identities = [
    ...Object.values(presence).flatMap((participants) =>
      participants.map((participant) => participant.participant_id),
    ),
    ...live.map((participant) => participant.identity),
  ];
  const ids = new Set(identities.map(personOf));
  if (ownId !== null) ids.delete(ownId);
  return [...ids];
}

export function voiceAvatarOf(
  profiles: readonly VoiceParticipantProfile[],
  identity: string,
): string | null {
  const person = personOf(identity);
  return (
    profiles.find((profile) => profile.identity === person)?.avatarUrl ?? null
  );
}

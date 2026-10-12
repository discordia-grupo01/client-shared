import type { Member } from "./member";

/** Duracion elegible al silenciar (#60). `ms` se suma a "ahora" para `until_at`. */
export interface MuteDuration {
  id: string;
  label: string;
  ms: number;
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Las mismas que ofrece Discord para un timeout. */
export const MUTE_DURATIONS: readonly MuteDuration[] = [
  { id: "1m", label: "1 minuto", ms: MINUTE },
  { id: "5m", label: "5 minutos", ms: 5 * MINUTE },
  { id: "10m", label: "10 minutos", ms: 10 * MINUTE },
  { id: "1h", label: "1 hora", ms: HOUR },
  { id: "1d", label: "1 día", ms: DAY },
  { id: "1w", label: "1 semana", ms: 7 * DAY },
];

/** `until_at` para `POST /servers/:id/mutes`: ahora + la duracion, en ISO UTC. */
export function muteUntilFrom(
  duration: MuteDuration,
  now: Date = new Date(),
): string {
  return new Date(now.getTime() + duration.ms).toISOString();
}

/**
 * `true` si el miembro tiene un silencio que todavia no vencio. El back ya
 * manda `null` si vencio, pero la lista puede llevar un rato abierta.
 */
export function isMemberMuted(
  member: Pick<Member, "muted_until">,
  now: Date = new Date(),
): boolean {
  if (!member.muted_until) return false;
  return new Date(member.muted_until).getTime() > now.getTime();
}

export type KickMemberResult = { ok: true } | { ok: false; message: string };
export type MuteMemberResult = { ok: true } | { ok: false; message: string };
export type UnmuteMemberResult = { ok: true } | { ok: false; message: string };

/** Miembros que tienen un rol (`GET /roles/:id/members`), todas las paginas. */
export type ListRoleMembersResult =
  | { ok: true; members: Member[]; total: number }
  | { ok: false; message: string };

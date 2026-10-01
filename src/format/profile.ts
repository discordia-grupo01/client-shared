import type { MemberProfile } from "../domain/member";
import type { PublicUser } from "../domain/user";
import { UNKNOWN_USER_NAME } from "../messages/ui";

/** Lo minimo que las listas necesitan de un usuario: nombre y si tiene foto. */
export type ProfileSummary = Pick<MemberProfile, "name" | "avatar_url">;

/** Perfiles pedidos en paralelo: el back no tiene endpoint batch. */
export const PROFILE_FALLBACK_CONCURRENCY = 6;

/**
 * El nombre del perfil, o "Usuario desconocido" si el back todavia no lo
 * replico (`profile: null`).
 */
export function displayNameOf(
  profile: ProfileSummary | null | undefined,
): string {
  return profile?.name ?? UNKNOWN_USER_NAME;
}

/** El `MemberProfile` que el back adjunta a miembros y baneados, desde `GET /users/:id`. */
export function memberProfileOf(user: PublicUser): MemberProfile {
  return {
    name: user.name,
    avatar_url: user.avatar_url,
    description: user.description,
    status_text: user.status_text,
    status_emoji: user.status_emoji,
  };
}

/**
 * Ids de los usuarios sin perfil que todavia no se pidieron, sin repetir.
 * El back adjunta el perfil a cada miembro y baneado: este es el unico caso en
 * el que hace falta `GET /users/:id` (el perfil todavia no se replico).
 */
export function userIdsMissingProfile(
  users: readonly { user_id: string; profile?: MemberProfile | null }[],
  alreadyRequested: ReadonlySet<string>,
): string[] {
  const ids = new Set<string>();
  for (const user of users) {
    if (!user.profile && !alreadyRequested.has(user.user_id)) {
      ids.add(user.user_id);
    }
  }
  return [...ids];
}

/** Completa los `profile` faltantes con los ya pedidos, sin tocar los que vinieron del back. */
export function withFetchedProfiles<
  T extends { user_id: string; profile?: MemberProfile | null },
>(users: readonly T[], fetched: Readonly<Record<string, MemberProfile>>): T[] {
  return users.map((user) =>
    user.profile || !fetched[user.user_id]
      ? user
      : { ...user, profile: fetched[user.user_id] },
  );
}

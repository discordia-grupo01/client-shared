import { BAN_NO_REASON } from "../messages/ui";
import type { Ban } from "../domain/ban";
import type { Member } from "../domain/member";

import type { UserListItem } from "./user-list";

/**
 * Miembros que se pueden ofrecer para banear: todos menos el propietario y
 * uno mismo. La jerarquia de roles no se evalua aca (el front no conoce la
 * posicion de los roles): si el objetivo tiene un rol igual o superior, el
 * back rechaza el baneo y el modal lo muestra.
 */
export function eligibleBanCandidates(
  members: readonly Member[],
  ownerId: string,
  currentUserId: string | null,
): Member[] {
  return members.filter(
    (member) => member.user_id !== ownerId && member.user_id !== currentUserId,
  );
}

export function banListItems(bans: readonly Ban[]): UserListItem[] {
  return bans.map((ban) => ({
    userId: ban.user_id,
    profile: ban.profile,
    subtitle: ban.reason || BAN_NO_REASON,
  }));
}

export function memberListItems(members: readonly Member[]): UserListItem[] {
  return members.map((member) => ({
    userId: member.user_id,
    profile: member.profile,
  }));
}

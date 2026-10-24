import type { Member } from "../domain/member";
import type { MessageAuthor } from "../domain/message";
import { highestRoleOf, type Role } from "../domain/role";
import type { User } from "../domain/user";
import { displayNameOf } from "./profile";

/** Autor; sin `role` no tiene etiqueta ni color de rol. */
export function messageAuthorOf(
  id: string,
  name: string,
  avatarUrl: string | null,
  role: Pick<Role, "name" | "color"> | null = null,
): MessageAuthor {
  return {
    id,
    name,
    avatarUrl,
    roleName: role?.name ?? null,
    roleColor: role?.color ?? null,
  };
}

/**
 * El usuario logueado como autor de sus mensajes. `avatarUrl` lo resuelve cada
 * app (en web pasa por el BFF, en mobile es una URL absoluta).
 */
export function authorFromUser(
  user: Pick<User, "id" | "name">,
  avatarUrl: string | null,
): MessageAuthor {
  return messageAuthorOf(user.id, user.name, avatarUrl);
}

/**
 * Un miembro del servidor como autor ("Usuario desconocido" si no tiene
 * perfil). Con `serverRoles` toma nombre y color de su rol mas alto.
 */
export function authorFromMember(
  member: Pick<Member, "user_id" | "profile" | "role_ids">,
  avatarUrl: string | null,
  serverRoles: readonly Role[] = [],
): MessageAuthor {
  return messageAuthorOf(
    member.user_id,
    displayNameOf(member.profile),
    avatarUrl,
    highestRoleOf(member.role_ids, serverRoles),
  );
}

import type { Member } from "../domain/member";
import type { MessageAuthor } from "../domain/message";
import type { User } from "../domain/user";
import { displayNameOf } from "./profile";

/**
 * Autor sin etiqueta ni color de rol.
 *
 * TODO: los roles del miembro no se cruzan todavia. Cuando el back devuelva
 * los mensajes con su autor, se completan aca para todos por igual.
 */
export function messageAuthorOf(
  id: string,
  name: string,
  avatarUrl: string | null,
): MessageAuthor {
  return { id, name, avatarUrl, roleName: null, roleColor: null };
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

/** Un miembro del servidor como autor ("Usuario desconocido" si no tiene perfil). */
export function authorFromMember(
  member: Pick<Member, "user_id" | "profile">,
  avatarUrl: string | null,
): MessageAuthor {
  return messageAuthorOf(
    member.user_id,
    displayNameOf(member.profile),
    avatarUrl,
  );
}

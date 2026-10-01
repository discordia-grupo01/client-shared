import type { MemberProfile } from "../domain/member";

import { matchesSearch } from "./search";
import { displayNameOf } from "./profile";

/** Una fila de las listas de moderacion: quien es y, si hace falta, un detalle. */
export interface UserListItem {
  userId: string;
  /** `null` si el back todavia no replico el perfil de este usuario. */
  profile: MemberProfile | null | undefined;
  /** Segunda linea: el motivo del baneo, o nada en la lista de miembros. */
  subtitle?: string;
}

/** La busqueda es por nombre de usuario y se hace en el front sobre los perfiles ya resueltos. */
export function filterByDisplayName(
  items: readonly UserListItem[],
  query: string,
): UserListItem[] {
  return items.filter((item) =>
    matchesSearch(displayNameOf(item.profile), query),
  );
}

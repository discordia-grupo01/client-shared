import type { MessageAuthor } from "../domain/message";
import type { Role } from "../domain/role";

/** Color a usar para un `@usuario` o `@rol` mencionado, o `null` si no se reconoce. */
export type MentionResolver = (name: string) => { color: string } | null;

/**
 * Arma el resolver de `@usuario`/`@rol` -> color para `MessageContent`: el
 * nombre de un miembro se colorea con el de su rol mostrado, el nombre de un
 * rol del servidor con el color propio del rol. No valida que la mencion
 * exista de verdad (el back todavia no resuelve menciones); si no matchea
 * ningun nombre conocido, `MessageContent` cae al resaltado generico.
 */
export function buildMentionResolver(
  authors: Record<string, MessageAuthor>,
  roles: readonly Role[],
): MentionResolver {
  const colorByUserName = new Map<string, string>();
  for (const author of Object.values(authors)) {
    if (author.roleColor) {
      colorByUserName.set(author.name.toLowerCase(), author.roleColor);
    }
  }

  const colorByRoleName = new Map<string, string>();
  for (const role of roles) {
    colorByRoleName.set(role.name.toLowerCase(), role.color);
  }

  return (name) => {
    const key = name.toLowerCase();
    const color = colorByUserName.get(key) ?? colorByRoleName.get(key);
    return color ? { color } : null;
  };
}

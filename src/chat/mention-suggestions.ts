import type { MessageAuthor } from "../domain/message";
import type { Role } from "../domain/role";
import { EVERYONE_MENTION, type PickedMention } from "../format/mention-tokens";
import { matchesSearch, normalizeSearchText } from "../format/search";

/** Lo que se muestra en el selector que aparece al escribir `@`. */
export type MentionCandidate =
  | { kind: "user"; id: string; name: string; avatarUrl: string | null }
  | { kind: "role"; id: string; name: string; color: string }
  | { kind: "everyone" };

/** El `@algo` que se esta escribiendo: lo que va despues de la `@` y el tramo que ocupa en el texto. */
export interface MentionQuery {
  query: string;
  /** Posicion de la `@`. */
  start: number;
  /** Posicion del cursor (donde termina lo escrito). */
  end: number;
}

/** Cantidad maxima de miembros que muestra el selector. */
export const MENTION_SUGGESTIONS_LIMIT = 8;

/** Despues de tantos caracteres sin elegir, se asume que no es una mencion. */
const MAX_QUERY_LENGTH = 25;

/**
 * Detecta si el cursor esta escribiendo una mencion: una `@` al principio del
 * texto o despues de un espacio, seguida de algo que no empieza con espacio ni
 * salta de linea. Los nombres pueden tener espacios ("Beto Gomez"), por eso lo
 * escrito puede incluirlos. Devuelve `null` si no hay una mencion en curso.
 */
export function activeMentionQuery(
  text: string,
  cursor: number,
): MentionQuery | null {
  const before = text.slice(0, cursor);
  const start = before.lastIndexOf("@");
  if (start === -1) return null;
  if (start > 0 && !/\s/.test(before[start - 1])) return null;

  const query = before.slice(start + 1);
  if (query.length > MAX_QUERY_LENGTH) return null;
  if (/^\s/.test(query) || query.includes("\n")) return null;
  return { query, start, end: cursor };
}

export interface MentionSources {
  members: readonly MessageAuthor[];
  roles: readonly Pick<Role, "id" | "name" | "color" | "is_everyone">[];
  /** Tiene `MENTION_EVERYONE`: sin el, el selector no ofrece roles ni `@everyone`. */
  canMentionEveryone: boolean;
}

export function suggestMentions(
  query: string,
  { members, roles, canMentionEveryone }: MentionSources,
  memberLimit: number = MENTION_SUGGESTIONS_LIMIT,
): MentionCandidate[] {
  const needle = normalizeSearchText(query);

  const matchingMembers = members
    .filter((member) => matchesSearch(member.name, query))
    .sort(
      (a, b) =>
        startsWithRank(a.name, needle) - startsWithRank(b.name, needle) ||
        a.name.localeCompare(b.name),
    )
    .slice(0, memberLimit)
    .map((member): MentionCandidate => ({
      kind: "user",
      id: member.id,
      name: member.name,
      avatarUrl: member.avatarUrl,
    }));

  if (!canMentionEveryone) return matchingMembers;

  const matchingRoles = roles
    .filter((role) => !role.is_everyone && matchesSearch(role.name, query))
    .map((role): MentionCandidate => ({
      kind: "role",
      id: role.id,
      name: role.name,
      color: role.color,
    }));

  const everyone: MentionCandidate[] = normalizeSearchText(
    EVERYONE_MENTION.slice(1),
  ).startsWith(needle)
    ? [{ kind: "everyone" }]
    : [];

  return [...matchingMembers, ...matchingRoles, ...everyone];
}

function startsWithRank(name: string, needle: string): number {
  return normalizeSearchText(name).startsWith(needle) ? 0 : 1;
}

export interface AppliedMention {
  text: string;
  cursor: number;
  /** `undefined` para `@everyone`, que no necesita id. */
  picked?: PickedMention;
}

export function applyMentionCandidate(
  text: string,
  active: MentionQuery,
  candidate: MentionCandidate,
): AppliedMention {
  const label = candidate.kind === "everyone" ? "everyone" : candidate.name;
  const inserted = `@${label} `;
  const next = text.slice(0, active.start) + inserted + text.slice(active.end);
  return {
    text: next,
    cursor: active.start + inserted.length,
    picked:
      candidate.kind === "everyone"
        ? undefined
        : { kind: candidate.kind, id: candidate.id, label },
  };
}

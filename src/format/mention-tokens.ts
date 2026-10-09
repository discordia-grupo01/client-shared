export const USER_TOKEN_SOURCE = "<@([A-Za-z0-9_-]{1,64})>";
export const ROLE_TOKEN_SOURCE =
  "<@&([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})>";

export const EVERYONE_MENTION = "@everyone";

export type MentionKind = "user" | "role";

export interface PickedMention {
  kind: MentionKind;
  id: string;
  label: string;
}

/** `@` seguido de un caracter que no sea de nombre ni de otra mencion, o el principio del texto. */
const BEFORE_MENTION = "(^|[^\\w@&<])";
const AFTER_MENTION = "(?![\\wÀ-ſ-])";

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function mentionToken(kind: MentionKind, id: string): string {
  return kind === "role" ? `<@&${id.toLowerCase()}>` : `<@${id}>`;
}

/** Un tramo del borrador que corresponde a una mencion elegida del selector. */
export interface PickedRange {
  start: number;
  /** Posicion donde termina (exclusiva): incluye la `@` y el nombre. */
  end: number;
  mention: PickedMention;
}

/**
 * Donde esta cada mencion elegida dentro del borrador. Recorre el texto de
 * izquierda a derecha y, si dos elegidos tienen el mismo nombre, se asignan en
 * orden. Una mencion cuyo nombre se edito ya no coincide y no figura.
 */
export function matchPickedMentions(
  draft: string,
  picked: readonly PickedMention[],
): PickedRange[] {
  const labels = [...new Set(picked.map((mention) => mention.label))]
    .filter((label) => label !== "")
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp);
  if (labels.length === 0) return [];

  const pending = [...picked];
  const pattern = new RegExp(
    `${BEFORE_MENTION}@(${labels.join("|")})${AFTER_MENTION}`,
    "g",
  );

  const ranges: PickedRange[] = [];
  for (const match of draft.matchAll(pattern)) {
    const [whole, before, label] = match;
    const index = pending.findIndex((mention) => mention.label === label);
    if (index === -1) continue;
    const [mention] = pending.splice(index, 1);
    const start = (match.index ?? 0) + before.length;
    ranges.push({ start, end: start + whole.length - before.length, mention });
  }
  return ranges;
}

/**
 * Pasa el borrador visible (`Hola @Beto`) al texto que se manda
 * (`Hola <@idBeto>`). Solo convierte lo que la persona eligio del selector: un
 * `@Beto` escrito a mano, o uno cuyo nombre se edito, queda como texto.
 */
export function encodeMentions(
  draft: string,
  picked: readonly PickedMention[],
): string {
  let result = "";
  let cursor = 0;
  for (const { start, end, mention } of matchPickedMentions(draft, picked)) {
    result +=
      draft.slice(cursor, start) + mentionToken(mention.kind, mention.id);
    cursor = end;
  }
  return result + draft.slice(cursor);
}

const TOKEN_PATTERN = new RegExp(
  `${USER_TOKEN_SOURCE}|${ROLE_TOKEN_SOURCE}`,
  "g",
);

export function decodeMentions(
  content: string,
  nameOf: (kind: MentionKind, id: string) => string | null,
): { text: string; picked: PickedMention[] } {
  const picked: PickedMention[] = [];
  const text = content.replace(
    TOKEN_PATTERN,
    (match, userId: string | undefined, roleId: string | undefined) => {
      const kind: MentionKind = roleId ? "role" : "user";
      const id = roleId ?? userId ?? "";
      const name = nameOf(kind, id);
      if (!name) return match;
      picked.push({ kind, id, label: name });
      return `@${name}`;
    },
  );
  return { text, picked };
}

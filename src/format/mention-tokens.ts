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

export function encodeMentions(
  draft: string,
  picked: readonly PickedMention[],
): string {
  if (picked.length === 0) return draft;

  const labels = [...new Set(picked.map((mention) => mention.label))]
    .filter((label) => label !== "")
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp);
  if (labels.length === 0) return draft;

  const pending = [...picked];
  const pattern = new RegExp(
    `${BEFORE_MENTION}@(${labels.join("|")})${AFTER_MENTION}`,
    "g",
  );

  return draft.replace(pattern, (match, before: string, label: string) => {
    const index = pending.findIndex((mention) => mention.label === label);
    if (index === -1) return match;
    const [mention] = pending.splice(index, 1);
    return `${before}${mentionToken(mention.kind, mention.id)}`;
  });
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

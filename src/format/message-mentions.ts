import type { MessageAuthor, Message } from "../domain/message";
import type { Role } from "../domain/role";
import type { MessageToken } from "./message-content";
import type { MentionKind } from "./mention-tokens";

export interface ResolvedMention {
  name: string;
  color: string | null;
}

export type MentionResolver = (
  kind: MentionKind,
  id: string,
) => ResolvedMention | null;

export function buildMentionResolver(
  authors: Readonly<Record<string, MessageAuthor>>,
  roles: readonly Pick<Role, "id" | "name" | "color">[],
): MentionResolver {
  const roleById = new Map(roles.map((role) => [role.id.toLowerCase(), role]));

  return (kind, id) => {
    if (kind === "user") {
      const author = authors[id];
      return author ? { name: author.name, color: author.roleColor } : null;
    }
    const role = roleById.get(id.toLowerCase());
    return role ? { name: role.name, color: role.color } : null;
  };
}

export type MessageMentions = Pick<
  Message,
  "mentions" | "mention_roles" | "mention_everyone"
>;

export function isActiveMention(
  token: MessageToken,
  message: MessageMentions,
): boolean {
  switch (token.kind) {
    case "user":
      return message.mentions?.includes(token.id) ?? false;
    case "role":
      return message.mention_roles?.includes(token.id.toLowerCase()) ?? false;
    case "everyone":
      return message.mention_everyone === true;
    default:
      return false;
  }
}

export function mentionsPerson(
  message: MessageMentions,
  userId: string,
  roleIds: readonly string[],
): boolean {
  if (message.mention_everyone) return true;
  if (message.mentions?.includes(userId)) return true;
  const mentionedRoles = message.mention_roles ?? [];
  return roleIds.some((roleId) =>
    mentionedRoles.includes(roleId.toLowerCase()),
  );
}

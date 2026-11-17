/**
 * Emojis personalizados usados en el chat. En el texto de un mensaje y en una
 * reaccion se escriben como `<:nombre:id>`, o `<a:nombre:id>` si son animados,
 * y el id es el UUID del emoji.
 */

import type { ServerEmoji } from "./emoji";

const UUID_SOURCE =
  "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

export const CUSTOM_EMOJI_TOKEN_SOURCE = `<(a?):([A-Za-z0-9_]{2,32}):(${UUID_SOURCE})>`;

const CUSTOM_EMOJI_TOKEN = new RegExp(CUSTOM_EMOJI_TOKEN_SOURCE, "g");
const WHOLE_CUSTOM_EMOJI_TOKEN = new RegExp(`^${CUSTOM_EMOJI_TOKEN_SOURCE}$`);

export interface CustomEmojiRef {
  id: string;
  name: string;
  animated: boolean;
}

export interface CustomEmojiToken extends CustomEmojiRef {
  text: string;
}

export interface CustomEmoji extends CustomEmojiRef {
  server_id: string;
  image_url: string;
  deleted: boolean;
}

export function customEmojiToken(emoji: CustomEmojiRef): string {
  return `<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>`;
}

export function parseCustomEmojiTokens(text: string): CustomEmojiToken[] {
  const tokens: CustomEmojiToken[] = [];
  const seen = new Set<string>();

  for (const match of text.matchAll(CUSTOM_EMOJI_TOKEN)) {
    const [whole, animated, name, id] = match;
    if (seen.has(whole)) continue;
    seen.add(whole);
    tokens.push({ text: whole, name, id, animated: animated === "a" });
  }
  return tokens;
}

export function customEmojiIdsIn(text: string): string[] {
  return parseCustomEmojiTokens(text).map((token) => token.id);
}

export function isCustomEmojiToken(text: string): boolean {
  return WHOLE_CUSTOM_EMOJI_TOKEN.test(text);
}

export type CustomEmojiPremiumReason = "animated" | "other-server";

export function premiumReasonForCustomEmoji(
  emoji: Pick<ServerEmoji, "animated" | "server_id">,
  serverId: string | null,
): CustomEmojiPremiumReason | null {
  if (emoji.server_id !== serverId) return "other-server";
  return emoji.animated ? "animated" : null;
}

export function needsPremiumForCustomEmoji(
  emoji: Pick<ServerEmoji, "animated" | "server_id">,
  serverId: string | null,
): boolean {
  return premiumReasonForCustomEmoji(emoji, serverId) !== null;
}

export interface CustomEmojiUse {
  emoji: Pick<ServerEmoji, "animated" | "server_id">;
  serverId: string | null;
  isPremium: boolean;
}

export function canUseCustomEmoji({
  emoji,
  serverId,
  isPremium,
}: CustomEmojiUse): boolean {
  return isPremium || !needsPremiumForCustomEmoji(emoji, serverId);
}

/**
 * Emojis personalizados mientras se escribe. En el cuadro de texto se ve
 * `:mate:`, que es como se nombran, y recien al enviar se convierte en el token
 * `<:mate:id>` que entiende `messaging`
 */

import { customEmojiToken, type CustomEmojiRef } from "../domain/custom-emoji";

import {
  matchPickedMentions,
  mentionToken,
  overlapsAny,
  type PickedMention,
  type TextSpan,
} from "./mention-tokens";

export function customEmojiDraftText(emoji: Pick<CustomEmojiRef, "name">) {
  return `:${emoji.name}:`;
}

interface EmojiMatch {
  start: number;
  end: number;
  emoji: CustomEmojiRef;
}

export function matchPickedEmojis(
  draft: string,
  picked: readonly CustomEmojiRef[],
  ignored: readonly TextSpan[] = [],
): EmojiMatch[] {
  const matches: EmojiMatch[] = [];

  for (const emoji of picked) {
    const text = customEmojiDraftText(emoji);
    let from = 0;
    for (;;) {
      const start = draft.indexOf(text, from);
      if (start === -1) break;
      const end = start + text.length;
      from = end;
      if (overlapsAny(start, end, ignored)) continue;
      if (matches.some((match) => start < match.end && end > match.start)) {
        continue;
      }
      matches.push({ start, end, emoji });
    }
  }

  return matches.sort((a, b) => a.start - b.start);
}

export function encodeDraft(
  draft: string,
  mentions: readonly PickedMention[],
  emojis: readonly CustomEmojiRef[],
  ignored: readonly TextSpan[] = [],
): string {
  const replacements = [
    ...matchPickedMentions(draft, mentions, ignored).map(
      ({ start, end, mention }) => ({
        start,
        end,
        text: mentionToken(mention.kind, mention.id),
      }),
    ),
    ...matchPickedEmojis(draft, emojis, ignored).map(
      ({ start, end, emoji }) => ({
        start,
        end,
        text: customEmojiToken(emoji),
      }),
    ),
  ].sort((a, b) => a.start - b.start);

  let result = "";
  let cursor = 0;
  for (const { start, end, text } of replacements) {
    if (start < cursor) continue;
    result += draft.slice(cursor, start) + text;
    cursor = end;
  }
  return result + draft.slice(cursor);
}

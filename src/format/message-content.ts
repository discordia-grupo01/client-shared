import { CUSTOM_EMOJI_TOKEN_SOURCE } from "../domain/custom-emoji";

import {
  ROLE_TOKEN_SOURCE,
  USER_TOKEN_SOURCE,
  EVERYONE_MENTION,
} from "./mention-tokens";

/**
 * Un pedazo del texto de un mensaje. Las menciones (`<@id>`, `<@&id>`,
 * `@everyone`) y las referencias a canales (`#canal`) se pintan resaltadas, los
 * emojis personalizados (`<:nombre:id>`) se dibujan con su imagen, y el resto
 * va tal cual. `value` es siempre el texto original del pedazo.
 */
export type MessageToken =
  | { kind: "text"; value: string }
  | { kind: "user"; value: string; id: string }
  | { kind: "role"; value: string; id: string }
  | { kind: "everyone"; value: string }
  | { kind: "channel"; value: string }
  | {
      kind: "custom_emoji";
      value: string;
      id: string;
      name: string;
      animated: boolean;
    };

/**
 * Cada alternativa, en orden de grupo: rol (1), usuario (2), `@everyone` (3 y
 * 4: el caracter anterior y la mencion), `#canal` (5 y 6) y el emoji
 * personalizado (7, 8 y 9: la marca de animado, el nombre y el id).
 *
 * `@everyone` no puede ir pegado a una letra, a otro `@`, `&` o `<` (igual que
 * en `messaging`). `#canal` va al principio del texto o despues de un espacio.
 * Las letras acentuadas van como rango y no con `\p{L}`: asi no dependemos del
 * soporte de Unicode property escapes en Hermes.
 */
const TOKEN_PATTERN = new RegExp(
  [
    ROLE_TOKEN_SOURCE,
    USER_TOKEN_SOURCE,
    `(^|[^\\w@&<])(${EVERYONE_MENTION})(?![\\w-])`,
    "(^|\\s)#([\\wÀ-ſ.-]*[\\wÀ-ſ-])",
    CUSTOM_EMOJI_TOKEN_SOURCE,
  ].join("|"),
  "g",
);

/**
 * Parte el texto en `MessageToken`s. No valida que la mencion o el canal
 * existan ni que valgan: eso lo decide quien dibuja con los campos `mentions`,
 * `mention_roles` y `mention_everyone` del mensaje.
 */
export function tokenizeMessageContent(content: string): MessageToken[] {
  const tokens: MessageToken[] = [];
  let cursor = 0;

  const push = (token: MessageToken, start: number, end: number) => {
    if (start > cursor) {
      tokens.push({ kind: "text", value: content.slice(cursor, start) });
    }
    tokens.push(token);
    cursor = end;
  };

  for (const match of content.matchAll(TOKEN_PATTERN)) {
    const [
      whole,
      roleId,
      userId,
      everyoneLead,
      everyone,
      channelLead,
      channel,
      emojiAnimated,
      emojiName,
      emojiId,
    ] = match;
    const index = match.index ?? 0;

    if (roleId) {
      push(
        { kind: "role", value: whole, id: roleId },
        index,
        index + whole.length,
      );
    } else if (userId) {
      push(
        { kind: "user", value: whole, id: userId },
        index,
        index + whole.length,
      );
    } else if (everyone) {
      const start = index + (everyoneLead?.length ?? 0);
      push(
        { kind: "everyone", value: everyone },
        start,
        start + everyone.length,
      );
    } else if (channel) {
      const start = index + (channelLead?.length ?? 0);
      push(
        { kind: "channel", value: `#${channel}` },
        start,
        index + whole.length,
      );
    } else if (emojiId) {
      push(
        {
          kind: "custom_emoji",
          value: whole,
          id: emojiId,
          name: emojiName,
          animated: emojiAnimated === "a",
        },
        index,
        index + whole.length,
      );
    }
  }

  if (cursor < content.length) {
    tokens.push({ kind: "text", value: content.slice(cursor) });
  }
  return tokens;
}

const KEYCAP = /[#*0-9]️?⃣/g;

const EMOJI_RANGES: readonly (readonly [number, number])[] = [
  [0x1f000, 0x1faff],
  [0x2600, 0x27bf],
  [0x2b00, 0x2bff],
  [0x200d, 0x200d],
  [0xfe00, 0xfe0f],
  [0x203c, 0x203c],
  [0x2049, 0x2049],
  [0x3030, 0x3030],
  [0x303d, 0x303d],
  [0x3297, 0x3299],
];

function isEmojiCodePoint(character: string): boolean {
  const code = character.codePointAt(0);
  if (code === undefined) return false;
  return EMOJI_RANGES.some(([from, to]) => code >= from && code <= to);
}

export function isEmojiOnlyContent(content: string): boolean {
  let hasEmoji = false;

  for (const token of tokenizeMessageContent(content)) {
    if (token.kind === "custom_emoji") {
      hasEmoji = true;
      continue;
    }
    if (token.kind !== "text") return false;

    for (const character of token.value.replace(KEYCAP, "")) {
      if (/\s/.test(character)) continue;
      if (!isEmojiCodePoint(character)) return false;
      hasEmoji = true;
    }
    if (KEYCAP.test(token.value)) hasEmoji = true;
    KEYCAP.lastIndex = 0;
  }

  return hasEmoji;
}

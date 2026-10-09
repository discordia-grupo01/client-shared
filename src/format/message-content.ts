import {
  ROLE_TOKEN_SOURCE,
  USER_TOKEN_SOURCE,
  EVERYONE_MENTION,
} from "./mention-tokens";

/**
 * Un pedazo del texto de un mensaje. Las menciones (`<@id>`, `<@&id>`,
 * `@everyone`) y las referencias a canales (`#canal`) se pintan resaltadas; el
 * resto va tal cual. `value` es siempre el texto original del pedazo.
 */
export type MessageToken =
  | { kind: "text"; value: string }
  | { kind: "user"; value: string; id: string }
  | { kind: "role"; value: string; id: string }
  | { kind: "everyone"; value: string }
  | { kind: "channel"; value: string };

/**
 * Cada alternativa, en orden de grupo: rol (1), usuario (2), `@everyone` (3 y
 * 4: el caracter anterior y la mencion) y `#canal` (5 y 6).
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
    }
  }

  if (cursor < content.length) {
    tokens.push({ kind: "text", value: content.slice(cursor) });
  }
  return tokens;
}

/**
 * Un pedazo del texto de un mensaje. Las menciones (`@usuario`) y las
 * referencias a canales (`#canal`) se pintan resaltadas; el resto va tal cual.
 */
export type MessageToken =
  | { kind: "text"; value: string }
  | { kind: "mention"; value: string }
  | { kind: "channel"; value: string };

/**
 * `@` o `#` al principio del texto o despues de un espacio, seguido de letras,
 * numeros, `_`, `.` o `-`. Asi un mail (`a@b.com`) no se toma como mencion.
 * El `.` final se descarta para que "@Ana." no incluya el punto.
 *
 * Las letras acentuadas van como rango y no con `\p{L}`: asi no dependemos
 * del soporte de Unicode property escapes en Hermes.
 */
const TOKEN_PATTERN = /(^|\s)([@#])([\wÀ-ſ.-]*[\wÀ-ſ-])/g;

/**
 * Parte el texto en `MessageToken`s. No valida que el usuario o el canal
 * existan: el back todavia no resuelve menciones.
 */
export function tokenizeMessageContent(content: string): MessageToken[] {
  const tokens: MessageToken[] = [];
  let cursor = 0;

  for (const match of content.matchAll(TOKEN_PATTERN)) {
    const [, leading, sigil, name] = match;
    const start = (match.index ?? 0) + leading.length;
    if (start > cursor) {
      tokens.push({ kind: "text", value: content.slice(cursor, start) });
    }
    tokens.push({
      kind: sigil === "@" ? "mention" : "channel",
      value: `${sigil}${name}`,
    });
    cursor = start + sigil.length + name.length;
  }

  if (cursor < content.length) {
    tokens.push({ kind: "text", value: content.slice(cursor) });
  }
  return tokens;
}

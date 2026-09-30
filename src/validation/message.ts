import { MAX_MESSAGE_LENGTH } from "../constants/limits";

/** Devuelve el error a mostrar, o `undefined` si el mensaje se puede enviar. */
export function validateMessageContent(content: string): string | undefined {
  if (!content.trim()) return "Escribí un mensaje.";
  if ([...content].length > MAX_MESSAGE_LENGTH) {
    return `El mensaje no puede superar los ${MAX_MESSAGE_LENGTH} caracteres.`;
  }
  return undefined;
}

/** `@everyone` o `@here` al principio del texto o despues de un espacio. */
const MENTION_EVERYONE_PATTERN = /(^|\s)@(everyone|here)(?=\s|$)/;

/**
 * Gatea `@everyone`/`@here` por permiso al componer el mensaje: sin
 * `MENTION_EVERYONE` no se puede enviar. Mencionar un usuario o un rol
 * puntual queda abierto a cualquier miembro, no pasa por aca.
 */
export function validateMentionEveryone(
  content: string,
  canMentionEveryone: boolean,
): string | undefined {
  if (canMentionEveryone) return undefined;
  if (!MENTION_EVERYONE_PATTERN.test(content)) return undefined;
  return "No tenés permiso para mencionar a todo el servidor.";
}

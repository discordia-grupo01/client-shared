import { MAX_MESSAGE_LENGTH } from "../constants/limits";

/** Devuelve el error a mostrar, o `undefined` si el mensaje se puede enviar. */
export function validateMessageContent(content: string): string | undefined {
  if (!content.trim()) return "Escribí un mensaje.";
  if ([...content].length > MAX_MESSAGE_LENGTH) {
    return `El mensaje no puede superar los ${MAX_MESSAGE_LENGTH} caracteres.`;
  }
  return undefined;
}

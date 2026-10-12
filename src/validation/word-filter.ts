import { BANNED_WORD_MAX_LENGTH, BANNED_WORDS_MAX } from "../constants/limits";
import { normalizeBannedWord } from "../domain/word-filter";

/**
 * Valida una palabra antes de sumarla a `words` (la lista actual). Mismas
 * reglas que `servers`; el back igual vuelve a validar al guardar.
 */
export function validateBannedWord(
  raw: string,
  words: readonly string[],
): string | undefined {
  const word = normalizeBannedWord(raw);
  if (word === "") return "Escribí una palabra o frase.";
  if ([...word].length > BANNED_WORD_MAX_LENGTH) {
    return `Cada palabra o frase puede tener hasta ${BANNED_WORD_MAX_LENGTH} caracteres.`;
  }
  if (words.includes(word)) return "Esa palabra ya está en la lista.";
  if (words.length >= BANNED_WORDS_MAX) {
    return `La lista puede tener hasta ${BANNED_WORDS_MAX} palabras.`;
  }
  return undefined;
}

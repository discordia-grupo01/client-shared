/**
 * Palabras prohibidas de un servidor (`/v1/servers/:id/banned-words`). Las
 * edita quien tiene `MANAGE_MESSAGES`; `messaging` rechaza los mensajes que
 * las contengan (sin distinguir mayusculas ni tildes, solo palabras enteras).
 */
export interface BannedWordsResponse {
  words: string[];
}

export type ListBannedWordsResult =
  { ok: true; words: string[] } | { ok: false; message: string };

export type SaveBannedWordsResult =
  { ok: true; words: string[] } | { ok: false; message: string };

/**
 * Igual que el back: minusculas y sin espacios de mas. Sirve para mostrar la
 * palabra como va a quedar guardada y para detectar repetidas antes de mandar.
 */
export function normalizeBannedWord(raw: string): string {
  return raw.trim().split(/\s+/).join(" ").toLowerCase();
}

/** Agrega `raw` al final si no estaba (ya normalizada). No muta `words`. */
export function addBannedWord(words: readonly string[], raw: string): string[] {
  const word = normalizeBannedWord(raw);
  return word === "" || words.includes(word) ? [...words] : [...words, word];
}

/** Saca `word` de la lista. No muta `words`. */
export function removeBannedWord(
  words: readonly string[],
  word: string,
): string[] {
  return words.filter((w) => w !== word);
}

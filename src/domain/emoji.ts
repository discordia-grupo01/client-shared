/**
 * Emojis personalizados de un servidor (`/v1/servers/:id/emojis`).
 *
 * La lista viene del mas viejo al mas nuevo y sin los borrados. El tope de
 * emojis NO se calcula en el front: llega en `max_emojis` porque depende de los
 * boosts del servidor (50, o 70 desde el nivel 1, ver `emojiSlotsFor` en
 * `constants/boost.ts`). Si el servidor baja de nivel conserva los emojis que
 * ya tiene, asi que `emojis.length` puede ser mayor que `max_emojis`.
 */

export interface ServerEmoji {
  id: string;
  server_id: string;
  name: string;
  /** `true` para los GIF: lo decide el back mirando el contenido del archivo. */
  animated: boolean;
  image_url: string;
  created_by: string;
  created_at: string;
}

export interface ServerEmojiPage {
  emojis: ServerEmoji[];
  max_emojis: number;
}

export function emojiSlotsLeft(page: ServerEmojiPage): number {
  return Math.max(0, page.max_emojis - page.emojis.length);
}

export function hasEmojiSlots(page: ServerEmojiPage): boolean {
  return emojiSlotsLeft(page) > 0;
}

export function emojiNameTaken(page: ServerEmojiPage, name: string): boolean {
  const target = name.trim().toLowerCase();
  if (target === "") return false;
  return page.emojis.some((emoji) => emoji.name.toLowerCase() === target);
}

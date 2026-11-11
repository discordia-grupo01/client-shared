/**
 * Limites de los adjuntos de un mensaje, replicados de
 * `messaging/lib/messaging/chat/attachment.ex`. El back reconoce el formato por
 * el contenido del archivo; el front solo puede mirar el tipo que reporta el
 * sistema, asi que el back sigue siendo la fuente de verdad.
 */
export const MAX_ATTACHMENT_MB = 10;
export const MAX_ATTACHMENT_BYTES = MAX_ATTACHMENT_MB * 1024 * 1024;
/** En canales de un servidor con nivel 2 de boosts, para todos los miembros. */
export const BOOSTED_MAX_ATTACHMENT_MB = 25;
export const BOOSTED_MAX_ATTACHMENT_BYTES =
  BOOSTED_MAX_ATTACHMENT_MB * 1024 * 1024;
export const PREMIUM_MAX_ATTACHMENT_MB = 50;
export const PREMIUM_MAX_ATTACHMENT_BYTES =
  PREMIUM_MAX_ATTACHMENT_MB * 1024 * 1024;

/** Adjuntos por mensaje. */
export const MAX_ATTACHMENTS_PER_MESSAGE = 5;

export const ALLOWED_ATTACHMENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export const PREMIUM_ATTACHMENT_TYPES = [
  ...ALLOWED_ATTACHMENT_TYPES,
  "image/gif",
] as const;

/** Valor para el atributo `accept` de un `<input type="file">`. */
export const ATTACHMENT_ACCEPT = ALLOWED_ATTACHMENT_TYPES.join(",");
export const PREMIUM_ATTACHMENT_ACCEPT = PREMIUM_ATTACHMENT_TYPES.join(",");

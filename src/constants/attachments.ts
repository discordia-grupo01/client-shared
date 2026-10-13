/**
 * Limites de los adjuntos de un mensaje, replicados de
 * `messaging/lib/messaging/chat/attachment.ex`. El back reconoce el formato por
 * el contenido del archivo; el front solo puede mirar el tipo que reporta el
 * sistema, asi que el back sigue siendo la fuente de verdad.
 */
export const MAX_ATTACHMENT_MB = 10;
export const MAX_ATTACHMENT_BYTES = MAX_ATTACHMENT_MB * 1024 * 1024;

/** Adjuntos por mensaje. */
export const MAX_ATTACHMENTS_PER_MESSAGE = 5;

export const ALLOWED_ATTACHMENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

/** Valor para el atributo `accept` de un `<input type="file">`. */
export const ATTACHMENT_ACCEPT = ALLOWED_ATTACHMENT_TYPES.join(",");

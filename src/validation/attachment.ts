import {
  ALLOWED_ATTACHMENT_TYPES,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENT_MB,
  MAX_ATTACHMENTS_PER_MESSAGE,
  PREMIUM_ATTACHMENT_TYPES,
  PREMIUM_MAX_ATTACHMENT_BYTES,
  PREMIUM_MAX_ATTACHMENT_MB,
} from "../constants/attachments";

export const ATTACHMENT_UNSUPPORTED_TYPE =
  "Formato no soportado. Solo se aceptan imágenes JPEG, PNG o WebP y archivos PDF (y GIF con Premium).";
export const ATTACHMENT_TOO_LARGE = `El archivo supera el tamaño máximo permitido (${MAX_ATTACHMENT_MB} MB, o ${PREMIUM_MAX_ATTACHMENT_MB} MB con Premium).`;
export const ATTACHMENT_EMPTY = "El archivo está vacío.";
export const ATTACHMENTS_LIMIT_REACHED = `Un mensaje puede tener hasta ${MAX_ATTACHMENTS_PER_MESSAGE} adjuntos.`;

/** Devuelve el error a mostrar, o `undefined` si el archivo se puede adjuntar. */
export function validateAttachment(
  file: {
    type: string;
    size: number;
  },
  { premium = false }: { premium?: boolean } = {},
): string | undefined {
  const allowedTypes: readonly string[] = premium
    ? PREMIUM_ATTACHMENT_TYPES
    : ALLOWED_ATTACHMENT_TYPES;
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return ATTACHMENT_UNSUPPORTED_TYPE;
  }
  if (file.size <= 0) return ATTACHMENT_EMPTY;
  const maxBytes = premium
    ? PREMIUM_MAX_ATTACHMENT_BYTES
    : MAX_ATTACHMENT_BYTES;
  if (file.size > maxBytes) return ATTACHMENT_TOO_LARGE;
  return undefined;
}

/** Error si agregar `adding` archivos a los `current` ya elegidos pasa el tope por mensaje. */
export function validateAttachmentCount(
  current: number,
  adding: number,
): string | undefined {
  return current + adding > MAX_ATTACHMENTS_PER_MESSAGE
    ? ATTACHMENTS_LIMIT_REACHED
    : undefined;
}

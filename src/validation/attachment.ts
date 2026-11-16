import {
  ALLOWED_ATTACHMENT_TYPES,
  BOOSTED_MAX_ATTACHMENT_MB,
  MAX_ATTACHMENT_MB,
  MAX_ATTACHMENTS_PER_MESSAGE,
  PREMIUM_ATTACHMENT_TYPES,
  PREMIUM_MAX_ATTACHMENT_MB,
} from "../constants/attachments";
import {
  type AttachmentLimitOptions,
  attachmentLimitMbFor,
} from "../constants/boost";
import { BOOST_PERK_LEVEL } from "../domain/boost";

const BYTES_PER_MB = 1024 * 1024;

export const ATTACHMENT_UNSUPPORTED_TYPE =
  "Formato no soportado. Solo se aceptan imágenes JPEG, PNG o WebP y archivos PDF (y GIF con Premium).";
export const ATTACHMENT_TOO_LARGE = `El archivo supera el tamaño máximo permitido (${MAX_ATTACHMENT_MB} MB, ${BOOSTED_MAX_ATTACHMENT_MB} MB en servidores de nivel ${BOOST_PERK_LEVEL.larger_attachments} o ${PREMIUM_MAX_ATTACHMENT_MB} MB con Premium).`;
export const ATTACHMENT_EMPTY = "El archivo está vacío.";
export const ATTACHMENTS_LIMIT_REACHED = `Un mensaje puede tener hasta ${MAX_ATTACHMENTS_PER_MESSAGE} adjuntos.`;

function sizeInMb(bytes: number): string {
  const mb = Math.ceil((bytes / BYTES_PER_MB) * 10) / 10;
  return Number.isInteger(mb) ? String(mb) : mb.toFixed(1).replace(".", ",");
}

export function attachmentTooLargeMessage(
  sizeBytes: number,
  options: AttachmentLimitOptions = {},
): string {
  const where =
    options.serverLevel === undefined ? "El" : "En este servidor el";
  return `Pesa ${sizeInMb(sizeBytes)} MB. ${where} límite es ${attachmentLimitMbFor(options)} MB.`;
}

/** Devuelve el error a mostrar, o `undefined` si el archivo se puede adjuntar. */
export function validateAttachment(
  file: {
    type: string;
    size: number;
  },
  options: AttachmentLimitOptions = {},
): string | undefined {
  const allowedTypes: readonly string[] = options.premium
    ? PREMIUM_ATTACHMENT_TYPES
    : ALLOWED_ATTACHMENT_TYPES;
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return ATTACHMENT_UNSUPPORTED_TYPE;
  }
  if (file.size <= 0) return ATTACHMENT_EMPTY;
  if (file.size > attachmentLimitMbFor(options) * BYTES_PER_MB) {
    return attachmentTooLargeMessage(file.size, options);
  }
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

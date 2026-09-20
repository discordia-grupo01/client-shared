import {
  ALLOWED_AVATAR_TYPES,
  ALLOWED_SERVER_ICON_TYPES,
  MAX_AVATAR_FILE_MB,
  MAX_ICON_FILE_MB,
} from "../constants/limits";

export interface ImageFile {
  /** `File.type` en web, `asset.mimeType` en mobile. */
  mimeType: string;
  sizeBytes: number;
}

/** "image/jpeg" -> "JPEG". */
function formatType(mimeType: string): string {
  return mimeType.replace("image/", "").toUpperCase();
}

/**
 * Arma el mensaje desde la lista, para que no puedan desincronizarse. Antes
 * las cuatro copias decian "JPEG, PNG o GIF" aunque dos no aceptaban GIF.
 */
function formatTypeList(types: readonly string[]): string {
  const names = types.map(formatType);
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} o ${names[names.length - 1]}`;
}

function validateImageFile(
  file: ImageFile,
  allowedTypes: readonly string[],
  maxMb: number,
): string | undefined {
  if (!allowedTypes.includes(file.mimeType)) {
    return `La imagen debe ser ${formatTypeList(allowedTypes)}.`;
  }
  if (file.sizeBytes > maxMb * 1024 * 1024) {
    return `El archivo no puede pesar más de ${maxMb} MB.`;
  }
  return undefined;
}

export function validateAvatar(file: ImageFile): string | undefined {
  return validateImageFile(file, ALLOWED_AVATAR_TYPES, MAX_AVATAR_FILE_MB);
}

export function validateServerIcon(file: ImageFile): string | undefined {
  return validateImageFile(file, ALLOWED_SERVER_ICON_TYPES, MAX_ICON_FILE_MB);
}

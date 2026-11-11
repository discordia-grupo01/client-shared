import {
  ALLOWED_AVATAR_TYPES,
  ALLOWED_SERVER_ICON_TYPES,
  ANIMATED_SERVER_ICON_TYPES,
  MAX_AVATAR_FILE_MB,
  MAX_ICON_FILE_MB,
} from "../constants/limits";
import { type BoostLevel, canUseAnimatedServerIcon } from "../domain/boost";
import { formatImageTypes } from "../format/image";
import { ANIMATED_SERVER_ICON_LOCKED } from "../messages/boost";

export interface ImageFile {
  /** `File.type` en web, `asset.mimeType` en mobile. */
  mimeType: string;
  sizeBytes: number;
}

function validateImageFile(
  file: ImageFile,
  allowedTypes: readonly string[],
  maxMb: number,
): string | undefined {
  if (!allowedTypes.includes(file.mimeType)) {
    return `La imagen debe ser ${formatImageTypes(allowedTypes)}.`;
  }
  if (file.sizeBytes > maxMb * 1024 * 1024) {
    return `El archivo no puede pesar más de ${maxMb} MB.`;
  }
  return undefined;
}

export function validateAvatar(file: ImageFile): string | undefined {
  return validateImageFile(file, ALLOWED_AVATAR_TYPES, MAX_AVATAR_FILE_MB);
}

export function serverIconTypes(boostLevel: BoostLevel): readonly string[] {
  return canUseAnimatedServerIcon(boostLevel)
    ? ANIMATED_SERVER_ICON_TYPES
    : ALLOWED_SERVER_ICON_TYPES;
}

export function validateServerIcon(
  file: ImageFile,
  { boostLevel = 0 }: { boostLevel?: BoostLevel } = {},
): string | undefined {
  if (file.mimeType === "image/gif" && !canUseAnimatedServerIcon(boostLevel)) {
    return ANIMATED_SERVER_ICON_LOCKED;
  }
  return validateImageFile(file, serverIconTypes(boostLevel), MAX_ICON_FILE_MB);
}

export function validateServerBanner(file: ImageFile): string | undefined {
  return validateImageFile(file, ALLOWED_SERVER_ICON_TYPES, MAX_ICON_FILE_MB);
}

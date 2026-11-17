import {
  ALLOWED_EMOJI_TYPES,
  EMOJI_NAME_MAX,
  EMOJI_NAME_PATTERN,
  MAX_EMOJI_FILE_MB,
} from "../constants/limits";
import {
  EMOJI_IMAGE_REQUIRED,
  EMOJI_IMAGE_TOO_LARGE,
  EMOJI_IMAGE_UNSUPPORTED,
  EMOJI_NAME_INVALID,
} from "../messages/emoji";

import type { ImageFile } from "./image";

export function normalizeEmojiName(raw: string): string {
  return raw.trim();
}

export function validateEmojiName(raw: string): string | undefined {
  return EMOJI_NAME_PATTERN.test(normalizeEmojiName(raw))
    ? undefined
    : EMOJI_NAME_INVALID;
}

export function validateEmojiImage(
  file: ImageFile | undefined,
): string | undefined {
  if (file === undefined) return EMOJI_IMAGE_REQUIRED;
  if (!(ALLOWED_EMOJI_TYPES as readonly string[]).includes(file.mimeType)) {
    return EMOJI_IMAGE_UNSUPPORTED;
  }
  if (file.sizeBytes > MAX_EMOJI_FILE_MB * 1024 * 1024) {
    return EMOJI_IMAGE_TOO_LARGE;
  }
  return undefined;
}

export function isAnimatedEmojiType(mimeType: string): boolean {
  return mimeType === "image/gif";
}

export function suggestEmojiName(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  const base = dot > 0 ? fileName.slice(0, dot) : fileName;
  const name = base
    .replace(/[^A-Za-z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, EMOJI_NAME_MAX)
    .replace(/^_+|_+$/g, "");
  return validateEmojiName(name) === undefined ? name : "";
}

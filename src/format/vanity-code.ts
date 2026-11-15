import { trimTrailing } from "./trim";

const VANITY_CODE_MIN_LENGTH = 3;
const VANITY_CODE_MAX_LENGTH = 32;

export const VANITY_CODE_FALLBACK = "mi-servidor";

export function vanitySlug(name: string): string {
  const words = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const slug = trimTrailing(
    words.join("-").slice(0, VANITY_CODE_MAX_LENGTH),
    "-",
  );
  return slug.length >= VANITY_CODE_MIN_LENGTH ? slug : VANITY_CODE_FALLBACK;
}

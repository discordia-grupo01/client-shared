const VANITY_CODE_MIN_LENGTH = 3;
const VANITY_CODE_MAX_LENGTH = 32;

export const VANITY_CODE_FALLBACK = "mi-servidor";

export function vanitySlug(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, VANITY_CODE_MAX_LENGTH)
    .replace(/-+$/, "");
  return slug.length >= VANITY_CODE_MIN_LENGTH ? slug : VANITY_CODE_FALLBACK;
}

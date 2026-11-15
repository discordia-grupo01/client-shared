import {
  VANITY_CODE_MAX_LENGTH,
  VANITY_CODE_MIN_LENGTH,
} from "../constants/limits";

import { buildInviteLink } from "./invite-link";
import { trimTrailing } from "./trim";

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

export function vanityInviteLink(code: string, baseUrl: string | null): string {
  return buildInviteLink(code, baseUrl);
}

export function displayInviteLink(link: string): string {
  return link.replace(/^https?:\/\//, "");
}

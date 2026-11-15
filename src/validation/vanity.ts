import {
  VANITY_CODE_MAX_LENGTH,
  VANITY_CODE_MIN_LENGTH,
} from "../constants/limits";

export function normalizeVanityCode(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateVanityCode(raw: string): string | undefined {
  const code = normalizeVanityCode(raw);
  if (code === "") return "Escribí el link que querés usar.";
  if (!/^[a-z0-9-]+$/.test(code)) {
    return "Usá solo minúsculas, números y guiones.";
  }
  if (code.startsWith("-") || code.endsWith("-")) {
    return "No puede empezar ni terminar con guion.";
  }
  if (
    code.length < VANITY_CODE_MIN_LENGTH ||
    code.length > VANITY_CODE_MAX_LENGTH
  ) {
    return `Tiene que tener entre ${VANITY_CODE_MIN_LENGTH} y ${VANITY_CODE_MAX_LENGTH} caracteres.`;
  }
  return undefined;
}

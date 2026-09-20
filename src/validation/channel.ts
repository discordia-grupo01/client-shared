import { MAX_NAME } from "../constants/limits";

export function validateChannelName(name: string): string | undefined {
  const trimmed = name.trim();
  if (!trimmed) return "Ingresá un nombre para el canal.";
  if (trimmed.length > MAX_NAME) {
    return `El nombre no puede superar los ${MAX_NAME} caracteres.`;
  }
  return undefined;
}

export function validateCategoryName(name: string): string | undefined {
  const trimmed = name.trim();
  if (!trimmed) return "Ingresá un nombre para la categoría.";
  if (trimmed.length > MAX_NAME) {
    return `El nombre no puede superar los ${MAX_NAME} caracteres.`;
  }
  return undefined;
}

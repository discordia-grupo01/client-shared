import { MAX_NAME, MIN_SERVER_NAME } from "../constants/limits";

export function validateServerName(name: string): string | undefined {
  const trimmed = name.trim();
  if (!trimmed) return "Ingresá un nombre para el servidor.";
  if (trimmed.length < MIN_SERVER_NAME || trimmed.length > MAX_NAME) {
    return `El nombre debe tener entre ${MIN_SERVER_NAME} y ${MAX_NAME} caracteres.`;
  }
  return undefined;
}

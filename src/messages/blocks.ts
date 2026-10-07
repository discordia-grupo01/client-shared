import { UNEXPECTED_ERROR_MESSAGE } from "./errors";

export const BLOCK_ERROR_MESSAGES: Readonly<Record<string, string>> = {
  CANNOT_BLOCK_SELF: "No podés bloquearte a vos mismo.",
  USER_NOT_FOUND: "Este usuario no existe.",
  USERS_UNAVAILABLE:
    "No pudimos verificar al usuario. Intentá de nuevo en un momento.",
  INVALID_PAYLOAD: "No pudimos procesar el pedido. Intentá de nuevo.",
};

export function blockErrorFor(
  code: unknown,
  fallback: string = UNEXPECTED_ERROR_MESSAGE,
): string {
  return typeof code === "string" &&
    Object.prototype.hasOwnProperty.call(BLOCK_ERROR_MESSAGES, code)
    ? BLOCK_ERROR_MESSAGES[code]
    : fallback;
}

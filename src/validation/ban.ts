import { BAN_REASON_MAX_LENGTH } from "../constants/limits";

/**
 * El motivo es opcional. El back cuenta runas (no bytes ni unidades UTF-16),
 * asi que un emoji cuenta como 1 igual que aca.
 */
export function validateBanReason(reason: string): string | undefined {
  return [...reason.trim()].length > BAN_REASON_MAX_LENGTH
    ? `El motivo no puede superar los ${BAN_REASON_MAX_LENGTH} caracteres.`
    : undefined;
}

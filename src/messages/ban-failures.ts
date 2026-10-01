import type { ApiFailure } from "../domain/api-result";
import type { BanFieldErrors } from "../domain/ban";
import { fieldOf } from "../domain/errors";

import { SESSION_EXPIRED_MESSAGE, UNEXPECTED_ERROR_MESSAGE } from "./errors";
import { BANS_LOAD_FAILED } from "./actions";
import { OWNER_ONLY_BAN, OWNER_ONLY_UNBAN } from "./permissions";
import { messageFor } from "./message-for";
import { BAN_REASONS } from "./reasons";

/**
 * Texto para el usuario de un fallo de `/servers/:id/bans`, igual en las dos
 * apps. Al listar o revocar, un 403 es siempre "no tenes el permiso"; al
 * banear, si trae `reason` (jerarquia, propietario, etc.) manda el catalogo.
 */
export function listBansFailureMessage(failure: ApiFailure): string {
  if (failure.status === 401) return SESSION_EXPIRED_MESSAGE;
  return failure.status === 403
    ? OWNER_ONLY_BAN
    : messageFor(failure, {}, BANS_LOAD_FAILED);
}

export function banFailureOf(failure: ApiFailure): {
  message: string;
  fieldErrors?: BanFieldErrors;
} {
  if (failure.status === 401) return { message: SESSION_EXPIRED_MESSAGE };
  const message = messageFor(
    failure,
    BAN_REASONS,
    failure.status === 403 ? OWNER_ONLY_BAN : UNEXPECTED_ERROR_MESSAGE,
  );
  return fieldOf(failure.details) === "reason"
    ? { message, fieldErrors: { reason: message } }
    : { message };
}

export function unbanFailureMessage(failure: ApiFailure): string {
  if (failure.status === 401) return SESSION_EXPIRED_MESSAGE;
  return failure.status === 403
    ? OWNER_ONLY_UNBAN
    : messageFor(failure, BAN_REASONS, UNEXPECTED_ERROR_MESSAGE);
}

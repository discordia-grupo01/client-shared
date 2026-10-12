import type { ApiFailure } from "../domain/api-result";

import {
  KICK_FAILED,
  MUTE_FAILED,
  ROLE_MEMBERS_LOAD_FAILED,
  UNMUTE_FAILED,
} from "./actions";
import { SESSION_EXPIRED_MESSAGE } from "./errors";
import { messageFor } from "./message-for";
import {
  NO_PERMISSION_KICK,
  NO_PERMISSION_MUTE,
  NO_PERMISSION_ROLE_MEMBERS,
} from "./permissions";
import { KICK_REASONS, MUTE_REASONS } from "./reasons";

/**
 * Textos de un fallo de expulsar (`POST /servers/:id/kicks`), silenciar
 * (`POST`/`DELETE /servers/:id/mutes`) o listar los miembros de un rol
 * (`GET /roles/:id/members`), iguales en las dos apps. Un 403 con `reason`
 * (jerarquia, propietario) usa el catalogo; sin `reason` es falta de permiso.
 */
export function kickFailureMessage(failure: ApiFailure): string {
  if (failure.status === 401) return SESSION_EXPIRED_MESSAGE;
  return messageFor(
    failure,
    KICK_REASONS,
    failure.status === 403 ? NO_PERMISSION_KICK : KICK_FAILED,
  );
}

export function muteFailureMessage(failure: ApiFailure): string {
  if (failure.status === 401) return SESSION_EXPIRED_MESSAGE;
  return messageFor(
    failure,
    MUTE_REASONS,
    failure.status === 403 ? NO_PERMISSION_MUTE : MUTE_FAILED,
  );
}

export function unmuteFailureMessage(failure: ApiFailure): string {
  if (failure.status === 401) return SESSION_EXPIRED_MESSAGE;
  return messageFor(
    failure,
    MUTE_REASONS,
    failure.status === 403 ? NO_PERMISSION_MUTE : UNMUTE_FAILED,
  );
}

export function listRoleMembersFailureMessage(failure: ApiFailure): string {
  if (failure.status === 401) return SESSION_EXPIRED_MESSAGE;
  if (failure.status === 403) return NO_PERMISSION_ROLE_MEMBERS;
  return messageFor(failure, {}, ROLE_MEMBERS_LOAD_FAILED);
}

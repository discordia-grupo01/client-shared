import type { ApiFailure } from "../domain/api-result";
import { reasonOf } from "../domain/errors";

import {
  REPORT_CLOSE_FAILED,
  REPORT_CREATE_FAILED,
  REPORTS_LOAD_FAILED,
} from "./actions";
import { SESSION_EXPIRED_MESSAGE } from "./errors";
import { messageFor } from "./message-for";
import { NOT_A_MEMBER, REPORT_TARGET_NOT_FOUND } from "./not-found";
import { NO_PERMISSION_REPORTS } from "./permissions";
import { REPORT_REASONS } from "./reasons";

export function createReportFailureMessage(failure: ApiFailure): string {
  if (failure.status === 401) return SESSION_EXPIRED_MESSAGE;
  if (failure.status === 403) return NOT_A_MEMBER;
  if (failure.status === 404) return REPORT_TARGET_NOT_FOUND;
  return messageFor(failure, REPORT_REASONS, REPORT_CREATE_FAILED);
}

/** `GET /servers/:id/reports`: el 403 es "no sos moderador". */
export function listReportsFailureMessage(failure: ApiFailure): string {
  if (failure.status === 401) return SESSION_EXPIRED_MESSAGE;
  if (failure.status === 403) return NO_PERMISSION_REPORTS;
  return messageFor(failure, REPORT_REASONS, REPORTS_LOAD_FAILED);
}

/** `PATCH /servers/:id/reports/:reportId`. */
export function closeReportFailureMessage(failure: ApiFailure): string {
  if (failure.status === 401) return SESSION_EXPIRED_MESSAGE;
  if (failure.status === 403) return NO_PERMISSION_REPORTS;
  return messageFor(failure, REPORT_REASONS, REPORT_CLOSE_FAILED);
}

/**
 * El reporte ya no esta pendiente (otro moderador lo cerro) o se borro: la
 * fila tiene que salir de la lista igual que si se hubiera cerrado bien.
 */
export function isReportGone(failure: ApiFailure): boolean {
  const reason = reasonOf(failure.details);
  return (
    (failure.status === 409 && reason === "report_not_pending") ||
    (failure.status === 404 && reason === "report_not_found")
  );
}

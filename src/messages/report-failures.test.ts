import { describe, expect, it } from "vitest";

import type { ApiFailure } from "../domain/api-result";

import { SESSION_EXPIRED_MESSAGE } from "./errors";
import { NOT_A_MEMBER, REPORT_TARGET_NOT_FOUND } from "./not-found";
import { NO_PERMISSION_REPORTS } from "./permissions";
import {
  closeReportFailureMessage,
  createReportFailureMessage,
  isReportGone,
  listReportsFailureMessage,
} from "./report-failures";

const failure = (
  status: number,
  details?: ApiFailure["details"],
): ApiFailure => ({ ok: false, status, code: status, message: "", details });

describe("reportar", () => {
  it("el reporte duplicado avisa que ya hay uno pendiente (CA2)", () => {
    expect(
      createReportFailureMessage(
        failure(409, { reason: "report_already_pending" }),
      ),
    ).toMatch(/reporte pendiente/);
  });

  it("traduce los motivos de validacion del back", () => {
    expect(
      createReportFailureMessage(
        failure(400, { field: "user_id", reason: "cannot_report_self" }),
      ),
    ).toMatch(/reportarte a vos mismo/);
    expect(
      createReportFailureMessage(
        failure(400, { field: "reason", reason: "reason_too_long" }),
      ),
    ).toMatch(/512/);
  });

  it("403 es dejar de ser miembro y 404 que el objetivo ya no esta", () => {
    expect(createReportFailureMessage(failure(403))).toBe(NOT_A_MEMBER);
    expect(createReportFailureMessage(failure(404))).toBe(
      REPORT_TARGET_NOT_FOUND,
    );
    expect(createReportFailureMessage(failure(401))).toBe(
      SESSION_EXPIRED_MESSAGE,
    );
    expect(createReportFailureMessage(failure(500))).toMatch(
      /enviar el reporte/,
    );
  });
});

describe("listar y cerrar", () => {
  it("el 403 es no ser moderador", () => {
    expect(listReportsFailureMessage(failure(403))).toBe(NO_PERMISSION_REPORTS);
    expect(closeReportFailureMessage(failure(403))).toBe(NO_PERMISSION_REPORTS);
  });

  it("cerrar uno que ya cerro otro moderador", () => {
    expect(
      closeReportFailureMessage(failure(409, { reason: "report_not_pending" })),
    ).toMatch(/Otro moderador/);
  });

  it("fallback por accion", () => {
    expect(listReportsFailureMessage(failure(500))).toMatch(
      /cargar los reportes/,
    );
    expect(closeReportFailureMessage(failure(500))).toMatch(
      /cerrar el reporte/,
    );
  });
});

describe("isReportGone", () => {
  it("cerrado por otro o borrado: la fila sale de la lista", () => {
    expect(isReportGone(failure(409, { reason: "report_not_pending" }))).toBe(
      true,
    );
    expect(isReportGone(failure(404, { reason: "report_not_found" }))).toBe(
      true,
    );
  });

  it("un 404 sin reason es el servidor, no el reporte", () => {
    expect(isReportGone(failure(404))).toBe(false);
    expect(isReportGone(failure(500))).toBe(false);
  });
});

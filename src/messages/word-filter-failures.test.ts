import { describe, expect, it } from "vitest";

import type { ApiFailure } from "../domain/api-result";

import { SESSION_EXPIRED_MESSAGE } from "./errors";
import { NO_PERMISSION_WORD_FILTER } from "./permissions";
import {
  listBannedWordsFailureMessage,
  saveBannedWordsFailureMessage,
} from "./word-filter-failures";

const failure = (
  status: number,
  details?: ApiFailure["details"],
): ApiFailure => ({ ok: false, status, code: status, message: "", details });

describe("fallos de palabras prohibidas", () => {
  it("401 es sesion vencida y 403 es falta de permiso", () => {
    expect(listBannedWordsFailureMessage(failure(401))).toBe(
      SESSION_EXPIRED_MESSAGE,
    );
    expect(listBannedWordsFailureMessage(failure(403))).toBe(
      NO_PERMISSION_WORD_FILTER,
    );
    expect(saveBannedWordsFailureMessage(failure(403))).toBe(
      NO_PERMISSION_WORD_FILTER,
    );
  });

  it("al guardar, traduce el motivo del back", () => {
    expect(
      saveBannedWordsFailureMessage(
        failure(400, { field: "words", reason: "too_many_words" }),
      ),
    ).toMatch(/100/);
  });

  it("un error inesperado cae al generico", () => {
    expect(saveBannedWordsFailureMessage(failure(500))).toMatch(
      /guardar las palabras prohibidas/,
    );
    expect(listBannedWordsFailureMessage(failure(500))).toMatch(
      /cargar las palabras prohibidas/,
    );
  });
});

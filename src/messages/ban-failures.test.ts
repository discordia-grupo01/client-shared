import { describe, expect, it } from "vitest";

import type { ApiFailure } from "../domain/api-result";

import {
  banFailureOf,
  listBansFailureMessage,
  unbanFailureMessage,
} from "./ban-failures";
import { OWNER_ONLY_BAN, OWNER_ONLY_UNBAN } from "./permissions";
import { SESSION_EXPIRED_MESSAGE } from "./errors";

const failure = (
  status: number,
  details?: ApiFailure["details"],
): ApiFailure => ({ ok: false, status, code: status, message: "", details });

describe("banFailureOf", () => {
  it("la jerarquia gana sobre el 403 generico", () => {
    expect(
      banFailureOf(failure(403, { reason: "target_outranks_actor" })).message,
    ).toBe("No podés banear a alguien con un rol igual o superior al tuyo.");
  });

  it("un 403 sin motivo es falta de permiso", () => {
    expect(banFailureOf(failure(403)).message).toBe(OWNER_ONLY_BAN);
  });

  it("marca el campo motivo cuando el back lo indica", () => {
    const result = banFailureOf(
      failure(400, { reason: "reason_too_long", field: "reason" }),
    );
    expect(result.fieldErrors?.reason).toBe(result.message);
  });

  it("un 401 es sesion vencida", () => {
    expect(banFailureOf(failure(401)).message).toBe(SESSION_EXPIRED_MESSAGE);
  });
});

describe("unbanFailureMessage / listBansFailureMessage", () => {
  it("un 403 es falta de permiso", () => {
    expect(unbanFailureMessage(failure(403))).toBe(OWNER_ONLY_UNBAN);
    expect(listBansFailureMessage(failure(403))).toBe(OWNER_ONLY_BAN);
  });
});

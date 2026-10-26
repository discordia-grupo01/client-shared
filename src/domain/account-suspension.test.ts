import { describe, expect, it } from "vitest";

import { isAccountSuspended } from "./account-suspension";
import { toApiResult, type ApiFailure } from "./api-result";

function failure(status: number, body: unknown): ApiFailure {
  const result = toApiResult(status, body);
  if (result.ok) throw new Error("se esperaba un fallo");
  return result;
}

describe("isAccountSuspended", () => {
  it("reconoce el formato de identify-service y messaging", () => {
    expect(
      isAccountSuspended(
        failure(403, {
          error: { code: "ACCOUNT_SUSPENDED", message: "suspendida" },
        }),
      ),
    ).toBe(true);
  });

  it("reconoce el formato de servers (details.error_code)", () => {
    expect(
      isAccountSuspended(
        failure(403, {
          error: {
            code: 403,
            message: "suspended",
            details: { error_code: "ACCOUNT_SUSPENDED" },
          },
        }),
      ),
    ).toBe(true);
  });

  it("no confunde otros 403", () => {
    expect(
      isAccountSuspended(
        failure(403, { error: { code: "EMAIL_NOT_VERIFIED", message: "x" } }),
      ),
    ).toBe(false);
    expect(
      isAccountSuspended(
        failure(403, {
          error: { code: 403, message: "x", details: { reason: "not_member" } },
        }),
      ),
    ).toBe(false);
  });

  it("ignora el código si el status no es 403", () => {
    expect(
      isAccountSuspended(
        failure(500, { error: { code: "ACCOUNT_SUSPENDED", message: "x" } }),
      ),
    ).toBe(false);
  });
});

import { describe, expect, it } from "vitest";

import {
  UNEXPECTED_ERROR_MESSAGE,
  NETWORK_ERROR_MESSAGE,
} from "../messages/errors";

import { isNetworkFailure, networkFailure, toApiResult } from "./api-result";

describe("toApiResult", () => {
  it("marca ok entre 200 y 299", () => {
    expect(toApiResult(200, { id: "1" })).toEqual({
      ok: true,
      status: 200,
      data: { id: "1" },
    });
    expect(toApiResult(204, null).ok).toBe(true);
    expect(toApiResult(299, null).ok).toBe(true);
  });

  it("marca error fuera de ese rango", () => {
    expect(toApiResult(199, null).ok).toBe(false);
    expect(toApiResult(300, null).ok).toBe(false);
    expect(toApiResult(500, null).ok).toBe(false);
  });

  it("lee code, message y details del body del backend", () => {
    const result = toApiResult(409, {
      error: {
        code: "NAME_TAKEN",
        message: "name taken",
        details: { reason: "name_taken" },
      },
    });
    expect(result).toEqual({
      ok: false,
      status: 409,
      code: "NAME_TAKEN",
      message: "name taken",
      details: { reason: "name_taken" },
    });
  });

  it("acepta code numerico, que es lo que manda servers", () => {
    const result = toApiResult(400, { error: { code: 400, message: "bad" } });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(400);
  });

  it("no se rompe con un body que no es del backend", () => {
    for (const body of [null, undefined, "<html>502</html>", 42, {}]) {
      const result = toApiResult(502, body);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("UNKNOWN_ERROR");
        expect(result.message).toBe(UNEXPECTED_ERROR_MESSAGE);
        expect(result.details).toBeUndefined();
      }
    }
  });
});

describe("networkFailure", () => {
  it("usa status 0 y el mensaje de red por defecto", () => {
    const failure = networkFailure();
    expect(failure).toEqual({
      ok: false,
      status: 0,
      code: "NETWORK_ERROR",
      message: NETWORK_ERROR_MESSAGE,
    });
    expect(isNetworkFailure(failure)).toBe(true);
  });

  it("acepta un mensaje propio, para el timeout", () => {
    expect(networkFailure("Tardó demasiado.").message).toBe("Tardó demasiado.");
  });
});

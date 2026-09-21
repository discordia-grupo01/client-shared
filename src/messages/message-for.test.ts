import { describe, expect, it } from "vitest";

import type { ApiFailure } from "../domain/api-result";

import { NETWORK_ERROR_MESSAGE, UNEXPECTED_ERROR_MESSAGE } from "./errors";
import { messageFor } from "./message-for";

function failure(over: Partial<ApiFailure> = {}): ApiFailure {
  return {
    ok: false,
    status: 400,
    code: "BAD_REQUEST",
    message: "bad request",
    ...over,
  };
}

const catalog = { name_taken: "Ya existe un canal con ese nombre." };

describe("messageFor", () => {
  it("traduce el reason cuando esta en el catalogo", () => {
    const result = messageFor(
      failure({ status: 409, details: { reason: "name_taken" } }),
      catalog,
    );
    expect(result).toBe("Ya existe un canal con ese nombre.");
  });

  it("usa el fallback cuando el reason no esta en el catalogo", () => {
    const result = messageFor(
      failure({ details: { reason: "reason_que_no_conocemos" } }),
      catalog,
      "No pudimos crear el canal.",
    );
    expect(result).toBe("No pudimos crear el canal.");
  });

  it("usa el fallback cuando no hay reason", () => {
    expect(messageFor(failure(), catalog)).toBe(UNEXPECTED_ERROR_MESSAGE);
  });

  it("con status 0 prioriza el mensaje del cliente http", () => {
    const result = messageFor(
      failure({ status: 0, message: "El servidor tardó demasiado." }),
      catalog,
      "no deberia usar esto",
    );
    expect(result).toBe("El servidor tardó demasiado.");
  });

  it("con status 0 y sin mensaje cae al de red", () => {
    expect(messageFor(failure({ status: 0, message: "" }))).toBe(
      NETWORK_ERROR_MESSAGE,
    );
  });

  it("ignora el catalogo en un fallo de red", () => {
    const result = messageFor(
      failure({ status: 0, message: "", details: { reason: "name_taken" } }),
      catalog,
    );
    expect(result).toBe(NETWORK_ERROR_MESSAGE);
  });
});

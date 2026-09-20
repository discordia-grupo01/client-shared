import { describe, expect, it } from "vitest";

import { detailsOf, fieldOf, reasonOf } from "./errors";

describe("detailsOf", () => {
  it("saca los details de un body del backend", () => {
    const body = {
      error: {
        code: 409,
        message: "conflict",
        details: { reason: "name_taken" },
      },
    };
    expect(detailsOf(body)).toEqual({ reason: "name_taken" });
  });

  it("devuelve undefined con bodies que no tienen esa forma", () => {
    for (const body of [null, undefined, "error", 42, {}, { error: null }]) {
      expect(detailsOf(body)).toBeUndefined();
    }
  });

  it("devuelve undefined cuando el error no trae details", () => {
    expect(
      detailsOf({ error: { code: 500, message: "boom" } }),
    ).toBeUndefined();
  });
});

describe("reasonOf y fieldOf", () => {
  it("leen las claves cuando son strings", () => {
    const details = { reason: "name_too_long", field: "name" };
    expect(reasonOf(details)).toBe("name_too_long");
    expect(fieldOf(details)).toBe("name");
  });

  it("ignoran valores que no son string", () => {
    expect(reasonOf({ reason: 7 })).toBeUndefined();
    expect(fieldOf({ field: ["name"] })).toBeUndefined();
  });

  it("toleran que no haya details", () => {
    expect(reasonOf(undefined)).toBeUndefined();
    expect(fieldOf(undefined)).toBeUndefined();
  });
});

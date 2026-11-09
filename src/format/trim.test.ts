import { describe, expect, it } from "vitest";

import { trimTrailing } from "./trim";

describe("trimTrailing", () => {
  it("saca todas las repeticiones del caracter al final", () => {
    expect(trimTrailing("https://api.test///", "/")).toBe("https://api.test");
    expect(trimTrailing("abc==", "=")).toBe("abc");
  });

  it("deja igual lo que no termina en el caracter", () => {
    expect(trimTrailing("a/b", "/")).toBe("a/b");
    expect(trimTrailing("", "/")).toBe("");
  });

  it("devuelve vacio si todo es el caracter", () => {
    expect(trimTrailing("////", "/")).toBe("");
  });

  it("no se queda colgado con entradas largas", () => {
    const input = `${"/".repeat(200_000)}x`;
    expect(trimTrailing(input, "/")).toBe(input);
  });
});

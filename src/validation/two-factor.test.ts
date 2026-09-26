import { describe, expect, it } from "vitest";

import { hasErrors } from "./auth";
import {
  isRecoveryCode,
  isTotpCode,
  normalizeRecoveryCode,
  normalizeTotpCode,
  validateTwoFactorActivationCode,
  validateTwoFactorCode,
  validateTwoFactorPassword,
} from "./two-factor";

describe("normalizeRecoveryCode", () => {
  it.each([
    ["tal cual se genera", "A1B2C-D3E4F", "A1B2CD3E4F"],
    ["en minuscula", "a1b2c-d3e4f", "A1B2CD3E4F"],
    ["con espacios alrededor", "  A1B2C-D3E4F  ", "A1B2CD3E4F"],
    ["con espacio en vez de guion", "A1B2C D3E4F", "A1B2CD3E4F"],
    ["sin separador", "A1B2CD3E4F", "A1B2CD3E4F"],
    ["vacio", "   ", ""],
  ])("%s", (_name, input, expected) => {
    expect(normalizeRecoveryCode(input)).toBe(expected);
  });

  // Mismo alfabeto que el backend: sin I, L, O ni U.
  it("descarta los caracteres que no estan en el alfabeto", () => {
    expect(normalizeRecoveryCode("A1B2C-D3E4F!?")).toBe("A1B2CD3E4F");
  });
});

describe("normalizeTotpCode", () => {
  it("saca los espacios con los que se pega el codigo", () => {
    expect(normalizeTotpCode("123 456")).toBe("123456");
  });
});

describe("isTotpCode", () => {
  it.each([
    ["seis digitos", "123456", true],
    ["seis digitos con espacio", "123 456", true],
    ["cinco digitos", "12345", false],
    ["siete digitos", "1234567", false],
    ["con letras", "12345A", false],
    ["vacio", "", false],
  ])("%s", (_name, input, expected) => {
    expect(isTotpCode(input)).toBe(expected);
  });
});

describe("isRecoveryCode", () => {
  it.each([
    ["formato completo", "A1B2C-D3E4F", true],
    ["en minuscula", "a1b2c-d3e4f", true],
    ["sin guion", "A1B2CD3E4F", true],
    ["demasiado corto", "A1B2C", false],
    ["demasiado largo", "A1B2C-D3E4F-G5H6J", false],
    ["un TOTP no es codigo de recuperacion", "123456", false],
    ["vacio", "", false],
  ])("%s", (_name, input, expected) => {
    expect(isRecoveryCode(input)).toBe(expected);
  });

  // Diez digitos sin letras es ambiguo y el backend lo leeria como TOTP
  // fallido, no como codigo de recuperacion.
  it("rechaza diez caracteres que sean todos digitos", () => {
    expect(isRecoveryCode("1234567890")).toBe(false);
  });
});

describe("validateTwoFactorCode", () => {
  // CA2 y CA4 comparten el campo: el usuario escribe lo que tenga a mano.
  it.each([
    ["el codigo de la app", "123456"],
    ["un codigo de recuperacion", "A1B2C-D3E4F"],
  ])("acepta %s", (_name, code) => {
    expect(hasErrors(validateTwoFactorCode({ code }))).toBe(false);
  });

  it("pide el codigo cuando esta vacio", () => {
    expect(validateTwoFactorCode({ code: "   " }).code).toBe(
      "Ingresá el código de verificación",
    );
  });

  it("rechaza algo que no es ninguno de los dos formatos", () => {
    expect(validateTwoFactorCode({ code: "12345" }).code).toBeDefined();
  });
});

describe("validateTwoFactorActivationCode", () => {
  it("acepta el codigo de la app", () => {
    expect(hasErrors(validateTwoFactorActivationCode({ code: "123456" }))).toBe(
      false,
    );
  });

  // Los codigos de recuperacion todavia no existen: son el resultado de
  // activar, no una forma de activar.
  it("rechaza un codigo de recuperacion", () => {
    expect(
      validateTwoFactorActivationCode({ code: "A1B2C-D3E4F" }).code,
    ).toBeDefined();
  });

  it("pide el codigo cuando esta vacio", () => {
    expect(validateTwoFactorActivationCode({ code: "" }).code).toBe(
      "Ingresá el código de tu app",
    );
  });
});

describe("validateTwoFactorPassword", () => {
  it("solo exige que no este vacia", () => {
    expect(hasErrors(validateTwoFactorPassword({ password: "x" }))).toBe(false);
    expect(validateTwoFactorPassword({ password: "" }).password).toBe(
      "Ingresá tu contraseña",
    );
  });
});

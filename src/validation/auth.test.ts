import { describe, expect, it } from "vitest";

import {
  hasErrors,
  normalizeName,
  validateForgotPassword,
  validateLogin,
  validateRegister,
  validateResetPassword,
} from "./auth";

describe("validateLogin", () => {
  it("no devuelve errores con credenciales validas", () => {
    const errors = validateLogin({
      email: "ada@example.com",
      password: "secret",
    });
    expect(hasErrors(errors)).toBe(false);
  });

  it("acepta email con espacios alrededor", () => {
    const errors = validateLogin({
      email: "  ada@example.com  ",
      password: "secret",
    });
    expect(errors.email).toBeUndefined();
  });

  it("marca email con formato invalido", () => {
    const errors = validateLogin({ email: "no-es-email", password: "x" });
    expect(errors.email).toBe("El correo electrónico no es válido");
  });

  it("marca email y password vacios", () => {
    const errors = validateLogin({ email: "", password: "" });
    expect(errors.email).toBe("Ingresá tu correo electrónico");
    expect(errors.password).toBe("Ingresá tu contraseña");
    expect(hasErrors(errors)).toBe(true);
  });
});

describe("normalizeName", () => {
  it("recorta y colapsa espacios, igual que el backend", () => {
    expect(normalizeName("  Ada   Lovelace  ")).toBe("Ada Lovelace");
    expect(normalizeName("Ada\t\nLovelace")).toBe("Ada Lovelace");
  });
});

describe("validateRegister", () => {
  const valid = {
    name: "Ada Lovelace",
    email: "ada@example.com",
    password: "Secret123",
  };

  it("no devuelve errores con datos validos", () => {
    expect(hasErrors(validateRegister(valid))).toBe(false);
  });

  it("marca nombre vacio o de solo espacios", () => {
    expect(validateRegister({ ...valid, name: "" }).name).toBe(
      "Ingresá un nombre de usuario",
    );
    expect(validateRegister({ ...valid, name: "   " }).name).toBe(
      "Ingresá un nombre de usuario",
    );
  });

  it("no exige un minimo de caracteres: el back tampoco", () => {
    expect(validateRegister({ ...valid, name: "Al" }).name).toBeUndefined();
    expect(validateRegister({ ...valid, name: "A" }).name).toBeUndefined();
  });

  it("acepta 100 caracteres y rechaza 101", () => {
    expect(
      validateRegister({ ...valid, name: "a".repeat(100) }).name,
    ).toBeUndefined();
    expect(validateRegister({ ...valid, name: "a".repeat(101) }).name).toMatch(
      /100 caracteres/,
    );
  });

  it("acepta letras con tildes, enies, digitos, apostrofos, guiones y puntos", () => {
    for (const name of [
      "José Ñuñez",
      "Ada Lovelace III",
      "O'Brien",
      "Ana-María",
      "Dr. Who",
      "user123",
    ]) {
      expect(validateRegister({ ...valid, name }).name).toBeUndefined();
    }
  });

  it("rechaza los caracteres que el back no permite", () => {
    for (const name of ["Ada<script>", "user_123", "ada@casa", "hola 👋"]) {
      expect(validateRegister({ ...valid, name }).name).toMatch(
        /solo puede tener/,
      );
    }
  });

  it("marca email con formato invalido", () => {
    expect(validateRegister({ ...valid, email: "no-es-email" }).email).toBe(
      "El correo electrónico no es válido",
    );
  });

  it("exige contrasena con mayuscula, minuscula y numero", () => {
    expect(
      validateRegister({ ...valid, password: "corta" }).password,
    ).toBeDefined();
    expect(
      validateRegister({ ...valid, password: "todominuscula1" }).password,
    ).toBeDefined();
    expect(
      validateRegister({ ...valid, password: "SinNumeros" }).password,
    ).toBeDefined();
    expect(
      validateRegister({ ...valid, password: "Valida123" }).password,
    ).toBeUndefined();
  });
});

describe("validateForgotPassword", () => {
  it("no devuelve errores con un email valido", () => {
    expect(
      hasErrors(validateForgotPassword({ email: "ada@example.com" })),
    ).toBe(false);
  });

  it("marca email vacio", () => {
    expect(validateForgotPassword({ email: "" }).email).toBe(
      "Ingresá tu correo electrónico",
    );
  });

  it("marca email con formato invalido", () => {
    expect(validateForgotPassword({ email: "no-es-email" }).email).toBe(
      "El correo electrónico no es válido",
    );
  });
});

describe("validateResetPassword", () => {
  const valid = { newPassword: "Secret123", confirmPassword: "Secret123" };

  it("no devuelve errores con contrasenas validas y coincidentes", () => {
    expect(hasErrors(validateResetPassword(valid))).toBe(false);
  });

  it("exige contrasena con mayuscula, minuscula y numero", () => {
    expect(
      validateResetPassword({ ...valid, newPassword: "corta" }).newPassword,
    ).toBeDefined();
  });

  it("marca confirmacion vacia", () => {
    expect(
      validateResetPassword({ ...valid, confirmPassword: "" }).confirmPassword,
    ).toBe("Confirmá tu contraseña");
  });

  it("marca cuando las contrasenas no coinciden", () => {
    expect(
      validateResetPassword({ ...valid, confirmPassword: "Otra123" })
        .confirmPassword,
    ).toBe("Las contraseñas no coinciden");
  });
});

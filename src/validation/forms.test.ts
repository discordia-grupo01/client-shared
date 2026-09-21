import { describe, expect, it } from "vitest";

import { validateCategoryName, validateChannelName } from "./channel";
import { validateAvatar, validateServerIcon } from "./image";
import { parseMaxUses, validateMaxUses } from "./invite";
import { validateRole } from "./role";
import { validateServerName } from "./server";
import {
  validateCustomStatus,
  validateDescription,
  validateProfileName,
} from "./user";

describe("validateServerName", () => {
  it("acepta nombres de 2 a 100 caracteres", () => {
    expect(validateServerName("Mi servidor")).toBeUndefined();
    expect(validateServerName("ab")).toBeUndefined();
    expect(validateServerName("a".repeat(100))).toBeUndefined();
  });

  it("rechaza vacio, un solo caracter y mas de 100", () => {
    expect(validateServerName("")).toBe("Ingresá un nombre para el servidor.");
    expect(validateServerName("   ")).toBe(
      "Ingresá un nombre para el servidor.",
    );
    expect(validateServerName("a")).toMatch(/entre 2 y 100/);
    expect(validateServerName("a".repeat(101))).toMatch(/entre 2 y 100/);
  });
});

describe("validateChannelName y validateCategoryName", () => {
  it("aceptan desde un caracter, a diferencia del servidor", () => {
    expect(validateChannelName("a")).toBeUndefined();
    expect(validateCategoryName("a")).toBeUndefined();
  });

  it("rechazan vacio con su propio mensaje", () => {
    expect(validateChannelName("  ")).toBe("Ingresá un nombre para el canal.");
    expect(validateCategoryName("  ")).toBe(
      "Ingresá un nombre para la categoría.",
    );
  });

  it("rechazan mas de 100", () => {
    expect(validateChannelName("a".repeat(101))).toMatch(/100 caracteres/);
    expect(validateCategoryName("a".repeat(101))).toMatch(/100 caracteres/);
  });
});

describe("validateRole", () => {
  const valid = { name: "Moderador", color: "#38A169" };

  it("no devuelve errores con datos validos", () => {
    expect(validateRole(valid)).toEqual({});
  });

  it("marca nombre vacio y demasiado largo", () => {
    expect(validateRole({ ...valid, name: " " }).name).toBe(
      "El nombre del rol no puede estar vacío.",
    );
    expect(validateRole({ ...valid, name: "a".repeat(101) }).name).toMatch(
      /100 caracteres/,
    );
  });

  it("marca color invalido", () => {
    expect(validateRole({ ...valid, color: "rojo" }).color).toBe(
      "Seleccioná un color válido.",
    );
    expect(validateRole({ ...valid, color: "#fff" }).color).toBeDefined();
  });

  it("detecta nombres repetidos sin distinguir mayusculas", () => {
    const existingRoles = [{ id: "1", name: "Moderador" }];
    expect(
      validateRole({ ...valid, name: "moderador" }, { existingRoles }).name,
    ).toBe("Ya existe un rol con ese nombre.");
  });

  it("no cuenta como duplicado el rol que se esta editando", () => {
    const existingRoles = [{ id: "1", name: "Moderador" }];
    expect(
      validateRole(valid, { existingRoles, currentRoleId: "1" }).name,
    ).toBeUndefined();
  });
});

describe("validateMaxUses", () => {
  it("acepta vacio: significa sin limite", () => {
    expect(validateMaxUses("")).toBeUndefined();
    expect(validateMaxUses("   ")).toBeUndefined();
    expect(parseMaxUses("")).toBeNull();
  });

  it("acepta enteros positivos", () => {
    expect(validateMaxUses("1")).toBeUndefined();
    expect(validateMaxUses("25")).toBeUndefined();
    expect(parseMaxUses("25")).toBe(25);
  });

  it("rechaza cero, negativos, decimales y texto", () => {
    for (const input of ["0", "-3", "1.5", "muchos"]) {
      expect(validateMaxUses(input)).toBe(
        "El límite de usos debe ser un número entero mayor a 0.",
      );
    }
  });
});

describe("validacion de imagenes", () => {
  const mb = (n: number) => n * 1024 * 1024;

  it("el avatar acepta gif pero no webp", () => {
    expect(
      validateAvatar({ mimeType: "image/gif", sizeBytes: mb(1) }),
    ).toBeUndefined();
    expect(validateAvatar({ mimeType: "image/webp", sizeBytes: mb(1) })).toBe(
      "La imagen debe ser JPEG, PNG o GIF.",
    );
  });

  it("el icono de servidor acepta webp pero no gif", () => {
    expect(
      validateServerIcon({ mimeType: "image/webp", sizeBytes: mb(1) }),
    ).toBeUndefined();
    expect(
      validateServerIcon({ mimeType: "image/gif", sizeBytes: mb(1) }),
    ).toBe("La imagen debe ser PNG, JPEG o WEBP.");
  });

  it("rechaza archivos de mas de 5 MB", () => {
    expect(validateAvatar({ mimeType: "image/png", sizeBytes: mb(6) })).toBe(
      "El archivo no puede pesar más de 5 MB.",
    );
  });
});

describe("validaciones de perfil", () => {
  it("el nombre usa la misma regla que registrarse, con otro mensaje", () => {
    expect(validateProfileName("")).toBe("Ingresá tu nombre.");
    expect(validateProfileName("user_123")).toMatch(/solo puede tener/);
    expect(validateProfileName("José Ñuñez")).toBeUndefined();
  });

  it("la descripcion corta en 500 y el estado en 64", () => {
    expect(validateDescription("a".repeat(500))).toBeUndefined();
    expect(validateDescription("a".repeat(501))).toMatch(/500 caracteres/);
    expect(validateCustomStatus("a".repeat(64))).toBeUndefined();
    expect(validateCustomStatus("a".repeat(65))).toMatch(/64 caracteres/);
  });
});

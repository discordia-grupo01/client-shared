import { describe, expect, it } from "vitest";

import { MAX_ICON_FILE_MB } from "../constants/limits";
import { validateMaxUses } from "../validation/invite";
import { validateServerIcon } from "../validation/image";

import {
  CATEGORY_REASONS,
  CHANNEL_REASONS,
  INVITE_REASONS,
  ROLE_REASONS,
  SERVER_REASONS,
  TRANSFER_REASONS,
} from "./reasons";

describe("catalogos de reason", () => {
  it("dan un texto distinto por entidad para la misma clave", () => {
    const porEntidad = [
      SERVER_REASONS,
      CHANNEL_REASONS,
      CATEGORY_REASONS,
      ROLE_REASONS,
    ].map((catalog) => catalog.name_required);

    expect(new Set(porEntidad).size).toBe(4);
  });

  it("el mensaje del icono usa el limite real, no un numero a mano", () => {
    expect(SERVER_REASONS.icon_too_large).toContain(`${MAX_ICON_FILE_MB} MB`);
    expect(SERVER_REASONS.icon_too_large).not.toContain("20 MB");
  });

  it("los formatos del icono salen de la lista permitida", () => {
    // El backend de servers acepta webp y NO gif: el mensaje tiene que decirlo.
    expect(SERVER_REASONS.icon_unsupported_type).toContain("WEBP");
    expect(SERVER_REASONS.icon_unsupported_type).not.toContain("GIF");
  });

  it("el limite de usos dice lo mismo que la validacion del front", () => {
    expect(INVITE_REASONS.max_uses_invalid).toBe(validateMaxUses("0"));
  });

  it("el rechazo de formato dice lo mismo que la validacion del front", () => {
    expect(SERVER_REASONS.icon_unsupported_type).toBe(
      validateServerIcon({ mimeType: "image/gif", sizeBytes: 1000 }),
    );
  });

  it("el mensaje de transferencia no nombra ninguna interfaz", () => {
    expect(TRANSFER_REASONS.required).not.toMatch(/ID|selector|lista/);
  });
});

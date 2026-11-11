import { describe, expect, it } from "vitest";

import { ANIMATED_SERVER_ICON_LOCKED } from "../messages/boost";

import {
  serverIconTypes,
  validateServerBanner,
  validateServerIcon,
} from "./image";

const MB = 1024 * 1024;
const gif = { mimeType: "image/gif", sizeBytes: MB };
const png = { mimeType: "image/png", sizeBytes: MB };

describe("serverIconTypes", () => {
  it("sin nivel 1 no incluye GIF", () => {
    expect(serverIconTypes(0)).not.toContain("image/gif");
  });

  it("desde el nivel 1 incluye GIF", () => {
    expect(serverIconTypes(1)).toContain("image/gif");
    expect(serverIconTypes(3)).toContain("image/gif");
  });
});

describe("validateServerIcon", () => {
  it("acepta PNG en cualquier nivel", () => {
    expect(validateServerIcon(png)).toBeUndefined();
    expect(validateServerIcon(png, { boostLevel: 2 })).toBeUndefined();
  });

  it("un GIF sin nivel 1 pide el nivel, no otro formato", () => {
    expect(validateServerIcon(gif)).toBe(ANIMATED_SERVER_ICON_LOCKED);
    expect(validateServerIcon(gif, { boostLevel: 0 })).toBe(
      ANIMATED_SERVER_ICON_LOCKED,
    );
  });

  it("un GIF con nivel 1 pasa", () => {
    expect(validateServerIcon(gif, { boostLevel: 1 })).toBeUndefined();
  });

  it("el límite de tamaño sigue aplicando al GIF", () => {
    expect(
      validateServerIcon(
        { mimeType: "image/gif", sizeBytes: 6 * MB },
        { boostLevel: 1 },
      ),
    ).toBe("El archivo no puede pesar más de 5 MB.");
  });

  it("un formato no soportado nombra los que sí", () => {
    expect(
      validateServerIcon(
        { mimeType: "image/bmp", sizeBytes: MB },
        { boostLevel: 1 },
      ),
    ).toBe("La imagen debe ser PNG, JPEG, WEBP o GIF.");
  });
});

describe("validateServerBanner", () => {
  it("nunca acepta GIF", () => {
    expect(validateServerBanner(gif)).toBe(
      "La imagen debe ser PNG, JPEG o WEBP.",
    );
  });
});

import { describe, expect, it } from "vitest";

import {
  EMOJI_IMAGE_REQUIRED,
  EMOJI_IMAGE_TOO_LARGE,
  EMOJI_IMAGE_UNSUPPORTED,
  EMOJI_NAME_INVALID,
} from "../messages/emoji";

import {
  isAnimatedEmojiType,
  suggestEmojiName,
  validateEmojiImage,
  validateEmojiName,
} from "./emoji";

describe("validateEmojiName", () => {
  it("acepta de 2 a 32 letras, numeros y guiones bajos", () => {
    expect(validateEmojiName("ok")).toBeUndefined();
    expect(validateEmojiName("festejo_2026")).toBeUndefined();
    expect(validateEmojiName("a".repeat(32))).toBeUndefined();
  });

  it("rechaza los largos de los bordes", () => {
    expect(validateEmojiName("a")).toBe(EMOJI_NAME_INVALID);
    expect(validateEmojiName("a".repeat(33))).toBe(EMOJI_NAME_INVALID);
    expect(validateEmojiName("")).toBe(EMOJI_NAME_INVALID);
  });

  it("rechaza tildes, espacios y guiones, como el back", () => {
    expect(validateEmojiName("ñandú")).toBe(EMOJI_NAME_INVALID);
    expect(validateEmojiName("mi emoji")).toBe(EMOJI_NAME_INVALID);
    expect(validateEmojiName("mi-emoji")).toBe(EMOJI_NAME_INVALID);
    expect(validateEmojiName("🎉")).toBe(EMOJI_NAME_INVALID);
  });

  it("recorta los espacios de los bordes antes de validar", () => {
    expect(validateEmojiName("  festejo  ")).toBeUndefined();
  });
});

describe("validateEmojiImage", () => {
  const image = (mimeType: string, mb: number) => ({
    mimeType,
    sizeBytes: Math.round(mb * 1024 * 1024),
  });

  it("acepta PNG, WebP y GIF de hasta 5 MB", () => {
    expect(validateEmojiImage(image("image/png", 0.1))).toBeUndefined();
    expect(validateEmojiImage(image("image/webp", 1))).toBeUndefined();
    expect(validateEmojiImage(image("image/gif", 5))).toBeUndefined();
  });

  it("pide una imagen si todavia no se eligio", () => {
    expect(validateEmojiImage(undefined)).toBe(EMOJI_IMAGE_REQUIRED);
  });

  it("rechaza otros formatos y lo que pasa los 5 MB", () => {
    expect(validateEmojiImage(image("image/jpeg", 0.1))).toBe(
      EMOJI_IMAGE_UNSUPPORTED,
    );
    expect(validateEmojiImage(image("text/plain", 0.1))).toBe(
      EMOJI_IMAGE_UNSUPPORTED,
    );
    expect(validateEmojiImage(image("image/gif", 5.2))).toBe(
      EMOJI_IMAGE_TOO_LARGE,
    );
  });
});

describe("isAnimatedEmojiType", () => {
  it("solo el GIF queda animado", () => {
    expect(isAnimatedEmojiType("image/gif")).toBe(true);
    expect(isAnimatedEmojiType("image/webp")).toBe(false);
  });
});

describe("suggestEmojiName", () => {
  it("saca la extension", () => {
    expect(suggestEmojiName("festejo.png")).toBe("festejo");
    expect(suggestEmojiName("mate.gif")).toBe("mate");
  });

  it("cambia por guion bajo lo que el back no acepta", () => {
    expect(suggestEmojiName("mi emoji (1).png")).toBe("mi_emoji_1");
    expect(suggestEmojiName("ñandú feliz.webp")).toBe("and_feliz");
  });

  it("recorta a 32 caracteres", () => {
    expect(suggestEmojiName(`${"a".repeat(40)}.png`)).toBe("a".repeat(32));
  });

  it("deja el campo vacio si no sale un nombre valido", () => {
    expect(suggestEmojiName("a.png")).toBe("");
    expect(suggestEmojiName("🎉.png")).toBe("");
    expect(suggestEmojiName(".gitkeep")).toBe("gitkeep");
  });
});

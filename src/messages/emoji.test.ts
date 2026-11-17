import { describe, expect, it } from "vitest";

import type { ApiFailure } from "../domain/api-result";

import { EMOJI_DELETE_FAILED, EMOJIS_LOAD_FAILED } from "./actions";
import {
  EMOJI_IMAGE_TOO_LARGE,
  EMOJI_IMAGE_UNSUPPORTED,
  EMOJI_LIMIT_REACHED,
  EMOJI_NAME_INVALID,
  EMOJI_NAME_TAKEN,
  EMOJI_NOT_FOUND,
  EMOJI_UPLOAD_COPY,
  emojiAuthorLabel,
  emojiAuthorShortLabel,
  emojiDeleteTitle,
  emojiFileDetail,
  emojiLabel,
  emojiCapacityTitleFor,
  emojiSlotsTotalLabel,
  emojiSlotsHint,
  emojiUploadErrorFor,
  emojisSectionTitleFor,
  deleteEmojiFailureMessage,
  listEmojisFailureMessage,
} from "./emoji";
import { NETWORK_ERROR_MESSAGE, SESSION_EXPIRED_MESSAGE } from "./errors";
import { NO_PERMISSION_EMOJIS } from "./permissions";

const failure = (
  status: number,
  details?: Record<string, unknown>,
): ApiFailure => ({ ok: false, status, code: status, message: "", details });

describe("textos de la seccion", () => {
  it("titula con el nombre del servidor y muestra el emoji como se escribe", () => {
    expect(emojisSectionTitleFor("Club de lectura")).toBe(
      "Emojis personalizados de Club de lectura",
    );
    expect(emojiLabel("festejo")).toBe(":festejo:");
  });

  it("la capacidad lleva el nombre del servidor y el tope de lugares", () => {
    expect(emojiCapacityTitleFor("Física")).toBe("Capacidad de Física");
    expect(emojiSlotsTotalLabel(70)).toBe("/ 70 lugares usados");
  });

  it("el nivel 1 explica los 20 lugares extra segun si ya los tiene", () => {
    expect(emojiSlotsHint(0)).toBe("El nivel 1 suma 20 lugares.");
    expect(emojiSlotsHint(1)).toBe(
      "Incluye 20 lugares por los boosts del servidor.",
    );
    expect(emojiSlotsHint(3)).toBe(
      "Incluye 20 lugares por los boosts del servidor.",
    );
  });

  it("el formulario repite los formatos y el peso que acepta el back", () => {
    expect(EMOJI_UPLOAD_COPY.description).toBe(
      "PNG, WEBP o GIF de hasta 5 MB. Los GIF quedan animados.",
    );
    expect(EMOJI_UPLOAD_COPY.nameHelp).toBe(
      "Entre 2 y 32 letras, números o guiones bajos.",
    );
  });

  it("el archivo elegido dice peso, formato y si queda animado", () => {
    expect(emojiFileDetail("84 KB", "image/png", false)).toBe(
      "84 KB · PNG · estático",
    );
    expect(emojiFileDetail("1.2 MB", "image/gif", true)).toBe(
      "1.2 MB · GIF · animado",
    );
  });

  it("al borrar nombra el emoji", () => {
    expect(emojiDeleteTitle("festejo")).toBe("¿Eliminar :festejo:?");
  });
});

describe("quien subio el emoji", () => {
  const createdAt = "2026-11-03T12:00:00Z";

  it("nombra a quien lo subio con la fecha", () => {
    expect(emojiAuthorLabel("Ana", createdAt)).toBe("Subido por Ana · 3 nov");
    expect(emojiAuthorShortLabel("Ana", createdAt)).toBe("Ana · 3 nov");
  });

  it("si ya no esta en el servidor no inventa un nombre", () => {
    expect(emojiAuthorLabel(null, createdAt)).toBe(
      "Subido por un exmiembro · 3 nov",
    );
    expect(emojiAuthorShortLabel(null, createdAt)).toBe("Exmiembro · 3 nov");
  });

  it("sin fecha valida muestra solo el nombre", () => {
    expect(emojiAuthorLabel("Ana", "")).toBe("Subido por Ana");
  });
});

describe("emojiUploadErrorFor", () => {
  it("manda al campo nombre lo que el back marca en el nombre", () => {
    expect(
      emojiUploadErrorFor({ field: "name", reason: "emoji_name_invalid" }, 400),
    ).toEqual({ field: "name", message: EMOJI_NAME_INVALID });
    expect(
      emojiUploadErrorFor({ field: "name", reason: "emoji_name_taken" }, 409),
    ).toEqual({ field: "name", message: EMOJI_NAME_TAKEN });
  });

  it("manda al campo imagen el formato y el peso", () => {
    expect(
      emojiUploadErrorFor(
        { field: "image", reason: "emoji_image_unsupported" },
        400,
      ),
    ).toEqual({ field: "image", message: EMOJI_IMAGE_UNSUPPORTED });
    expect(
      emojiUploadErrorFor(
        { field: "image", reason: "emoji_image_too_large" },
        400,
      ),
    ).toEqual({ field: "image", message: EMOJI_IMAGE_TOO_LARGE });
  });

  it("deduce el campo del reason cuando el back no lo manda", () => {
    expect(emojiUploadErrorFor({ reason: "emoji_name_taken" }, 409).field).toBe(
      "name",
    );
    expect(
      emojiUploadErrorFor({ reason: "emoji_image_too_large" }, 400).field,
    ).toBe("image");
  });

  it("el limite y el permiso van arriba del formulario", () => {
    expect(emojiUploadErrorFor({ reason: "emoji_limit_reached" }, 409)).toEqual(
      { field: "form", message: EMOJI_LIMIT_REACHED },
    );
    expect(emojiUploadErrorFor(undefined, 403)).toEqual({
      field: "form",
      message: NO_PERMISSION_EMOJIS,
    });
  });

  it("sin reason cae al estado de la respuesta", () => {
    expect(emojiUploadErrorFor(undefined, 0).message).toBe(
      NETWORK_ERROR_MESSAGE,
    );
    expect(emojiUploadErrorFor(undefined, 401).message).toBe(
      SESSION_EXPIRED_MESSAGE,
    );
    expect(emojiUploadErrorFor(undefined, 404).message).toBe(EMOJI_NOT_FOUND);
    expect(emojiUploadErrorFor(undefined, 500).message).toBe(
      "No pudimos subir el emoji. Intentá de nuevo.",
    );
  });
});

describe("fallos de la lista y del borrado", () => {
  it("la lista cae al texto generico", () => {
    expect(listEmojisFailureMessage(failure(500))).toBe(EMOJIS_LOAD_FAILED);
    expect(listEmojisFailureMessage(failure(401))).toBe(
      SESSION_EXPIRED_MESSAGE,
    );
  });

  it("borrar distingue el emoji que ya no existe y el permiso", () => {
    expect(
      deleteEmojiFailureMessage(failure(404, { reason: "emoji_not_found" })),
    ).toBe(EMOJI_NOT_FOUND);
    expect(deleteEmojiFailureMessage(failure(403))).toBe(NO_PERMISSION_EMOJIS);
    expect(deleteEmojiFailureMessage(failure(500))).toBe(EMOJI_DELETE_FAILED);
  });
});

import { describe, expect, it } from "vitest";

import {
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS_PER_MESSAGE,
} from "../constants/attachments";

import {
  ATTACHMENT_TOO_LARGE,
  ATTACHMENT_UNSUPPORTED_TYPE,
  validateAttachment,
  validateAttachmentCount,
} from "./attachment";

describe("validateAttachment", () => {
  it("acepta imagenes JPEG, PNG, WebP y PDF dentro del tamaño", () => {
    for (const type of [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ]) {
      expect(validateAttachment({ type, size: 1024 })).toBeUndefined();
    }
  });

  it("acepta justo el tamaño maximo", () => {
    expect(
      validateAttachment({ type: "image/png", size: MAX_ATTACHMENT_BYTES }),
    ).toBeUndefined();
  });

  it("rechaza un formato no permitido (CA2)", () => {
    expect(validateAttachment({ type: "application/zip", size: 10 })).toBe(
      ATTACHMENT_UNSUPPORTED_TYPE,
    );
    expect(validateAttachment({ type: "image/gif", size: 10 })).toBe(
      ATTACHMENT_UNSUPPORTED_TYPE,
    );
    expect(validateAttachment({ type: "", size: 10 })).toBe(
      ATTACHMENT_UNSUPPORTED_TYPE,
    );
  });

  it("rechaza un archivo demasiado grande (CA3)", () => {
    expect(
      validateAttachment({
        type: "application/pdf",
        size: MAX_ATTACHMENT_BYTES + 1,
      }),
    ).toBe(ATTACHMENT_TOO_LARGE);
  });

  it("rechaza un archivo vacio", () => {
    expect(validateAttachment({ type: "image/png", size: 0 })).toBeDefined();
  });
});

describe("validateAttachmentCount", () => {
  it("deja llegar hasta el tope", () => {
    expect(
      validateAttachmentCount(MAX_ATTACHMENTS_PER_MESSAGE - 1, 1),
    ).toBeUndefined();
  });

  it("rechaza pasarse del tope", () => {
    expect(
      validateAttachmentCount(MAX_ATTACHMENTS_PER_MESSAGE, 1),
    ).toBeDefined();
  });
});

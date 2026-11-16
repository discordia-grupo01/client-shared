import { describe, expect, it } from "vitest";

import {
  BOOSTED_MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS_PER_MESSAGE,
  PREMIUM_MAX_ATTACHMENT_BYTES,
} from "../constants/attachments";

import {
  ATTACHMENT_UNSUPPORTED_TYPE,
  attachmentTooLargeMessage,
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
    ).toBe("Pesa 10,1 MB. El límite es 10 MB.");
  });

  it("rechaza un archivo vacio", () => {
    expect(validateAttachment({ type: "image/png", size: 0 })).toBeDefined();
  });

  describe("con Premium", () => {
    const premium = { premium: true };

    it("acepta GIF", () => {
      expect(
        validateAttachment({ type: "image/gif", size: 1024 }, premium),
      ).toBeUndefined();
    });

    it("acepta justo 50 MB y rechaza un byte mas", () => {
      expect(
        validateAttachment(
          { type: "application/pdf", size: PREMIUM_MAX_ATTACHMENT_BYTES },
          premium,
        ),
      ).toBeUndefined();
      expect(
        validateAttachment(
          { type: "application/pdf", size: PREMIUM_MAX_ATTACHMENT_BYTES + 1 },
          premium,
        ),
      ).toBe("Pesa 50,1 MB. El límite es 50 MB.");
    });

    it("sigue rechazando otros formatos", () => {
      expect(
        validateAttachment({ type: "application/zip", size: 10 }, premium),
      ).toBe(ATTACHMENT_UNSUPPORTED_TYPE);
    });
  });
});

describe("validateAttachment en un servidor", () => {
  const pdf = (size: number) => ({ type: "application/pdf", size });
  const MB = 1024 * 1024;

  it("en nivel 0 y 1 corta en 10 MB y lo dice", () => {
    for (const serverLevel of [0, 1] as const) {
      expect(
        validateAttachment(pdf(MAX_ATTACHMENT_BYTES), { serverLevel }),
      ).toBeUndefined();
      expect(validateAttachment(pdf(18 * MB), { serverLevel })).toBe(
        "Pesa 18 MB. En este servidor el límite es 10 MB.",
      );
    }
  });

  it("en nivel 2 y 3 acepta hasta 25 MB", () => {
    for (const serverLevel of [2, 3] as const) {
      expect(
        validateAttachment(pdf(BOOSTED_MAX_ATTACHMENT_BYTES), { serverLevel }),
      ).toBeUndefined();
      expect(
        validateAttachment(pdf(BOOSTED_MAX_ATTACHMENT_BYTES + 1), {
          serverLevel,
        }),
      ).toBe("Pesa 25,1 MB. En este servidor el límite es 25 MB.");
    }
  });

  it("con Premium vale 50 MB en cualquier nivel", () => {
    for (const serverLevel of [0, 1, 2, 3] as const) {
      expect(
        validateAttachment(pdf(PREMIUM_MAX_ATTACHMENT_BYTES), {
          serverLevel,
          premium: true,
        }),
      ).toBeUndefined();
    }
  });

  it("los boosts no habilitan GIF", () => {
    expect(
      validateAttachment({ type: "image/gif", size: 10 }, { serverLevel: 3 }),
    ).toBe(ATTACHMENT_UNSUPPORTED_TYPE);
  });

  it("redondea el peso para arriba para no igualar el límite", () => {
    expect(attachmentTooLargeMessage(MAX_ATTACHMENT_BYTES + 1)).toBe(
      "Pesa 10,1 MB. El límite es 10 MB.",
    );
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

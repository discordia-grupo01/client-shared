import { describe, expect, it } from "vitest";

import {
  attachmentLimitMbFor,
  BOOST_TABLE_ROWS,
  canBoostAttachmentLimit,
  canOfferPremiumForAttachment,
  emojiSlotsFor,
  serverAttachmentMbFor,
} from "./boost";

describe("emojis y adjuntos por nivel", () => {
  it("el nivel 1 suma 20 emojis personalizados", () => {
    expect(emojiSlotsFor(0)).toBe(50);
    expect(emojiSlotsFor(1)).toBe(70);
    expect(emojiSlotsFor(3)).toBe(70);
  });

  it("el nivel 2 sube los adjuntos a 25 MB", () => {
    expect(serverAttachmentMbFor(1)).toBe(10);
    expect(serverAttachmentMbFor(2)).toBe(25);
  });
});

describe("límite de adjuntos por nivel y Premium", () => {
  it.each([
    [0, false, 10],
    [1, false, 10],
    [2, false, 25],
    [3, false, 25],
    [0, true, 50],
    [1, true, 50],
    [2, true, 50],
    [3, true, 50],
  ] as const)("nivel %i, Premium %s: %i MB", (level, premium, mb) => {
    expect(serverAttachmentMbFor(level, premium)).toBe(mb);
    expect(attachmentLimitMbFor({ serverLevel: level, premium })).toBe(mb);
  });

  it("en un mensaje directo no cuentan los boosts", () => {
    expect(attachmentLimitMbFor()).toBe(10);
    expect(attachmentLimitMbFor({ premium: true })).toBe(50);
  });

  it("ofrece el nivel 2 solo si agrandaría el límite", () => {
    expect(canBoostAttachmentLimit({ serverLevel: 0 })).toBe(true);
    expect(canBoostAttachmentLimit({ serverLevel: 1 })).toBe(true);
    expect(canBoostAttachmentLimit({ serverLevel: 2 })).toBe(false);
    expect(canBoostAttachmentLimit({ serverLevel: 3 })).toBe(false);
    expect(canBoostAttachmentLimit({ serverLevel: 1, premium: true })).toBe(
      false,
    );
    expect(canBoostAttachmentLimit()).toBe(false);
  });
});

describe("canOfferPremiumForAttachment", () => {
  it("ofrece Premium solo en un DM y si todavía no lo tiene", () => {
    expect(canOfferPremiumForAttachment()).toBe(true);
    expect(canOfferPremiumForAttachment({ premium: true })).toBe(false);
  });

  it("en un servidor no lo ofrece, ahí manda la tarjeta de boosts", () => {
    for (const serverLevel of [0, 1, 2, 3] as const) {
      expect(canOfferPremiumForAttachment({ serverLevel })).toBe(false);
    }
  });
});

describe("BOOST_TABLE_ROWS", () => {
  it("tiene una fila por beneficio y una celda por nivel", () => {
    expect(BOOST_TABLE_ROWS).toHaveLength(6);
    for (const row of BOOST_TABLE_ROWS) expect(row.cells).toHaveLength(4);
  });

  it("muestra cantidades para emojis y adjuntos", () => {
    const emojis = BOOST_TABLE_ROWS.find(
      (row) => row.perk === "extra_emoji_slots",
    );
    const attachments = BOOST_TABLE_ROWS.find(
      (row) => row.perk === "larger_attachments",
    );
    expect(
      emojis?.cells.map((cell) => cell.kind === "amount" && cell.value),
    ).toEqual(["50", "70", "70", "70"]);
    expect(
      attachments?.cells.map((cell) => cell.kind === "amount" && cell.value),
    ).toEqual(["10 MB", "10 MB", "25 MB", "25 MB"]);
  });

  it("marca desde qué nivel se incluye cada beneficio", () => {
    const banner = BOOST_TABLE_ROWS.find((row) => row.perk === "custom_banner");
    expect(banner?.cells).toEqual([
      { kind: "check", included: false },
      { kind: "check", included: false },
      { kind: "check", included: true },
      { kind: "check", included: true },
    ]);
  });
});

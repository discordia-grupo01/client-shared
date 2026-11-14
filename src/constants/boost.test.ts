import { describe, expect, it } from "vitest";

import {
  BOOST_TABLE_ROWS,
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

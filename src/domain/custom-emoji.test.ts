import { describe, expect, it } from "vitest";

import {
  canUseCustomEmoji,
  customEmojiIdsIn,
  customEmojiToken,
  isCustomEmojiToken,
  needsPremiumForCustomEmoji,
  parseCustomEmojiTokens,
} from "./custom-emoji";

const MATE = "0f1d3a9e-2b4c-4d7e-8a1b-5c6d7e8f9012";
const FESTEJO = "7a2b4c6d-8e0f-4a1b-9c3d-5e7f9a1b3c5d";

describe("customEmojiToken", () => {
  it("marca con `a` los animados", () => {
    expect(customEmojiToken({ id: MATE, name: "mate", animated: false })).toBe(
      `<:mate:${MATE}>`,
    );
    expect(
      customEmojiToken({ id: FESTEJO, name: "festejo", animated: true }),
    ).toBe(`<a:festejo:${FESTEJO}>`);
  });
});

describe("parseCustomEmojiTokens", () => {
  it("encuentra los tokens del texto, sin repetir", () => {
    const text = `hola <:mate:${MATE}> y <a:festejo:${FESTEJO}> y otra vez <:mate:${MATE}>`;

    expect(parseCustomEmojiTokens(text)).toEqual([
      { text: `<:mate:${MATE}>`, id: MATE, name: "mate", animated: false },
      {
        text: `<a:festejo:${FESTEJO}>`,
        id: FESTEJO,
        name: "festejo",
        animated: true,
      },
    ]);
  });

  it("ignora lo que no tiene la forma exacta", () => {
    expect(parseCustomEmojiTokens("<:mate:123>")).toEqual([]);
    expect(parseCustomEmojiTokens(`<:ma te:${MATE}>`)).toEqual([]);
    expect(parseCustomEmojiTokens(`<:m:${MATE}>`)).toEqual([]);
    expect(parseCustomEmojiTokens(":mate:")).toEqual([]);
  });

  it("junta los ids para pedirle las imagenes al back", () => {
    expect(customEmojiIdsIn(`<:mate:${MATE}> <a:festejo:${FESTEJO}>`)).toEqual([
      MATE,
      FESTEJO,
    ]);
  });
});

describe("isCustomEmojiToken", () => {
  it("una reaccion es el token entero y nada mas", () => {
    expect(isCustomEmojiToken(`<:mate:${MATE}>`)).toBe(true);
    expect(isCustomEmojiToken(`<a:festejo:${FESTEJO}>`)).toBe(true);
    expect(isCustomEmojiToken(`hola <:mate:${MATE}>`)).toBe(false);
    expect(isCustomEmojiToken("👍")).toBe(false);
  });
});

describe("cuando hace falta Premium", () => {
  const estatico = { animated: false, server_id: "s1" };
  const animado = { animated: true, server_id: "s1" };

  it("en su propio servidor, el estatico lo usa cualquiera", () => {
    expect(needsPremiumForCustomEmoji(estatico, "s1")).toBe(false);
  });

  it("el animado, el de otro servidor y el mensaje directo piden Premium", () => {
    expect(needsPremiumForCustomEmoji(animado, "s1")).toBe(true);
    expect(needsPremiumForCustomEmoji(estatico, "s2")).toBe(true);
    expect(needsPremiumForCustomEmoji(estatico, null)).toBe(true);
  });

  it("con Premium se puede usar cualquiera", () => {
    expect(
      canUseCustomEmoji({ emoji: animado, serverId: null, isPremium: true }),
    ).toBe(true);
    expect(
      canUseCustomEmoji({ emoji: animado, serverId: "s1", isPremium: false }),
    ).toBe(false);
    expect(
      canUseCustomEmoji({ emoji: estatico, serverId: "s1", isPremium: false }),
    ).toBe(true);
  });
});

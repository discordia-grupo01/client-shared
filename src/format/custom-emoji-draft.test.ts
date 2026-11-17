import { describe, expect, it } from "vitest";

import {
  customEmojiDraftText,
  encodeDraft,
  matchPickedEmojis,
} from "./custom-emoji-draft";

const MATE = {
  id: "0f1d3a9e-2b4c-4d7e-8a1b-5c6d7e8f9012",
  name: "mate",
  animated: false,
};
const FESTEJO = {
  id: "7a2b4c6d-8e0f-4a1b-9c3d-5e7f9a1b3c5d",
  name: "festejo",
  animated: true,
};

describe("customEmojiDraftText", () => {
  it("en el borrador se ve el nombre, no el id", () => {
    expect(customEmojiDraftText(MATE)).toBe(":mate:");
  });
});

describe("matchPickedEmojis", () => {
  it("encuentra cada aparicion del elegido", () => {
    expect(
      matchPickedEmojis("tomá :mate: y otro :mate:", [MATE]).map(
        (m) => m.start,
      ),
    ).toEqual([5, 19]);
  });

  it("ignora los que no se eligieron", () => {
    expect(matchPickedEmojis("hola :mate:", [])).toEqual([]);
  });

  it("no toca lo que está dentro de código", () => {
    expect(
      matchPickedEmojis("`:mate:`", [MATE], [{ start: 0, end: 8 }]),
    ).toEqual([]);
  });
});

describe("encodeDraft", () => {
  it("manda el token con el id y la marca de animado", () => {
    expect(encodeDraft("listo :mate:", [], [MATE])).toBe(
      `listo <:mate:${MATE.id}>`,
    );
    expect(encodeDraft(":festejo:", [], [FESTEJO])).toBe(
      `<a:festejo:${FESTEJO.id}>`,
    );
  });

  it("convive con las menciones en una sola pasada", () => {
    expect(
      encodeDraft(
        "@Ana :mate: listo",
        [{ kind: "user", id: "u1", label: "Ana" }],
        [MATE],
      ),
    ).toBe(`<@u1> <:mate:${MATE.id}> listo`);
  });

  it("lo escrito a mano queda como texto", () => {
    expect(encodeDraft("hola :mate:", [], [])).toBe("hola :mate:");
  });
});

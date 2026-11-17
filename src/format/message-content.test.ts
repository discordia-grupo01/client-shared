import { describe, expect, it } from "vitest";

import { isEmojiOnlyContent, tokenizeMessageContent } from "./message-content";

const ROLE_ID = "3b1c2d4e-1111-4222-8333-444455556666";

describe("tokenizeMessageContent", () => {
  it("texto sin menciones queda en un solo token", () => {
    expect(tokenizeMessageContent("hola a todos")).toEqual([
      { kind: "text", value: "hola a todos" },
    ]);
  });

  it("reconoce la mencion a un usuario con su id", () => {
    expect(tokenizeMessageContent("Hola <@u_9f2>, mirá")).toEqual([
      { kind: "text", value: "Hola " },
      { kind: "user", value: "<@u_9f2>", id: "u_9f2" },
      { kind: "text", value: ", mirá" },
    ]);
  });

  it("reconoce la mencion a un rol con su id", () => {
    expect(tokenizeMessageContent(`<@&${ROLE_ID}> reunión`)).toEqual([
      { kind: "role", value: `<@&${ROLE_ID}>`, id: ROLE_ID },
      { kind: "text", value: " reunión" },
    ]);
  });

  it("un rol no se confunde con un usuario", () => {
    const [token] = tokenizeMessageContent(`<@&${ROLE_ID}>`);
    expect(token.kind).toBe("role");
  });

  it("reconoce @everyone suelto", () => {
    expect(tokenizeMessageContent("hola @everyone, ojo")).toEqual([
      { kind: "text", value: "hola " },
      { kind: "everyone", value: "@everyone" },
      { kind: "text", value: ", ojo" },
    ]);
  });

  it("@everyone al principio del texto", () => {
    expect(tokenizeMessageContent("@everyone hola")[0]).toEqual({
      kind: "everyone",
      value: "@everyone",
    });
  });

  it("no toma @everyone pegado a letras ni a otros simbolos", () => {
    for (const text of ["hola@everyone", "@everyones", "a@everyone-x"]) {
      expect(tokenizeMessageContent(text)).toEqual([
        { kind: "text", value: text },
      ]);
    }
  });

  it("@Nombre escrito a mano es texto, no una mencion", () => {
    expect(tokenizeMessageContent("hola @Ana")).toEqual([
      { kind: "text", value: "hola @Ana" },
    ]);
  });

  it("@here no es una mencion", () => {
    expect(tokenizeMessageContent("hola @here")).toEqual([
      { kind: "text", value: "hola @here" },
    ]);
  });

  it("separa las referencias a canales", () => {
    expect(tokenizeMessageContent("revisá #anuncios ya")).toEqual([
      { kind: "text", value: "revisá " },
      { kind: "channel", value: "#anuncios" },
      { kind: "text", value: " ya" },
    ]);
  });

  it("deja afuera el punto final de un canal", () => {
    expect(tokenizeMessageContent("mirá #anuncios.")).toEqual([
      { kind: "text", value: "mirá " },
      { kind: "channel", value: "#anuncios" },
      { kind: "text", value: "." },
    ]);
  });

  it("mezcla varias menciones en un mensaje", () => {
    const kinds = tokenizeMessageContent(
      `<@a1> <@&${ROLE_ID}> @everyone #general`,
    )
      .filter((token) => token.kind !== "text")
      .map((token) => token.kind);
    expect(kinds).toEqual(["user", "role", "everyone", "channel"]);
  });
});

const MATE_ID = "0f1d3a9e-2b4c-4d7e-8a1b-5c6d7e8f9012";

describe("emojis personalizados", () => {
  it("los separa del texto con su nombre y su id", () => {
    expect(tokenizeMessageContent(`tomá <:mate:${MATE_ID}>`)).toEqual([
      { kind: "text", value: "tomá " },
      {
        kind: "custom_emoji",
        value: `<:mate:${MATE_ID}>`,
        id: MATE_ID,
        name: "mate",
        animated: false,
      },
    ]);
  });

  it("marca los animados", () => {
    const [token] = tokenizeMessageContent(`<a:mate:${MATE_ID}>`);
    expect(token).toEqual({
      kind: "custom_emoji",
      value: `<a:mate:${MATE_ID}>`,
      id: MATE_ID,
      name: "mate",
      animated: true,
    });
  });

  it("lo que no tiene la forma exacta queda como texto", () => {
    expect(tokenizeMessageContent(":mate:")).toEqual([
      { kind: "text", value: ":mate:" },
    ]);
  });
});

describe("isEmojiOnlyContent", () => {
  it("es cierto con emojis unicode, personalizados o los dos", () => {
    expect(isEmojiOnlyContent("😀")).toBe(true);
    expect(isEmojiOnlyContent("😀 🎉  🥳")).toBe(true);
    expect(isEmojiOnlyContent(`<:mate:${MATE_ID}>`)).toBe(true);
    expect(isEmojiOnlyContent(`😀 <a:mate:${MATE_ID}>`)).toBe(true);
    expect(isEmojiOnlyContent("1️⃣")).toBe(true);
  });

  it("es falso si hay texto, menciones o nada", () => {
    expect(isEmojiOnlyContent("hola 😀")).toBe(false);
    expect(isEmojiOnlyContent("1")).toBe(false);
    expect(isEmojiOnlyContent("<@u_9f2> 😀")).toBe(false);
    expect(isEmojiOnlyContent("   ")).toBe(false);
    expect(isEmojiOnlyContent("")).toBe(false);
  });
});

import { describe, expect, it } from "vitest";

import { tokenizeMessageContent } from "./message-content";

describe("tokenizeMessageContent", () => {
  it("texto sin menciones queda en un solo token", () => {
    expect(tokenizeMessageContent("hola a todos")).toEqual([
      { kind: "text", value: "hola a todos" },
    ]);
  });

  it("separa menciones y canales", () => {
    expect(
      tokenizeMessageContent("Hey @NightOwl_42 revisá #anuncios ya"),
    ).toEqual([
      { kind: "text", value: "Hey " },
      { kind: "mention", value: "@NightOwl_42" },
      { kind: "text", value: " revisá " },
      { kind: "channel", value: "#anuncios" },
      { kind: "text", value: " ya" },
    ]);
  });

  it("reconoce una mencion al principio", () => {
    expect(tokenizeMessageContent("@Ana hola")[0]).toEqual({
      kind: "mention",
      value: "@Ana",
    });
  });

  it("deja afuera el punto final", () => {
    expect(tokenizeMessageContent("gracias @Ana.")).toEqual([
      { kind: "text", value: "gracias " },
      { kind: "mention", value: "@Ana" },
      { kind: "text", value: "." },
    ]);
  });

  it("acepta letras acentuadas", () => {
    expect(tokenizeMessageContent("@Martín")).toEqual([
      { kind: "mention", value: "@Martín" },
    ]);
  });

  it("no toma un mail como mencion", () => {
    expect(tokenizeMessageContent("escribime a ana@mail.com")).toEqual([
      { kind: "text", value: "escribime a ana@mail.com" },
    ]);
  });

  it("un @ suelto es texto", () => {
    expect(tokenizeMessageContent("a las 5 @ casa")).toEqual([
      { kind: "text", value: "a las 5 @ casa" },
    ]);
  });
});

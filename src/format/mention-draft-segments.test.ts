import { describe, expect, it } from "vitest";

import { draftSegments, mentionChipColors } from "./mention-draft-segments";

const ROLE_ID = "3b1c2d4e-1111-4222-8333-444455556666";
const picked = [
  { kind: "user" as const, id: "u_beto", label: "Beto" },
  { kind: "role" as const, id: ROLE_ID, label: "probando rol" },
];

describe("draftSegments", () => {
  it("sin menciones es un solo tramo de texto", () => {
    expect(draftSegments("hola", [], true)).toEqual([
      { kind: "text", value: "hola" },
    ]);
  });

  it("un borrador vacio no tiene tramos", () => {
    expect(draftSegments("", [], true)).toEqual([]);
  });

  it("marca las menciones elegidas y @everyone con permiso, en orden", () => {
    expect(
      draftSegments("@everyone, @probando rol y @Beto sigo", picked, true),
    ).toEqual([
      { kind: "everyone", value: "@everyone" },
      { kind: "text", value: ", " },
      { kind: "role", id: ROLE_ID, value: "@probando rol" },
      { kind: "text", value: " y " },
      { kind: "user", id: "u_beto", value: "@Beto" },
      { kind: "text", value: " sigo" },
    ]);
  });

  it("sin permiso @everyone queda como texto comun", () => {
    expect(draftSegments("hola @everyone", [], false)).toEqual([
      { kind: "text", value: "hola @everyone" },
    ]);
  });

  it("un @Nombre escrito a mano sin elegirlo no se marca", () => {
    expect(draftSegments("hola @Beto", [], true)).toEqual([
      { kind: "text", value: "hola @Beto" },
    ]);
  });

  it("si se edito el nombre elegido deja de marcarse", () => {
    expect(draftSegments("hola @Betox", picked, true)).toEqual([
      { kind: "text", value: "hola @Betox" },
    ]);
  });

  it("los tramos reconstruyen el texto original", () => {
    const text = "a @Beto b @everyone c";
    const joined = draftSegments(text, picked, true)
      .map((segment) => segment.value)
      .join("");
    expect(joined).toBe(text);
  });
});

describe("mentionChipColors", () => {
  const theme = { sky: "#a8c6df", highlight: "#fce3a4" };

  it("el texto comun no tiene chip", () => {
    expect(mentionChipColors("text", theme)).toBeNull();
  });

  it("usuario en sky, everyone en highlight y rol con su color", () => {
    expect(mentionChipColors("user", theme)?.color).toBe("#a8c6df");
    expect(mentionChipColors("everyone", theme)?.color).toBe("#fce3a4");
    expect(mentionChipColors("role", theme, "#ff8800")?.color).toBe("#ff8800");
  });

  it("un rol sin color valido cae al de usuario", () => {
    expect(mentionChipColors("role", theme, null)?.color).toBe("#a8c6df");
    expect(mentionChipColors("role", theme, "rojo")?.color).toBe("#a8c6df");
  });

  it("el fondo es el mismo color con transparencia", () => {
    expect(mentionChipColors("everyone", theme)?.backgroundColor).toBe(
      "rgba(252, 227, 164, 0.16)",
    );
  });
});

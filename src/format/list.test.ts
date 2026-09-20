import { describe, expect, it } from "vitest";

import type { Channel } from "../domain/channel";

import { channelsOfCategory, getInitial, sortByPosition } from "./list";

function canal(cambios: Partial<Channel> & { id: string }): Channel {
  return {
    name: cambios.id,
    kind: "text",
    position: 0,
    category_id: null,
    topic: null,
    ...cambios,
  };
}

describe("sortByPosition", () => {
  it("ordena por position", () => {
    const ordenado = sortByPosition([
      { id: "c", position: 2 },
      { id: "a", position: 0 },
      { id: "b", position: 1 },
    ]);
    expect(ordenado.map((x) => x.id)).toEqual(["a", "b", "c"]);
  });

  /** Viene de un estado de React: mutarlo no dispara el re-render. */
  it("no muta el array que recibe", () => {
    const original = [
      { id: "b", position: 1 },
      { id: "a", position: 0 },
    ];
    sortByPosition(original);
    expect(original.map((x) => x.id)).toEqual(["b", "a"]);
  });
});

describe("channelsOfCategory", () => {
  const canales = [
    canal({ id: "general", category_id: null, position: 1 }),
    canal({ id: "anuncios", category_id: null, position: 0 }),
    canal({ id: "voz", category_id: "cat1", position: 0 }),
  ];

  it("con null devuelve los que no tienen categoria, ordenados", () => {
    expect(channelsOfCategory(canales, null).map((c) => c.id)).toEqual([
      "anuncios",
      "general",
    ]);
  });

  it("filtra por categoria", () => {
    expect(channelsOfCategory(canales, "cat1").map((c) => c.id)).toEqual([
      "voz",
    ]);
  });

  it("una categoria vacia devuelve una lista vacia", () => {
    expect(channelsOfCategory(canales, "cat9")).toEqual([]);
  });
});

describe("getInitial", () => {
  it("devuelve la primera letra en mayuscula", () => {
    expect(getInitial("discordia")).toBe("D");
    expect(getInitial("  taller  ")).toBe("T");
  });

  it("devuelve null con un nombre vacio", () => {
    expect(getInitial("")).toBeNull();
    expect(getInitial("   ")).toBeNull();
  });

  /** `charAt(0)` devolveria media pareja subrogada: un caracter roto. */
  it("no parte un emoji al medio", () => {
    expect(getInitial("🎮 Gaming")).toBe("🎮");
    expect(getInitial("🎮".charAt(0))).not.toBe("🎮");
  });
});

import { describe, expect, it } from "vitest";

import type { Category } from "../domain/category";
import type { Channel } from "../domain/channel";

import {
  channelsOfCategory,
  getInitial,
  isUnassignedCategory,
  sortByPosition,
  topLevelChannels,
  visibleCategories,
} from "./list";

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

function categoria(cambios: Partial<Category> & { id: string }): Category {
  return {
    server_id: "srv1",
    name: cambios.id,
    position: 0,
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

describe("isUnassignedCategory", () => {
  it("es true solo para la categoria llamada exactamente 'Sin asignar'", () => {
    expect(
      isUnassignedCategory(categoria({ id: "c1", name: "Sin asignar" })),
    ).toBe(true);
    expect(
      isUnassignedCategory(categoria({ id: "c2", name: "Anuncios" })),
    ).toBe(false);
  });
});

describe("visibleCategories", () => {
  it("saca la categoria 'Sin asignar' y deja el resto", () => {
    const categorias = [
      categoria({ id: "c1", name: "Sin asignar" }),
      categoria({ id: "c2", name: "Canales de texto" }),
      categoria({ id: "c3", name: "Canales de voz" }),
    ];
    expect(visibleCategories(categorias).map((c) => c.id)).toEqual([
      "c2",
      "c3",
    ]);
  });
});

describe("topLevelChannels", () => {
  const categorias = [
    categoria({ id: "unassigned", name: "Sin asignar" }),
    categoria({ id: "cat1", name: "Canales de texto" }),
  ];

  it("junta los canales sin categoria y los de 'Sin asignar', ordenados", () => {
    const canales = [
      canal({ id: "en-unassigned", category_id: "unassigned", position: 1 }),
      canal({ id: "sin-categoria", category_id: null, position: 0 }),
      canal({ id: "en-cat1", category_id: "cat1", position: 0 }),
    ];
    expect(topLevelChannels(canales, categorias).map((c) => c.id)).toEqual([
      "sin-categoria",
      "en-unassigned",
    ]);
  });

  it("sin categoria 'Sin asignar' en el server, solo junta los null", () => {
    const canales = [
      canal({ id: "sin-categoria", category_id: null }),
      canal({ id: "en-cat1", category_id: "cat1" }),
    ];
    expect(topLevelChannels(canales, [categorias[1]]).map((c) => c.id)).toEqual(
      ["sin-categoria"],
    );
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

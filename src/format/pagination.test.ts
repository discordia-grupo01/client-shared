import { describe, expect, it } from "vitest";

import {
  clampPage,
  pageCountOf,
  pageRange,
  paginate,
  visiblePages,
} from "./pagination";

describe("pageCountOf", () => {
  it("redondea hacia arriba", () => {
    expect(pageCountOf(21, 10)).toBe(3);
    expect(pageCountOf(20, 10)).toBe(2);
  });

  it("una lista vacia sigue teniendo una pagina", () => {
    expect(pageCountOf(0, 10)).toBe(1);
  });
});

describe("clampPage", () => {
  it("deja la pagina dentro del rango", () => {
    expect(clampPage(0, 5)).toBe(1);
    expect(clampPage(9, 5)).toBe(5);
    expect(clampPage(3, 5)).toBe(3);
  });
});

describe("paginate", () => {
  const items = Array.from({ length: 23 }, (_, index) => index + 1);

  it("devuelve la pagina pedida", () => {
    expect(paginate(items, 2, 10)).toEqual([
      11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    ]);
  });

  it("la ultima pagina puede quedar incompleta", () => {
    expect(paginate(items, 3, 10)).toEqual([21, 22, 23]);
  });
});

describe("pageRange", () => {
  it("describe lo que se muestra", () => {
    expect(pageRange(2, 10, 44)).toEqual({ from: 11, to: 20 });
    expect(pageRange(5, 10, 44)).toEqual({ from: 41, to: 44 });
  });

  it("sin elementos no hay rango", () => {
    expect(pageRange(1, 10, 0)).toEqual({ from: 0, to: 0 });
  });
});

describe("visiblePages", () => {
  it("centra la ventana en la pagina actual", () => {
    expect(visiblePages(10, 44)).toEqual([8, 9, 10, 11, 12]);
  });

  it("se pega al principio", () => {
    expect(visiblePages(1, 44)).toEqual([1, 2, 3, 4, 5]);
    expect(visiblePages(2, 44)).toEqual([1, 2, 3, 4, 5]);
  });

  it("se pega al final", () => {
    expect(visiblePages(44, 44)).toEqual([40, 41, 42, 43, 44]);
  });

  it("con pocas paginas muestra solo las que hay", () => {
    expect(visiblePages(1, 3)).toEqual([1, 2, 3]);
    expect(visiblePages(1, 1)).toEqual([1]);
  });
});

import { describe, expect, it } from "vitest";

import { outranksRole, sortRolesByPosition, topPosition } from "./role";

describe("topPosition", () => {
  it("es undefined para el owner, aunque tenga roles", () => {
    expect(
      topPosition({
        isOwner: true,
        roles: [{ position: 5, is_everyone: false }],
      }),
    ).toBeUndefined();
  });

  it("es undefined para alguien sin roles asignados", () => {
    expect(topPosition({ isOwner: false, roles: [] })).toBeUndefined();
  });

  it("es el minimo (el mas alto) entre los roles del actor", () => {
    expect(
      topPosition({
        isOwner: false,
        roles: [
          { position: 4, is_everyone: false },
          { position: 2, is_everyone: false },
          { position: 7, is_everyone: false },
        ],
      }),
    ).toBe(2);
  });

  it("ignora @everyone -- no otorga rango aunque su position (0) sea la mas baja", () => {
    expect(
      topPosition({
        isOwner: false,
        roles: [{ position: 0, is_everyone: true }],
      }),
    ).toBeUndefined();
  });

  it("con @everyone y un rol comun, vale el rol comun (no el 0 de @everyone)", () => {
    expect(
      topPosition({
        isOwner: false,
        roles: [
          { position: 0, is_everyone: true },
          { position: 3, is_everyone: false },
        ],
      }),
    ).toBe(3);
  });
});

describe("outranksRole", () => {
  it("el owner supera cualquier posicion", () => {
    expect(outranksRole({ isOwner: true, roles: [] }, 1)).toBe(true);
  });

  it("supera cuando el top del actor esta por encima del target", () => {
    const actor = {
      isOwner: false,
      roles: [{ position: 2, is_everyone: false }],
    };
    expect(outranksRole(actor, 5)).toBe(true);
  });

  it("no supera en un empate -- CA2 rechaza igual o por encima", () => {
    const actor = {
      isOwner: false,
      roles: [{ position: 3, is_everyone: false }],
    };
    expect(outranksRole(actor, 3)).toBe(false);
  });

  it("no supera cuando el target esta mas arriba que el actor", () => {
    const actor = {
      isOwner: false,
      roles: [{ position: 5, is_everyone: false }],
    };
    expect(outranksRole(actor, 2)).toBe(false);
  });

  it("no supera sin roles asignados y sin ser owner", () => {
    expect(outranksRole({ isOwner: false, roles: [] }, 1)).toBe(false);
  });

  it("un miembro que solo tiene @everyone no supera a ningun rol comun", () => {
    const actor = {
      isOwner: false,
      roles: [{ position: 0, is_everyone: true }],
    };
    expect(outranksRole(actor, 1)).toBe(false);
  });
});

describe("sortRolesByPosition", () => {
  function role(id: string, position: number, is_everyone = false) {
    return { id, position, is_everyone };
  }

  it("ordena por position ascendente (1 es el mas alto)", () => {
    const sorted = sortRolesByPosition([
      role("c", 3),
      role("a", 1),
      role("b", 2),
    ]);
    expect(sorted.map((r) => r.id)).toEqual(["a", "b", "c"]);
  });

  it("deja @everyone siempre al final, sin importar su position reservada (0)", () => {
    const sorted = sortRolesByPosition([
      role("everyone", 0, true),
      role("b", 2),
      role("a", 1),
    ]);
    expect(sorted.map((r) => r.id)).toEqual(["a", "b", "everyone"]);
  });

  it("no muta el array original", () => {
    const original = [role("b", 2), role("a", 1)];
    const sorted = sortRolesByPosition(original);
    expect(sorted).not.toBe(original);
    expect(original.map((r) => r.id)).toEqual(["b", "a"]);
  });
});

import { describe, expect, it } from "vitest";

import { outranksRole, topPosition } from "./role";

describe("topPosition", () => {
  it("es undefined para el owner, aunque tenga roles", () => {
    expect(
      topPosition({ isOwner: true, roles: [{ position: 5 }] }),
    ).toBeUndefined();
  });

  it("es undefined para alguien sin roles asignados", () => {
    expect(topPosition({ isOwner: false, roles: [] })).toBeUndefined();
  });

  it("es el minimo (el mas alto) entre los roles del actor", () => {
    expect(
      topPosition({
        isOwner: false,
        roles: [{ position: 4 }, { position: 2 }, { position: 7 }],
      }),
    ).toBe(2);
  });
});

describe("outranksRole", () => {
  it("el owner supera cualquier posicion", () => {
    expect(outranksRole({ isOwner: true, roles: [] }, 1)).toBe(true);
  });

  it("supera cuando el top del actor esta por encima del target", () => {
    const actor = { isOwner: false, roles: [{ position: 2 }] };
    expect(outranksRole(actor, 5)).toBe(true);
  });

  it("no supera en un empate -- CA2 rechaza igual o por encima", () => {
    const actor = { isOwner: false, roles: [{ position: 3 }] };
    expect(outranksRole(actor, 3)).toBe(false);
  });

  it("no supera cuando el target esta mas arriba que el actor", () => {
    const actor = { isOwner: false, roles: [{ position: 5 }] };
    expect(outranksRole(actor, 2)).toBe(false);
  });

  it("no supera sin roles asignados y sin ser owner", () => {
    expect(outranksRole({ isOwner: false, roles: [] }, 1)).toBe(false);
  });
});

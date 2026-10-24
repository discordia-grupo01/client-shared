import { describe, expect, it } from "vitest";

import { PERMISSION_COPY } from "../constants/roles";

import {
  highestRoleOf,
  outranksRole,
  removesViewChannelsFromEveryone,
  ROLE_PERMISSIONS,
  sortRolesByPosition,
  topPosition,
} from "./role";

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

describe("ROLE_PERMISSIONS", () => {
  it("incluye VIEW_CHANNELS primero, como en el editor de roles de Discord", () => {
    expect(ROLE_PERMISSIONS[0]).toBe("VIEW_CHANNELS");
  });

  it("incluye CONNECT para unirse a los canales de voz", () => {
    expect(ROLE_PERMISSIONS).toContain("CONNECT");
  });

  it("todo permiso del catalogo tiene su texto", () => {
    for (const permission of ROLE_PERMISSIONS) {
      expect(PERMISSION_COPY[permission].label).not.toBe("");
    }
  });
});

describe("removesViewChannelsFromEveryone", () => {
  const everyone = {
    is_everyone: true,
    permissions: ["VIEW_CHANNELS", "SEND_MESSAGES"] as const,
  };

  it("avisa cuando @everyone pierde VIEW_CHANNELS", () => {
    expect(
      removesViewChannelsFromEveryone(
        { ...everyone, permissions: [...everyone.permissions] },
        ["SEND_MESSAGES"],
      ),
    ).toBe(true);
  });

  it("no avisa si @everyone lo conserva", () => {
    expect(
      removesViewChannelsFromEveryone(
        { ...everyone, permissions: [...everyone.permissions] },
        ["VIEW_CHANNELS"],
      ),
    ).toBe(false);
  });

  it("no avisa si @everyone ya no lo tenia", () => {
    expect(
      removesViewChannelsFromEveryone(
        { is_everyone: true, permissions: ["SEND_MESSAGES"] },
        [],
      ),
    ).toBe(false);
  });

  it("no avisa en un rol comun: @everyone sigue dando el acceso", () => {
    expect(
      removesViewChannelsFromEveryone(
        { is_everyone: false, permissions: ["VIEW_CHANNELS"] },
        [],
      ),
    ).toBe(false);
  });
});

describe("highestRoleOf", () => {
  const role = (id: string, position: number, is_everyone = false) => ({
    id,
    position,
    is_everyone,
  });
  const roles = [
    role("r3", 3),
    role("r1", 1),
    role("r2", 2),
    role("every", 0, true),
  ];

  it("elige el de menor position entre los que tiene el miembro", () => {
    expect(highestRoleOf(["r3", "r2", "every"], roles)?.id).toBe("r2");
  });

  it("es null si solo tiene @everyone", () => {
    expect(highestRoleOf(["every"], roles)).toBeNull();
  });

  it("es null sin roles o sin role_ids", () => {
    expect(highestRoleOf([], roles)).toBeNull();
    expect(highestRoleOf(undefined, roles)).toBeNull();
  });

  it("ignora ids que no estan en la lista de roles", () => {
    expect(highestRoleOf(["gone"], roles)).toBeNull();
  });
});

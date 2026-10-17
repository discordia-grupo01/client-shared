import { describe, expect, it } from "vitest";

import {
  appendMembersPage,
  type Member,
  memberPageQueryString,
} from "./member";

const member = (user_id: string): Member => ({
  user_id,
  is_owner: false,
  joined_at: "2026-01-01T00:00:00Z",
});

describe("memberPageQueryString", () => {
  it("no manda nada si no hay filtros", () => {
    expect(memberPageQueryString({})).toBe("");
    expect(memberPageQueryString({ search: "   ", offset: 0 })).toBe("");
  });

  it("arma la busqueda (recortada y escapada), el rol y la pagina", () => {
    expect(
      memberPageQueryString({
        search: " José & co ",
        hasRole: false,
        limit: 20,
        offset: 40,
      }),
    ).toBe("?q=Jos%C3%A9%20%26%20co&has_role=false&limit=20&offset=40");
  });

  it("hasRole true es el default del back: no se manda", () => {
    expect(memberPageQueryString({ hasRole: true, limit: 20 })).toBe(
      "?limit=20",
    );
  });
});

describe("appendMembersPage", () => {
  it("agrega la pagina al final sin repetir miembros ya cargados", () => {
    const loaded = [member("a"), member("b")];
    const result = appendMembersPage(loaded, [member("b"), member("c")]);
    expect(result.map((m) => m.user_id)).toEqual(["a", "b", "c"]);
    expect(loaded).toHaveLength(2);
  });
});

import { describe, expect, it } from "vitest";

import type { MessageAuthor } from "../domain/message";
import type { Role } from "../domain/role";
import { authorFromMember, authorFromUser } from "./message-author";
import { buildMentionResolver } from "./message-mentions";

const author = (name: string, roleColor: string | null): MessageAuthor => ({
  id: name,
  name,
  avatarUrl: null,
  roleName: null,
  roleColor,
});

describe("buildMentionResolver", () => {
  const resolve = buildMentionResolver(
    { a: author("Ana", "#111111"), b: author("Beto", null) },
    [{ name: "Mods", color: "#222222" } as Role],
  );

  it("colorea a un miembro con el color de su rol, sin distinguir mayusculas", () => {
    expect(resolve("ana")).toEqual({ color: "#111111" });
  });

  it("colorea un rol del servidor con su propio color", () => {
    expect(resolve("MODS")).toEqual({ color: "#222222" });
  });

  it("devuelve null si no se reconoce o el miembro no tiene color", () => {
    expect(resolve("Beto")).toBeNull();
    expect(resolve("nadie")).toBeNull();
  });
});

describe("autores", () => {
  it("authorFromUser convierte el id a texto y no trae rol", () => {
    expect(authorFromUser({ id: "7", name: "Ana" }, "u")).toEqual({
      id: "7",
      name: "Ana",
      avatarUrl: "u",
      roleName: null,
      roleColor: null,
    });
  });

  it("authorFromMember cae a 'Usuario desconocido' sin perfil", () => {
    const result = authorFromMember({ user_id: "u1", profile: null }, null);
    expect(result.id).toBe("u1");
    expect(result.name).toBe("Usuario desconocido");
  });
});

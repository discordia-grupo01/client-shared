import { describe, expect, it } from "vitest";

import type { MessageAuthor } from "../domain/message";
import { authorFromMember, authorFromUser } from "./message-author";
import {
  buildMentionResolver,
  isActiveMention,
  mentionsPerson,
} from "./message-mentions";

const ROLE_ID = "3b1c2d4e-1111-4222-8333-444455556666";

const author = (id: string, name: string, roleColor: string | null) =>
  ({ id, name, avatarUrl: null, roleName: null, roleColor }) as MessageAuthor;

describe("buildMentionResolver", () => {
  const resolve = buildMentionResolver(
    { u1: author("u1", "Ana", "#111111"), u2: author("u2", "Beto", null) },
    [{ id: ROLE_ID, name: "Mods", color: "#222222" }],
  );

  it("resuelve un usuario por id con el color de su rol", () => {
    expect(resolve("user", "u1")).toEqual({ name: "Ana", color: "#111111" });
  });

  it("un usuario sin rol coloreado no tiene color", () => {
    expect(resolve("user", "u2")).toEqual({ name: "Beto", color: null });
  });

  it("resuelve un rol por id sin distinguir mayusculas", () => {
    expect(resolve("role", ROLE_ID.toUpperCase())).toEqual({
      name: "Mods",
      color: "#222222",
    });
  });

  it("devuelve null si el id no se conoce", () => {
    expect(resolve("user", "nadie")).toBeNull();
    expect(resolve("role", "00000000-0000-4000-8000-000000000000")).toBeNull();
  });
});

describe("isActiveMention", () => {
  const message = {
    mentions: ["u1"],
    mention_roles: [ROLE_ID],
    mention_everyone: true,
  };

  it("cuenta si el back la devolvio en el mensaje", () => {
    expect(
      isActiveMention({ kind: "user", value: "", id: "u1" }, message),
    ).toBe(true);
    expect(
      isActiveMention(
        { kind: "role", value: "", id: ROLE_ID.toUpperCase() },
        message,
      ),
    ).toBe(true);
    expect(
      isActiveMention({ kind: "everyone", value: "@everyone" }, message),
    ).toBe(true);
  });

  it("no cuenta si el back la dejo como texto", () => {
    const plain = { mentions: [], mention_roles: [], mention_everyone: false };
    expect(isActiveMention({ kind: "user", value: "", id: "u1" }, plain)).toBe(
      false,
    );
    expect(
      isActiveMention({ kind: "everyone", value: "@everyone" }, plain),
    ).toBe(false);
  });

  it("un mensaje sin los campos (ej. un DM) no tiene menciones", () => {
    expect(isActiveMention({ kind: "everyone", value: "@everyone" }, {})).toBe(
      false,
    );
  });

  it("canales y texto no son menciones", () => {
    expect(isActiveMention({ kind: "channel", value: "#a" }, message)).toBe(
      false,
    );
  });
});

describe("mentionsPerson", () => {
  it("true si me nombran por id", () => {
    expect(mentionsPerson({ mentions: ["me"] }, "me", [])).toBe(true);
  });

  it("true si nombran a uno de mis roles", () => {
    expect(mentionsPerson({ mention_roles: [ROLE_ID] }, "me", [ROLE_ID])).toBe(
      true,
    );
  });

  it("true con @everyone", () => {
    expect(mentionsPerson({ mention_everyone: true }, "me", [])).toBe(true);
  });

  it("false si no me alcanza", () => {
    expect(
      mentionsPerson(
        { mentions: ["otro"], mention_roles: [ROLE_ID] },
        "me",
        [],
      ),
    ).toBe(false);
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

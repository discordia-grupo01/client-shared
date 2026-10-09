import { describe, expect, it } from "vitest";

import type { MessageAuthor } from "../domain/message";
import {
  activeMentionQuery,
  applyMentionCandidate,
  suggestMentions,
  type MentionSources,
} from "./mention-suggestions";

const member = (id: string, name: string): MessageAuthor => ({
  id,
  name,
  avatarUrl: null,
  roleName: null,
  roleColor: null,
});

const sources = (canMentionEveryone: boolean): MentionSources => ({
  members: [
    member("1", "Beto"),
    member("2", "Alexis"),
    member("3", "Ale"),
    member("4", "Marcela"),
  ],
  roles: [
    { id: "r1", name: "Diseño", color: "#111111", is_everyone: false },
    { id: "r2", name: "everyone", color: "#222222", is_everyone: true },
    { id: "r3", name: "Alerta", color: "#333333", is_everyone: false },
  ],
  canMentionEveryone,
});

describe("activeMentionQuery", () => {
  it("detecta una @ sola al principio", () => {
    expect(activeMentionQuery("@", 1)).toEqual({ query: "", start: 0, end: 1 });
  });

  it("detecta lo escrito despues de la @", () => {
    expect(activeMentionQuery("hola @ale", 9)).toEqual({
      query: "ale",
      start: 5,
      end: 9,
    });
  });

  it("usa la posicion del cursor, no el final del texto", () => {
    expect(activeMentionQuery("hola @ale más texto", 9)?.query).toBe("ale");
  });

  it("permite espacios dentro del nombre", () => {
    expect(activeMentionQuery("@Beto G", 7)?.query).toBe("Beto G");
  });

  it("no es una mencion si la @ va pegada a una palabra (un mail)", () => {
    expect(activeMentionQuery("ana@mail", 8)).toBeNull();
  });

  it("no es una mencion si despues de la @ hay un espacio", () => {
    expect(activeMentionQuery("nos vemos @ casa", 14)).toBeNull();
  });

  it("no es una mencion si hay un salto de linea", () => {
    expect(activeMentionQuery("@ana\nhola", 9)).toBeNull();
  });

  it("deja de serlo si lo escrito es muy largo", () => {
    expect(activeMentionQuery(`@${"a".repeat(40)}`, 41)).toBeNull();
  });

  it("sin @ no hay mencion", () => {
    expect(activeMentionQuery("hola", 4)).toBeNull();
  });
});

describe("suggestMentions", () => {
  it("sin texto muestra miembros por orden alfabetico, y roles y everyone con permiso", () => {
    const result = suggestMentions("", sources(true));
    expect(result.map((c) => c.kind)).toEqual([
      "user",
      "user",
      "user",
      "user",
      "role",
      "role",
      "everyone",
    ]);
    expect(
      result.slice(0, 4).map((c) => (c.kind === "user" ? c.name : "")),
    ).toEqual(["Ale", "Alexis", "Beto", "Marcela"]);
  });

  it("sin permiso solo ofrece miembros", () => {
    const result = suggestMentions("", sources(false));
    expect(result.every((candidate) => candidate.kind === "user")).toBe(true);
  });

  it("filtra por texto, sin tildes ni mayusculas", () => {
    const result = suggestMentions("DISEN", sources(true));
    expect(result).toEqual([
      { kind: "role", id: "r1", name: "Diseño", color: "#111111" },
    ]);
  });

  it("filtra miembros y roles a la vez", () => {
    const names = suggestMentions("ale", sources(true)).map((c) =>
      c.kind === "everyone" ? "everyone" : c.name,
    );
    expect(names).toEqual(["Ale", "Alexis", "Alerta"]);
  });

  it("los miembros que empiezan con lo escrito van primero", () => {
    const list: MentionSources = {
      ...sources(false),
      members: [member("1", "Valeria"), member("2", "Alan")],
    };
    const names = suggestMentions("al", list).map((c) =>
      c.kind === "user" ? c.name : "",
    );
    expect(names).toEqual(["Alan", "Valeria"]);
  });

  it("nunca ofrece el rol @everyone por su nombre", () => {
    const result = suggestMentions("every", sources(true));
    expect(result).toEqual([{ kind: "everyone" }]);
  });

  it("ofrece @everyone solo si lo escrito es un prefijo de everyone", () => {
    expect(suggestMentions("ev", sources(true))).toContainEqual({
      kind: "everyone",
    });
    expect(suggestMentions("ale", sources(true))).not.toContainEqual({
      kind: "everyone",
    });
  });

  it("respeta el limite de miembros", () => {
    expect(suggestMentions("", sources(false), 2)).toHaveLength(2);
  });
});

describe("applyMentionCandidate", () => {
  it("reemplaza el @algo por la mencion elegida y deja un espacio", () => {
    const active = activeMentionQuery("hola @be", 8)!;
    const applied = applyMentionCandidate("hola @be", active, {
      kind: "user",
      id: "1",
      name: "Beto",
      avatarUrl: null,
    });
    expect(applied).toEqual({
      text: "hola @Beto ",
      cursor: 11,
      picked: { kind: "user", id: "1", label: "Beto" },
    });
  });

  it("conserva el texto que viene despues del cursor", () => {
    const active = activeMentionQuery("@be final", 3)!;
    const applied = applyMentionCandidate("@be final", active, {
      kind: "role",
      id: "r1",
      name: "Diseño",
      color: "#111111",
    });
    expect(applied.text).toBe("@Diseño  final");
    expect(applied.picked).toEqual({ kind: "role", id: "r1", label: "Diseño" });
  });

  it("@everyone no necesita elegido", () => {
    const active = activeMentionQuery("@ev", 3)!;
    const applied = applyMentionCandidate("@ev", active, { kind: "everyone" });
    expect(applied).toEqual({
      text: "@everyone ",
      cursor: 10,
      picked: undefined,
    });
  });
});

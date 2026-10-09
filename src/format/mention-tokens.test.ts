import { describe, expect, it } from "vitest";

import {
  decodeMentions,
  encodeMentions,
  mentionToken,
  type PickedMention,
} from "./mention-tokens";

const ROLE_ID = "3B1C2D4E-1111-4222-8333-444455556666";

const user = (id: string, label: string): PickedMention => ({
  kind: "user",
  id,
  label,
});
const role = (id: string, label: string): PickedMention => ({
  kind: "role",
  id,
  label,
});

describe("mentionToken", () => {
  it("arma el token de usuario y de rol (el rol en minusculas)", () => {
    expect(mentionToken("user", "u1")).toBe("<@u1>");
    expect(mentionToken("role", ROLE_ID)).toBe(`<@&${ROLE_ID.toLowerCase()}>`);
  });
});

describe("encodeMentions", () => {
  it("sin elegidos devuelve el texto tal cual", () => {
    expect(encodeMentions("hola @Beto", [])).toBe("hola @Beto");
  });

  it("convierte usuarios y roles elegidos en tokens", () => {
    expect(
      encodeMentions("Hola @Beto Gómez, mirá @Diseño", [
        user("u_beto", "Beto Gómez"),
        role(ROLE_ID, "Diseño"),
      ]),
    ).toBe(`Hola <@u_beto>, mirá <@&${ROLE_ID.toLowerCase()}>`);
  });

  it("no toca @everyone: viaja tal cual", () => {
    expect(encodeMentions("@everyone y @Ana", [user("a", "Ana")])).toBe(
      "@everyone y <@a>",
    );
  });

  it("un @Nombre escrito a mano sin elegirlo queda como texto", () => {
    expect(encodeMentions("hola @Carla", [user("a", "Ana")])).toBe(
      "hola @Carla",
    );
  });

  it("no convierte si el nombre sigue con letras (se edito despues de elegir)", () => {
    expect(encodeMentions("hola @Alejandro", [user("a", "Ale")])).toBe(
      "hola @Alejandro",
    );
  });

  it("no convierte si va pegado a una palabra (un mail)", () => {
    expect(encodeMentions("ana@Ale.com", [user("a", "Ale")])).toBe(
      "ana@Ale.com",
    );
  });

  it("dos elegidos con el mismo nombre se asignan en orden", () => {
    expect(
      encodeMentions("@Ale y @Ale", [user("a1", "Ale"), user("a2", "Ale")]),
    ).toBe("<@a1> y <@a2>");
  });

  it("una elegida cuenta una sola vez aunque el nombre se repita en el texto", () => {
    expect(encodeMentions("@Ale y @Ale", [user("a1", "Ale")])).toBe(
      "<@a1> y @Ale",
    );
  });

  it("prefiere el nombre mas largo cuando uno contiene al otro", () => {
    expect(
      encodeMentions("@Ale Kim", [user("a", "Ale"), user("b", "Ale Kim")]),
    ).toBe("<@b>");
  });

  it("escapa los caracteres especiales del nombre", () => {
    expect(
      encodeMentions("hola @C++ (dev)", [role(ROLE_ID, "C++ (dev)")]),
    ).toBe(`hola <@&${ROLE_ID.toLowerCase()}>`);
  });

  it("convierte menciones pegadas a signos de puntuacion", () => {
    expect(
      encodeMentions("(@Ana), @Ana.", [user("a", "Ana"), user("b", "Ana")]),
    ).toBe("(<@a>), <@b>.");
  });
});

describe("decodeMentions", () => {
  const names: Record<string, string> = {
    u_beto: "Beto",
    [ROLE_ID.toLowerCase()]: "Diseño",
  };
  const nameOf = (_kind: "user" | "role", id: string) => names[id] ?? null;

  it("pasa los tokens a @Nombre y reconstruye los elegidos", () => {
    expect(
      decodeMentions(`Hola <@u_beto> y <@&${ROLE_ID.toLowerCase()}>`, nameOf),
    ).toEqual({
      text: "Hola @Beto y @Diseño",
      picked: [
        { kind: "user", id: "u_beto", label: "Beto" },
        { kind: "role", id: ROLE_ID.toLowerCase(), label: "Diseño" },
      ],
    });
  });

  it("deja el token como esta si no se conoce el nombre", () => {
    expect(decodeMentions("hola <@desconocido>", nameOf)).toEqual({
      text: "hola <@desconocido>",
      picked: [],
    });
  });

  it("ida y vuelta: decodificar y volver a codificar devuelve el original", () => {
    const original = "Hola <@u_beto>";
    const { text, picked } = decodeMentions(original, nameOf);
    expect(encodeMentions(text, picked)).toBe(original);
  });
});

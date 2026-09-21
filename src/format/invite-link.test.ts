import { describe, expect, it } from "vitest";

import { buildInviteLink } from "./invite-link";

describe("buildInviteLink", () => {
  it("arma el link absoluto con la base que le pasen", () => {
    expect(buildInviteLink("abc123", "https://discordia.app")).toBe(
      "https://discordia.app/invite/abc123",
    );
  });

  it("no duplica la barra cuando la base termina en /", () => {
    expect(buildInviteLink("abc123", "http://localhost:3000/")).toBe(
      "http://localhost:3000/invite/abc123",
    );
  });

  it("devuelve la ruta relativa cuando no hay base", () => {
    expect(buildInviteLink("abc123", null)).toBe("/invite/abc123");
  });
});

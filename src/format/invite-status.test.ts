import { describe, expect, it } from "vitest";

import type { Invitation } from "../domain/invite";

import { inviteStatus, normalizeInviteCode } from "./invite-link";

const DIA = 24 * 60 * 60 * 1000;

function invitacion(cambios: Partial<Invitation> = {}): Invitation {
  return {
    code: "xY7z2Q",
    url: "",
    server_id: "s1",
    created_by: "u1",
    max_uses: null,
    uses: 0,
    expires_at: new Date(Date.now() + 7 * DIA).toISOString(),
    revoked_at: null,
    created_at: new Date().toISOString(),
    ...cambios,
  };
}

describe("inviteStatus", () => {
  it("una invitacion recien creada esta activa", () => {
    expect(inviteStatus(invitacion())).toBe("active");
  });

  it("sin vencimiento tambien esta activa", () => {
    expect(inviteStatus(invitacion({ expires_at: null }))).toBe("active");
  });

  it("marca vencida cuando la fecha ya paso", () => {
    const ayer = new Date(Date.now() - DIA).toISOString();
    expect(inviteStatus(invitacion({ expires_at: ayer }))).toBe("expired");
  });

  it("marca agotada al llegar al limite de usos", () => {
    expect(inviteStatus(invitacion({ max_uses: 3, uses: 3 }))).toBe(
      "exhausted",
    );
    expect(inviteStatus(invitacion({ max_uses: 3, uses: 2 }))).toBe("active");
  });

  it("sin limite de usos no se agota nunca", () => {
    expect(inviteStatus(invitacion({ max_uses: null, uses: 999 }))).toBe(
      "active",
    );
  });

  /** El orden importa: revocar es una decision de una persona. */
  it("revocada gana sobre vencida y sobre agotada", () => {
    const rota = invitacion({
      revoked_at: new Date().toISOString(),
      expires_at: new Date(Date.now() - DIA).toISOString(),
      max_uses: 1,
      uses: 5,
    });
    expect(inviteStatus(rota)).toBe("revoked");
  });
});

describe("normalizeInviteCode", () => {
  it("saca el codigo de un link completo", () => {
    expect(normalizeInviteCode("https://discordia.app/invite/xY7z2Q")).toBe(
      "xY7z2Q",
    );
  });

  it("deja pasar el codigo pelado", () => {
    expect(normalizeInviteCode("xY7z2Q")).toBe("xY7z2Q");
  });

  it("ignora espacios alrededor", () => {
    expect(normalizeInviteCode("  xY7z2Q  ")).toBe("xY7z2Q");
  });

  /**
   * No inventa un error: devuelve lo que entro y deja que el backend rechace.
   * El front no conoce el formato exacto que genera `servers`.
   */
  it("devuelve la entrada cuando no encuentra nada parecido", () => {
    expect(normalizeInviteCode("???")).toBe("???");
    expect(normalizeInviteCode("")).toBe("");
  });
});

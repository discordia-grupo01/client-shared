import { describe, expect, it } from "vitest";

import type { ApiFailure } from "../domain/api-result";

import { SESSION_EXPIRED_MESSAGE } from "./errors";
import {
  kickFailureMessage,
  listRoleMembersFailureMessage,
  muteFailureMessage,
  unmuteFailureMessage,
} from "./moderation-failures";
import {
  NO_PERMISSION_KICK,
  NO_PERMISSION_MUTE,
  NO_PERMISSION_ROLE_MEMBERS,
} from "./permissions";

const failure = (
  status: number,
  details?: ApiFailure["details"],
): ApiFailure => ({ ok: false, status, code: status, message: "", details });

describe("fallos de moderacion", () => {
  it("expulsar: la jerarquia gana sobre el 403 generico (CA2) y sin reason es falta de permiso (CA3)", () => {
    expect(
      kickFailureMessage(failure(403, { reason: "target_outranks_actor" })),
    ).toMatch(/rol igual o superior/);
    expect(kickFailureMessage(failure(403))).toBe(NO_PERMISSION_KICK);
    expect(kickFailureMessage(failure(401))).toBe(SESSION_EXPIRED_MESSAGE);
    expect(kickFailureMessage(failure(500))).toMatch(/expulsar al miembro/);
  });

  it("silenciar: traduce los motivos del back", () => {
    expect(
      muteFailureMessage(failure(403, { reason: "cannot_mute_owner" })),
    ).toMatch(/propietario/);
    expect(
      muteFailureMessage(
        failure(400, { field: "until_at", reason: "mute_until_invalid" }),
      ),
    ).toMatch(/duración/);
    expect(muteFailureMessage(failure(403))).toBe(NO_PERMISSION_MUTE);
  });

  it("quitar el silencio: si ya no estaba silenciado lo dice", () => {
    expect(
      unmuteFailureMessage(failure(404, { reason: "mute_not_found" })),
    ).toMatch(/ya no está silenciado/);
    expect(unmuteFailureMessage(failure(500))).toMatch(/quitar el silencio/);
  });

  it("miembros por rol: 403 es falta de permiso", () => {
    expect(listRoleMembersFailureMessage(failure(403))).toBe(
      NO_PERMISSION_ROLE_MEMBERS,
    );
    expect(listRoleMembersFailureMessage(failure(500))).toMatch(
      /miembros del rol/,
    );
  });
});

import { formatMutedUntil, mutedUntilLabel } from "./ui";
import { messageErrorFor } from "./chat";

describe("silencio en pantalla", () => {
  const now = new Date(2026, 9, 12, 15, 0);

  it("formatMutedUntil dice solo la hora si termina hoy", () => {
    expect(
      formatMutedUntil(new Date(2026, 9, 12, 18, 30).toISOString(), now),
    ).toMatch(/^las 18:30/);
    expect(
      mutedUntilLabel(new Date(2026, 9, 14, 9, 5).toISOString(), now),
    ).toMatch(/^Silenciado hasta el 14\/10 a las 09:05/);
  });

  it("el chat explica que no puede escribir porque esta silenciado", () => {
    expect(messageErrorFor("MEMBER_MUTED")).toMatch(/silenciado/);
  });
});

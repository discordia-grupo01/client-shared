import { describe, expect, it } from "vitest";

import { roleOverrideSaveFailed } from "./actions";
import { permissionNotHeldMessage } from "./permissions";
import { CHANNEL_OVERRIDE_REASONS } from "./reasons";

describe("errores al sobrescribir permisos", () => {
  it("el rechazo por jerarquia habla de roles", () => {
    expect(CHANNEL_OVERRIDE_REASONS.role_above_own).toMatch(/rol/);
  });

  it("permission_not_held nombra Ver canales con su texto", () => {
    expect(permissionNotHeldMessage(["VIEW_CHANNELS"])).toBe(
      'No podés otorgar el permiso "Ver canales" porque no lo tenés vos.',
    );
  });

  it("permission_not_held nombra Conectarse con su texto", () => {
    expect(permissionNotHeldMessage(["CONNECT"])).toBe(
      'No podés otorgar el permiso "Conectarse" porque no lo tenés vos.',
    );
  });

  it("si falla un rol al guardar, se dice cual", () => {
    expect(roleOverrideSaveFailed("@Moderador")).toBe(
      "No pudimos guardar los permisos de @Moderador en este canal. Intentá de nuevo.",
    );
  });
});

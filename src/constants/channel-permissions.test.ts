import { describe, expect, it } from "vitest";

import {
  CHANNEL_OVERRIDE_PERMISSIONS,
  overridablePermissionsFor,
} from "../domain/channel-permissions";

import {
  CHANNEL_PERMISSION_COPY,
  channelPermissionGroupsFor,
} from "./channel-permissions";

describe("copy de permisos por canal", () => {
  it("cada permiso que se puede sobrescribir tiene texto", () => {
    for (const permission of CHANNEL_OVERRIDE_PERMISSIONS) {
      expect(CHANNEL_PERMISSION_COPY[permission].label).not.toBe("");
      expect(CHANNEL_PERMISSION_COPY[permission].desc).toMatch(/\.$/);
    }
  });

  it("los grupos muestran exactamente los permisos que aplican al tipo de canal", () => {
    for (const kind of ["text", "voice"] as const) {
      const shown = channelPermissionGroupsFor(kind).flatMap(
        (group) => group.permissions,
      );
      expect(shown).toEqual([...overridablePermissionsFor(kind)]);
    }
  });
});

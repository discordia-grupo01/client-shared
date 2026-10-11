import { describe, expect, it } from "vitest";

import {
  addRoleOverride,
  canAllowOverride,
  canEditRoleOverride,
  canViewChannelWithDraft,
  type ChannelOverride,
  clearRoleOverride,
  diffOverrideDrafts,
  draftToMasks,
  hasChannelPermission,
  overridablePermissionsFor,
  overridesToDraft,
  overrideValueOf,
  setOverrideValue,
} from "./channel-permissions";

const EVERYONE = "everyone-id";

function override(
  roleId: string,
  allow: ChannelOverride["allow"],
  deny: ChannelOverride["deny"],
): ChannelOverride {
  return {
    channel_id: "c1",
    role_id: roleId,
    allow,
    deny,
    updated_at: "2026-10-11T00:00:00Z",
  };
}

describe("catalogo de permisos por canal", () => {
  it("en un canal de voz solo se ofrece Ver canal", () => {
    expect(overridablePermissionsFor("voice")).toEqual(["VIEW_CHANNELS"]);
    expect(overridablePermissionsFor("text")).toHaveLength(4);
  });
});

describe("borrador", () => {
  it("arranca con @everyone aunque no tenga excepcion", () => {
    expect(overridesToDraft([], EVERYONE)).toEqual({ [EVERYONE]: {} });
  });

  it("pasa allow y deny del back a valores por permiso", () => {
    const draft = overridesToDraft(
      [override("mod", ["VIEW_CHANNELS"], ["SEND_MESSAGES"])],
      EVERYONE,
    );
    expect(overrideValueOf(draft, "mod", "VIEW_CHANNELS")).toBe("allow");
    expect(overrideValueOf(draft, "mod", "SEND_MESSAGES")).toBe("deny");
    expect(overrideValueOf(draft, "mod", "ADD_REACTIONS")).toBe("inherit");
    expect(overrideValueOf(draft, "otro", "ADD_REACTIONS")).toBe("inherit");
  });

  it("setOverrideValue no muta y heredar quita la marca", () => {
    const initial = overridesToDraft([], EVERYONE);
    const denied = setOverrideValue(initial, EVERYONE, "VIEW_CHANNELS", "deny");
    expect(initial).toEqual({ [EVERYONE]: {} });
    expect(denied[EVERYONE]).toEqual({ VIEW_CHANNELS: "deny" });

    const back = setOverrideValue(denied, EVERYONE, "VIEW_CHANNELS", "inherit");
    expect(back[EVERYONE]).toEqual({});
  });

  it("agregar un rol lo suma vacio y no pisa uno que ya estaba", () => {
    const withMod = setOverrideValue(
      overridesToDraft([], EVERYONE),
      "mod",
      "VIEW_CHANNELS",
      "allow",
    );
    expect(addRoleOverride(withMod, "mod")).toBe(withMod);
    expect(addRoleOverride(withMod, "dj")["dj"]).toEqual({});
  });

  it("limpiar saca al rol de la lista, pero @everyone se queda vacio", () => {
    let draft = overridesToDraft(
      [
        override(EVERYONE, [], ["SEND_MESSAGES"]),
        override("mod", ["SEND_MESSAGES"], []),
      ],
      EVERYONE,
    );
    draft = clearRoleOverride(draft, "mod", EVERYONE);
    expect("mod" in draft).toBe(false);

    draft = clearRoleOverride(draft, EVERYONE, EVERYONE);
    expect(draft[EVERYONE]).toEqual({});
  });

  it("draftToMasks devuelve las listas en el orden del catalogo", () => {
    expect(
      draftToMasks({
        ADD_REACTIONS: "deny",
        VIEW_CHANNELS: "allow",
        SEND_MESSAGES: "deny",
      }),
    ).toEqual({
      allow: ["VIEW_CHANNELS"],
      deny: ["SEND_MESSAGES", "ADD_REACTIONS"],
    });
    expect(draftToMasks(undefined)).toEqual({ allow: [], deny: [] });
  });
});

describe("diffOverrideDrafts", () => {
  const saved = overridesToDraft(
    [override("mod", ["VIEW_CHANNELS"], [])],
    EVERYONE,
  );

  it("sin cambios no manda nada", () => {
    expect(diffOverrideDrafts(saved, saved, EVERYONE)).toEqual([]);
  });

  it("canal solo para un rol: @everyone primero, despues el rol", () => {
    let draft = addRoleOverride(saved, "dj");
    draft = setOverrideValue(draft, "dj", "VIEW_CHANNELS", "allow");
    draft = setOverrideValue(draft, EVERYONE, "VIEW_CHANNELS", "deny");

    expect(diffOverrideDrafts(saved, draft, EVERYONE)).toEqual([
      { kind: "put", roleId: EVERYONE, allow: [], deny: ["VIEW_CHANNELS"] },
      { kind: "put", roleId: "dj", allow: ["VIEW_CHANNELS"], deny: [] },
    ]);
  });

  it("un rol que vuelve a heredar todo se borra", () => {
    const draft = setOverrideValue(saved, "mod", "VIEW_CHANNELS", "inherit");
    expect(diffOverrideDrafts(saved, draft, EVERYONE)).toEqual([
      { kind: "delete", roleId: "mod" },
    ]);
  });

  it("limpiar un rol con excepcion guardada se borra", () => {
    const draft = clearRoleOverride(saved, "mod", EVERYONE);
    expect(diffOverrideDrafts(saved, draft, EVERYONE)).toEqual([
      { kind: "delete", roleId: "mod" },
    ]);
  });

  it("agregar un rol con el + y no marcar nada no manda nada", () => {
    const draft = addRoleOverride(saved, "dj");
    expect(diffOverrideDrafts(saved, draft, EVERYONE)).toEqual([]);
  });

  it("cambiar un permiso de un rol reemplaza su excepcion completa", () => {
    const draft = setOverrideValue(saved, "mod", "SEND_MESSAGES", "deny");
    expect(diffOverrideDrafts(saved, draft, EVERYONE)).toEqual([
      {
        kind: "put",
        roleId: "mod",
        allow: ["VIEW_CHANNELS"],
        deny: ["SEND_MESSAGES"],
      },
    ]);
  });
});

describe("canEditRoleOverride", () => {
  const moderator = {
    isOwner: false,
    roles: [{ position: 2, is_everyone: false }],
  };

  it("@everyone siempre se puede editar", () => {
    expect(
      canEditRoleOverride(
        { isOwner: false, roles: [] },
        { position: 0, is_everyone: true },
      ),
    ).toBe(true);
  });

  it("solo roles estrictamente por debajo del propio", () => {
    expect(
      canEditRoleOverride(moderator, { position: 3, is_everyone: false }),
    ).toBe(true);
    expect(
      canEditRoleOverride(moderator, { position: 2, is_everyone: false }),
    ).toBe(false);
    expect(
      canEditRoleOverride(moderator, { position: 1, is_everyone: false }),
    ).toBe(false);
  });

  it("el dueño puede editar cualquier rol", () => {
    expect(
      canEditRoleOverride(
        { isOwner: true, roles: [] },
        { position: 1, is_everyone: false },
      ),
    ).toBe(true);
  });
});

describe("hasChannelPermission", () => {
  const member = {
    isOwner: false,
    serverPermissions: ["VIEW_CHANNELS", "SEND_MESSAGES"],
    roles: [],
  };

  it("sin excepciones vale lo del servidor", () => {
    expect(hasChannelPermission(member, "SEND_MESSAGES")).toBe(true);
    expect(hasChannelPermission(member, "MANAGE_MESSAGES")).toBe(false);
  });

  it("el deny de @everyone saca el permiso", () => {
    expect(
      hasChannelPermission(
        { ...member, everyone: { allow: [], deny: ["SEND_MESSAGES"] } },
        "SEND_MESSAGES",
      ),
    ).toBe(false);
  });

  it("el allow de otro rol le gana al deny de @everyone", () => {
    expect(
      hasChannelPermission(
        {
          ...member,
          everyone: { allow: [], deny: ["SEND_MESSAGES"] },
          roles: [{ allow: ["SEND_MESSAGES"], deny: [] }],
        },
        "SEND_MESSAGES",
      ),
    ).toBe(true);
  });

  it("entre los roles del miembro, allow le gana a deny", () => {
    expect(
      hasChannelPermission(
        {
          ...member,
          roles: [
            { allow: [], deny: ["VIEW_CHANNELS"] },
            { allow: ["VIEW_CHANNELS"], deny: [] },
          ],
        },
        "VIEW_CHANNELS",
      ),
    ).toBe(true);
  });

  it("el deny de un rol saca un permiso que el servidor daba", () => {
    expect(
      hasChannelPermission(
        { ...member, roles: [{ allow: [], deny: ["VIEW_CHANNELS"] }] },
        "VIEW_CHANNELS",
      ),
    ).toBe(false);
  });

  it("el allow de @everyone da un permiso que el servidor no daba", () => {
    expect(
      hasChannelPermission(
        { ...member, everyone: { allow: ["MANAGE_MESSAGES"], deny: [] } },
        "MANAGE_MESSAGES",
      ),
    ).toBe(true);
  });

  it("al dueño y a los administradores no les aplican las excepciones", () => {
    const locked = {
      everyone: { allow: [], deny: ["VIEW_CHANNELS" as const] },
      roles: [{ allow: [], deny: ["VIEW_CHANNELS" as const] }],
    };
    expect(
      hasChannelPermission(
        { ...locked, isOwner: true, serverPermissions: [] },
        "VIEW_CHANNELS",
      ),
    ).toBe(true);
    expect(
      hasChannelPermission(
        { ...locked, isOwner: false, serverPermissions: ["ADMINISTRATOR"] },
        "VIEW_CHANNELS",
      ),
    ).toBe(true);
  });
});

describe("canViewChannelWithDraft", () => {
  const privateForMods = setOverrideValue(
    setOverrideValue(
      overridesToDraft([], EVERYONE),
      EVERYONE,
      "VIEW_CHANNELS",
      "deny",
    ),
    "mod",
    "VIEW_CHANNELS",
    "allow",
  );

  it("quien tiene el rol con acceso sigue viendo el canal", () => {
    expect(
      canViewChannelWithDraft(
        privateForMods,
        {
          isOwner: false,
          serverPermissions: ["VIEW_CHANNELS", "MANAGE_ROLES"],
          roleIds: [EVERYONE, "mod"],
        },
        EVERYONE,
      ),
    ).toBe(true);
  });

  it("avisa si quien edita se queda sin acceso", () => {
    expect(
      canViewChannelWithDraft(
        privateForMods,
        {
          isOwner: false,
          serverPermissions: ["VIEW_CHANNELS", "MANAGE_ROLES"],
          roleIds: [EVERYONE, "gestor"],
        },
        EVERYONE,
      ),
    ).toBe(false);
  });
});

describe("canAllowOverride", () => {
  it("solo se puede permitir lo que uno tiene en el servidor", () => {
    const actor = { isOwner: false, serverPermissions: ["SEND_MESSAGES"] };
    expect(canAllowOverride(actor, "SEND_MESSAGES")).toBe(true);
    expect(canAllowOverride(actor, "MANAGE_MESSAGES")).toBe(false);
  });

  it("el dueño y los administradores pueden permitir todo", () => {
    expect(
      canAllowOverride(
        { isOwner: true, serverPermissions: [] },
        "MANAGE_MESSAGES",
      ),
    ).toBe(true);
    expect(
      canAllowOverride(
        { isOwner: false, serverPermissions: ["ADMINISTRATOR"] },
        "MANAGE_MESSAGES",
      ),
    ).toBe(true);
  });
});

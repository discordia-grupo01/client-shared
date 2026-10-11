/**
 * Permisos de un rol en un canal: que gana (`allow`) y que pierde (`deny`) un
 * rol solo en ese canal, sin tocar sus permisos en el resto del servidor.
 *
 * Espeja `servers/internal/model/channelperm`. El back guarda un override por
 * `(channel_id, role_id)` y lo expone por:
 *   GET    /v1/channels/:id/permissions                   -> [ChannelOverride]
 *   PUT    /v1/channels/:id/permissions/roles/:roleId     -> ChannelOverride | 204
 *   DELETE /v1/channels/:id/permissions/roles/:roleId     -> 204
 *   GET    /v1/channels/:id/members/:userId/permissions   -> permisos efectivos
 *
 * Todo lo de este archivo es puro (sin red): lo usan las pantallas de las dos
 * apps para editar un borrador y decidir que requests mandar al guardar.
 */
import type { Channel } from "./channel";
import {
  type HierarchyContext,
  outranksRole,
  type Role,
  type RolePermission,
} from "./role";

export const CHANNEL_OVERRIDE_PERMISSIONS = [
  "VIEW_CHANNELS",
  "SEND_MESSAGES",
  "MANAGE_MESSAGES",
  "ADD_REACTIONS",
] as const satisfies readonly RolePermission[];

export type ChannelOverridePermission =
  (typeof CHANNEL_OVERRIDE_PERMISSIONS)[number];

export function overridablePermissionsFor(
  kind: Channel["kind"],
): readonly ChannelOverridePermission[] {
  return kind === "voice" ? ["VIEW_CHANNELS"] : CHANNEL_OVERRIDE_PERMISSIONS;
}

export interface ChannelOverride {
  channel_id: string;
  role_id: string;
  allow: ChannelOverridePermission[];
  deny: ChannelOverridePermission[];
  updated_at: string;
}

export interface OverrideMasks {
  allow: readonly ChannelOverridePermission[];
  deny: readonly ChannelOverridePermission[];
}

export type OverrideValue = "deny" | "inherit" | "allow";

export type RoleOverrideDraft = Readonly<
  Partial<Record<ChannelOverridePermission, "allow" | "deny">>
>;

export type OverrideDraft = Readonly<Record<string, RoleOverrideDraft>>;

export function overridesToDraft(
  overrides: readonly ChannelOverride[],
  everyoneRoleId: string,
): OverrideDraft {
  const draft: Record<string, RoleOverrideDraft> = { [everyoneRoleId]: {} };
  for (const override of overrides) {
    const role: Partial<Record<ChannelOverridePermission, "allow" | "deny">> =
      {};
    for (const permission of override.allow) role[permission] = "allow";
    for (const permission of override.deny) role[permission] = "deny";
    draft[override.role_id] = role;
  }
  return draft;
}

export function overrideValueOf(
  draft: OverrideDraft,
  roleId: string,
  permission: ChannelOverridePermission,
): OverrideValue {
  return draft[roleId]?.[permission] ?? "inherit";
}

export function setOverrideValue(
  draft: OverrideDraft,
  roleId: string,
  permission: ChannelOverridePermission,
  value: OverrideValue,
): OverrideDraft {
  const role: Partial<Record<ChannelOverridePermission, "allow" | "deny">> = {
    ...draft[roleId],
  };
  if (value === "inherit") delete role[permission];
  else role[permission] = value;
  return { ...draft, [roleId]: role };
}

export function addRoleOverride(
  draft: OverrideDraft,
  roleId: string,
): OverrideDraft {
  if (roleId in draft) return draft;
  return { ...draft, [roleId]: {} };
}

export function clearRoleOverride(
  draft: OverrideDraft,
  roleId: string,
  everyoneRoleId: string,
): OverrideDraft {
  if (roleId === everyoneRoleId) return { ...draft, [roleId]: {} };
  if (!(roleId in draft)) return draft;
  const next: Record<string, RoleOverrideDraft> = { ...draft };
  delete next[roleId];
  return next;
}

export function draftToMasks(role: RoleOverrideDraft | undefined): {
  allow: ChannelOverridePermission[];
  deny: ChannelOverridePermission[];
} {
  const allow: ChannelOverridePermission[] = [];
  const deny: ChannelOverridePermission[] = [];
  for (const permission of CHANNEL_OVERRIDE_PERMISSIONS) {
    const value = role?.[permission];
    if (value === "allow") allow.push(permission);
    if (value === "deny") deny.push(permission);
  }
  return { allow, deny };
}

function isEmptyMasks(masks: OverrideMasks): boolean {
  return masks.allow.length === 0 && masks.deny.length === 0;
}

function sameMasks(a: OverrideMasks, b: OverrideMasks): boolean {
  return a.allow.join() === b.allow.join() && a.deny.join() === b.deny.join();
}

export type OverrideChange =
  | {
      kind: "put";
      roleId: string;
      allow: ChannelOverridePermission[];
      deny: ChannelOverridePermission[];
    }
  | { kind: "delete"; roleId: string };

export function diffOverrideDrafts(
  saved: OverrideDraft,
  draft: OverrideDraft,
  everyoneRoleId: string,
): OverrideChange[] {
  const roleIds = [
    ...new Set([everyoneRoleId, ...Object.keys(saved), ...Object.keys(draft)]),
  ];
  const changes: OverrideChange[] = [];
  for (const roleId of roleIds) {
    const before = draftToMasks(saved[roleId]);
    const after = draftToMasks(draft[roleId]);
    if (sameMasks(before, after)) continue;
    if (isEmptyMasks(after)) {
      if (!isEmptyMasks(before)) changes.push({ kind: "delete", roleId });
      continue;
    }
    changes.push({ kind: "put", roleId, allow: after.allow, deny: after.deny });
  }
  return changes;
}

export function canEditRoleOverride(
  actor: HierarchyContext,
  role: Pick<Role, "position" | "is_everyone">,
): boolean {
  if (role.is_everyone) return true;
  return outranksRole(actor, role.position);
}

export interface ChannelPermissionInput {
  isOwner: boolean;
  serverPermissions: readonly string[];
  everyone?: OverrideMasks;
  roles: readonly OverrideMasks[];
}

export function hasChannelPermission(
  input: ChannelPermissionInput,
  permission: ChannelOverridePermission,
): boolean {
  if (input.isOwner || input.serverPermissions.includes("ADMINISTRATOR")) {
    return true;
  }
  let has = input.serverPermissions.includes(permission);
  if (input.everyone?.deny.includes(permission)) has = false;
  if (input.everyone?.allow.includes(permission)) has = true;
  if (input.roles.some((role) => role.allow.includes(permission))) return true;
  if (input.roles.some((role) => role.deny.includes(permission))) return false;
  return has;
}

export function canViewChannelWithDraft(
  draft: OverrideDraft,
  member: {
    isOwner: boolean;
    serverPermissions: readonly string[];
    /** `id` de todos los roles del miembro, @everyone incluido. */
    roleIds: readonly string[];
  },
  everyoneRoleId: string,
): boolean {
  return hasChannelPermission(
    {
      isOwner: member.isOwner,
      serverPermissions: member.serverPermissions,
      everyone: draftToMasks(draft[everyoneRoleId]),
      roles: member.roleIds
        .filter((roleId) => roleId !== everyoneRoleId && roleId in draft)
        .map((roleId) => draftToMasks(draft[roleId])),
    },
    "VIEW_CHANNELS",
  );
}

export function canAllowOverride(
  actor: { isOwner: boolean; serverPermissions: readonly string[] },
  permission: ChannelOverridePermission,
): boolean {
  return (
    actor.isOwner ||
    actor.serverPermissions.includes("ADMINISTRATOR") ||
    actor.serverPermissions.includes(permission)
  );
}

export type ListChannelOverridesResult =
  { ok: true; overrides: ChannelOverride[] } | { ok: false; message: string };

export type SetChannelOverrideResult =
  | { ok: true; override: ChannelOverride | null }
  | { ok: false; message: string; permissionDenied?: boolean };

export type DeleteChannelOverrideResult =
  { ok: true } | { ok: false; message: string; permissionDenied?: boolean };

export type MemberPermissionsResult =
  { ok: true; permissions: string[] } | { ok: false; message: string };

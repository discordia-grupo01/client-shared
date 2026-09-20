/**
 * Catalogo cerrado de permisos. El back no expone ningun permiso
 * "administrador": este es el set completo.
 *
 * Hoy el bitmask no habilita ni restringe nada -- todos los endpoints de roles
 * exigen ser el owner del servidor (`service.RequireManageRoles`).
 */
export const ROLE_PERMISSIONS = [
  "VIEW_CHANNELS",
  "SEND_MESSAGES",
  "MANAGE_CHANNELS",
  "MANAGE_ROLES",
  "KICK_MEMBERS",
  "BAN_MEMBERS",
  "MANAGE_SERVER",
] as const;

export type RolePermission = (typeof ROLE_PERMISSIONS)[number];

export interface Role {
  id: string;
  server_id: string;
  name: string;
  color: string;
  permissions: RolePermission[];
  created_at: string;
  updated_at: string;
}

export interface RoleFieldErrors {
  name?: string;
  color?: string;
  permissions?: string;
}

export type CreateRoleResult =
  | { ok: true; role: Role }
  | { ok: false; message: string; fieldErrors?: RoleFieldErrors };

export type ListRolesResult =
  { ok: true; roles: Role[] } | { ok: false; message: string };

/** `permissions: undefined` deja los permisos actuales sin tocar. */
export type UpdateRoleResult =
  | { ok: true; role: Role }
  | { ok: false; message: string; fieldErrors?: RoleFieldErrors };

/** 409 si el rol es el default del servidor: hay que reasignar antes. */
export type DeleteRoleResult =
  { ok: true } | { ok: false; message: string; isDefaultRole?: boolean };

/**
 * No hay endpoint que exponga cual es el rol default: `default_role_id` no
 * viaja en `ServerSummary`. El front puede fijarlo pero no leerlo.
 */
export type SetDefaultRoleResult =
  { ok: true } | { ok: false; message: string };

export type ListMemberRolesResult =
  { ok: true; roles: Role[] } | { ok: false; message: string };

export type AssignRoleResult =
  { ok: true; role: Role } | { ok: false; message: string };

export type RemoveRoleResult = { ok: true } | { ok: false; message: string };

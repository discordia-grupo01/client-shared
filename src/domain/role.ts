/**
 * Catalogo cerrado de permisos que el front puede editar. El back tiene
 * ademas ADMINISTRATOR (implica todos los demas), que queda reservado: no se
 * expone en esta pantalla, solo lo tiene el owner.
 *
 * Cada uno de estos bits habilita su propia accion en el back
 * (`service.RequireManageChannels/Roles/Server`, `RequireCreateInvite`,
 * etc.): no hace falta ADMINISTRATOR para ejercerlos, alcanza con que el rol
 * lo tenga asignado. CREATE_INVITE sigue este mismo patron -- se agrega o
 * quita como cualquier otro permiso desde "Editar rol", no hay un flujo
 * aparte para el.
 *
 * VIEW_CHANNELS existe en el back (`role.PermViewChannels`) pero se sacó de
 * aca a proposito: ningun endpoint lo consulta todavia (ni `GetServer` ni
 * `channel_service` filtran canales por el), asi que mostrarlo como toggle
 * hacia creer que ya restringe el acceso cuando en realidad no hace nada. Si
 * algun dia se cablea del lado del servidor, se vuelve a agregar aca.
 */
export const ROLE_PERMISSIONS = [
  "SEND_MESSAGES",
  "MANAGE_CHANNELS",
  "MANAGE_ROLES",
  "KICK_MEMBERS",
  "BAN_MEMBERS",
  "MANAGE_SERVER",
  "CREATE_INVITE",
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

/**
 * Contexto minimo para evaluar, del lado del cliente, si el usuario actual
 * puede ejercer un permiso de gestion. Espeja `role.Standing.Has` del backend
 * (`servers/internal/model/role/standing.go`): el owner puede todo, el resto
 * solo lo que le dan los roles que tiene asignados.
 *
 * `roles` son los roles del USUARIO ACTUAL en el servidor (por ejemplo, el
 * resultado de `GET /v1/servers/:id/members/:userId/roles` para su propio
 * user id) -- no todos los roles del servidor.
 */
export interface PermissionContext {
  isOwner: boolean;
  roles: Pick<Role, "permissions">[];
}

/**
 * ¿El usuario de `ctx` puede ejercer `permission`? Usar esto para decidir
 * que mostrar en la UI (botones de crear/editar canal, categoria, roles,
 * configuracion del servidor) en vez de un `isOwner` a secas: el backend ya
 * no exige ser owner para estas acciones, solo tener el permiso puntual (ver
 * `service.RequireManageChannels/Roles/Server`).
 */
export function hasPermission(
  ctx: PermissionContext,
  permission: RolePermission,
): boolean {
  return (
    ctx.isOwner ||
    ctx.roles.some((role) => role.permissions.includes(permission))
  );
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

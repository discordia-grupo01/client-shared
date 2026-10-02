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
 *
 * MANAGE_MESSAGES (borrar mensajes ajenos) y MENTION_EVERYONE (usar
 * `@everyone`) todavia no tienen servicio de mensajes en el back: por ahora
 * solo gatean la UI (`canDeleteMessage`, `validateMentionEveryone`).
 */
export const ROLE_PERMISSIONS = [
  "SEND_MESSAGES",
  "MANAGE_CHANNELS",
  "MANAGE_ROLES",
  "KICK_MEMBERS",
  "BAN_MEMBERS",
  "MANAGE_SERVER",
  "CREATE_INVITE",
  "MANAGE_MESSAGES",
  "MENTION_EVERYONE",
] as const;

export type RolePermission = (typeof ROLE_PERMISSIONS)[number];

export interface Role {
  id: string;
  server_id: string;
  name: string;
  color: string;
  /**
   * Rango en la jerarquia del servidor: 1 es el mas alto. La usa el back para
   * decidir quien puede gestionar/reordenar a quien y, ante
   * permisos contradictorios entre los roles de un mismo miembro, cual gana.
   */
  position: number;
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

/**
 * Contexto minimo para evaluar rango jerarquico del lado del cliente. Espeja
 * `role.Standing` (`servers/internal/model/role/standing.go`): el owner esta
 * fuera de la jerarquia de roles (no tiene `position`) y siempre gana; el
 * resto vale por el mas alto (numero mas bajo) de sus roles asignados.
 */
export interface HierarchyContext {
  isOwner: boolean;
  roles: Pick<Role, "position">[];
}

export function topPosition(ctx: HierarchyContext): number | undefined {
  if (ctx.isOwner || ctx.roles.length === 0) return undefined;
  return Math.min(...ctx.roles.map((role) => role.position));
}

/**
 * ¿`actor` supera en jerarquia a un rol ubicado en `targetPosition`? Espeja
 * `Standing.Outranks`: el owner gana siempre; si no, gana quien tenga el
 * `topPosition` mas bajo. Un empate NO cuenta como superar -- CA2 de
 * "Reordenar jerarquía de roles" rechaza tocar un rol igual o por encima del
 * propio, no solo uno estrictamente mas arriba.
 */
export function outranksRole(
  actor: HierarchyContext,
  targetPosition: number,
): boolean {
  if (actor.isOwner) return true;
  const actorTop = topPosition(actor);
  return actorTop !== undefined && actorTop < targetPosition;
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

/**
 * El back devuelve el array completo de roles ya reordenado (con la
 * `position` nueva de cada uno), no un 204 como categorias/canales -- ver
 * `PATCH /v1/servers/:serverId/roles/reorder` en
 * `servers/internal/handler/role_handler.go`.
 */
export type ReorderRolesResult =
  { ok: true; roles: Role[] } | { ok: false; message: string };

export type ListMemberRolesResult =
  { ok: true; roles: Role[] } | { ok: false; message: string };

export type AssignRoleResult =
  { ok: true; role: Role } | { ok: false; message: string };

export type RemoveRoleResult = { ok: true } | { ok: false; message: string };

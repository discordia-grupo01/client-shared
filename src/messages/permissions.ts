/**
 * Mensajes sobre permisos: los 403 y el rechazo de un permiso invalido al
 * editar un rol.
 *
 * `web-client` decia "No tenés permisos de administración para crear roles",
 * que describe un modelo que todavia no existe: hace creer que alguien te
 * puede dar ese permiso. Hoy `servers` chequea solo la propiedad:
 *
 *     // internal/service/authz.go
 *     func RequireManageRoles(srv model.Server, userID string) error {
 *         if srv.OwnerID != userID { return model.ErrForbiddenNotOwner }
 *     }
 *
 * `RequireManageChannels` y `RequireManageServer` son iguales. El catalogo de
 * permisos (`model/role/permission.go`) existe y el bitmask se guarda, pero
 * ningun servicio lo lee para autorizar: esa parte del back esta pendiente y
 * los toggles del modal de roles estan maquetados esperandola.
 *
 * TODO: cuando `RequireManageX` empiece a mirar el bitmask, estos textos
 * vuelven a ser "No tenés permiso para ..." y se cambian solo aca.
 */

function ownerOnly(action: string): string {
  return `Solo el propietario puede ${action}.`;
}

export const OWNER_ONLY_CREATE_ROLE = ownerOnly("crear roles");
export const OWNER_ONLY_UPDATE_ROLE = ownerOnly("editar roles");
export const OWNER_ONLY_DELETE_ROLE = ownerOnly("eliminar roles");
export const OWNER_ONLY_ASSIGN_ROLE = ownerOnly("asignar roles");
export const OWNER_ONLY_REMOVE_ROLE = ownerOnly("quitar roles");
export const OWNER_ONLY_SET_DEFAULT_ROLE = ownerOnly(
  "definir el rol por defecto",
);

export const OWNER_ONLY_CREATE_CHANNEL = ownerOnly("crear canales");
export const OWNER_ONLY_UPDATE_CHANNEL = ownerOnly("editar canales");
export const OWNER_ONLY_DELETE_CHANNEL = ownerOnly("eliminar canales");
export const OWNER_ONLY_REORDER_CHANNEL = ownerOnly("reordenar canales");
export const OWNER_ONLY_CREATE_CATEGORY = ownerOnly("crear categorías");

export const OWNER_ONLY_TRANSFER = ownerOnly("transferir este servidor");

/** La transferencia tiene dos partes y cada una puede hacer cosas distintas. */
export const TRANSFER_ONLY_TARGET_ACCEPTS =
  "Solo la persona invitada puede aceptar esta transferencia.";
export const TRANSFER_ONLY_TARGET_REJECTS =
  "Solo la persona invitada puede rechazar esta transferencia.";
export const TRANSFER_ONLY_SENDER_CANCELS =
  "Solo quien inició la transferencia puede cancelarla.";

/**
 * 400 al guardar un rol con un permiso que el backend no conoce.
 *
 * `details.value` viene solo a veces. `web-client` ya lo aprovechaba para
 * nombrar el permiso y `app-mobile` mostraba siempre el texto generico; ahora
 * las dos muestran el especifico cuando el backend lo manda.
 */
export function invalidPermissionMessage(value: unknown): string {
  return typeof value === "string" && value !== ""
    ? `"${value}" no es un permiso válido.`
    : "Uno de los permisos enviados no es válido.";
}

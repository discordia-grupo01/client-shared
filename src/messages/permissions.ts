/**
 * Mensajes sobre permisos: los 403 y el rechazo de un permiso invalido al
 * editar un rol.
 *
 * El owner sigue pudiendo todo, pero cualquier miembro con el permiso puntual
 * (via alguno de sus roles) tambien
 *
 * La transferencia de servidor (`OWNER_ONLY_TRANSFER`) es aparte: no es un
 * permiso del catalogo de roles, sigue siendo exclusiva del owner.
 */

function noPermissionFor(action: string): string {
  return `No tenés permiso para ${action}.`;
}

export const OWNER_ONLY_CREATE_ROLE = noPermissionFor("crear roles");
export const OWNER_ONLY_UPDATE_ROLE = noPermissionFor("editar roles");
export const OWNER_ONLY_DELETE_ROLE = noPermissionFor("eliminar roles");
export const OWNER_ONLY_ASSIGN_ROLE = noPermissionFor("asignar roles");
export const OWNER_ONLY_REMOVE_ROLE = noPermissionFor("quitar roles");
export const OWNER_ONLY_SET_DEFAULT_ROLE = noPermissionFor(
  "definir el rol por defecto",
);

export const OWNER_ONLY_CREATE_CHANNEL = noPermissionFor("crear canales");
export const OWNER_ONLY_UPDATE_CHANNEL = noPermissionFor("editar canales");
export const OWNER_ONLY_DELETE_CHANNEL = noPermissionFor("eliminar canales");
export const OWNER_ONLY_REORDER_CHANNEL = noPermissionFor("reordenar canales");
export const OWNER_ONLY_CREATE_CATEGORY = noPermissionFor("crear categorías");
export const OWNER_ONLY_REORDER_CATEGORY = noPermissionFor(
  "reordenar categorías",
);

export const OWNER_ONLY_TRANSFER = `Solo el propietario puede transferir este servidor.`;

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

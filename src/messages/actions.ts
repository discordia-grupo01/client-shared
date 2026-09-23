/**
 * Mensajes de "la operacion fallo y no sabemos por que", uno por accion.
 *
 * Son los fallbacks que se le pasan a `messageFor` cuando el backend no manda
 * un `details.reason` que podamos traducir. Los genericos (sin red, sesion
 * vencida) estan en `errors.ts` y los que si dependen de un `reason` en
 * `reasons.ts`.
 *
 * Estaban triplicados: `web-client` los repite en `app/api/**\/route.ts` y de
 * nuevo en `services/**\/client.ts`, y `app-mobile` los tiene una vez mas. Las
 * tres copias se habian desincronizado en el sufijo ("Intenta" contra
 * "Intentá") y en el sustantivo ("la invitación" contra "el enlace").
 */

/**
 * Privada a proposito: si el sufijo se pudiera pasar por parametro volveria a
 * aparecer un "Intenta de nuevo" en tuteo en algun call site.
 */
function failedTo(action: string): string {
  return `No pudimos ${action}. Intentá de nuevo.`;
}

// --- Servidores ---
export const SERVERS_LOAD_FAILED = failedTo("cargar tus servidores");
export const SERVER_LOAD_FAILED = failedTo("cargar el servidor");
export const SERVER_LEAVE_FAILED = failedTo("abandonar el servidor");
export const SERVER_UPDATE_FAILED = failedTo("actualizar el servidor");

export const SERVER_UPDATE_FORBIDDEN =
  "No tenés permisos para editar la configuración de este servidor.";

/**
 * Elegir un fondo fijo falla antes de salir del dispositivo: hay que
 * materializar el PNG del preset (a un archivo de cache en mobile, a un `File`
 * en web) y eso puede romperse sin que el backend se entere.
 */
export const PRESET_BANNER_FAILED =
  "No pudimos preparar ese fondo. Probá de nuevo.";

// --- Canales y categorias ---
export const CHANNEL_CREATE_FAILED = failedTo("crear el canal");
export const CHANNEL_UPDATE_FAILED = failedTo("editar el canal");
export const CHANNEL_DELETE_FAILED = failedTo("eliminar el canal");
export const CHANNEL_REORDER_FAILED = failedTo("reordenar los canales");
export const CHANNEL_MOVE_FAILED = failedTo("mover el canal");
export const CATEGORY_CREATE_FAILED = failedTo("crear la categoría");
export const CATEGORY_UPDATE_FAILED = failedTo("editar la categoría");

// --- Roles ---
export const ROLES_LOAD_FAILED = failedTo("cargar los roles");
export const ROLE_CREATE_FAILED = failedTo("crear el rol");
export const ROLE_UPDATE_FAILED = failedTo("editar el rol");
export const ROLE_DELETE_FAILED = failedTo("eliminar el rol");
export const DEFAULT_ROLE_SET_FAILED = failedTo("definir el rol por defecto");
export const MEMBER_ROLES_LOAD_FAILED = failedTo(
  "cargar los roles del miembro",
);
export const MEMBER_ROLE_ASSIGN_FAILED = failedTo("asignar el rol");
export const MEMBER_ROLE_REMOVE_FAILED = failedTo("quitar el rol");

// --- Miembros ---
export const MEMBERS_LOAD_FAILED = failedTo("cargar los miembros");

/**
 * "el enlace de invitación" en los tres mensajes: `web-client` decia "la
 * invitación" al crear y "el enlace" al revocar, para el mismo objeto.
 */
export const INVITE_CREATE_FAILED = failedTo("generar el enlace de invitación");
export const INVITE_REVOKE_FAILED = failedTo("revocar el enlace de invitación");
export const INVITES_LOAD_FAILED = failedTo("cargar las invitaciones");
export const INVITE_JOIN_FAILED = failedTo("procesar la invitación");

/** No es una request: reintentar no cambia nada, el portapapeles esta bloqueado. */
export const INVITE_COPY_FAILED = "No pudimos copiar el enlace.";

// --- Transferencia de propiedad ---
export const TRANSFER_START_FAILED = failedTo("iniciar la transferencia");
export const TRANSFER_LOAD_FAILED = failedTo("cargar la transferencia");
export const TRANSFER_ACCEPT_FAILED = failedTo("aceptar la transferencia");
export const TRANSFER_REJECT_FAILED = failedTo("rechazar la transferencia");
export const TRANSFER_CANCEL_FAILED = failedTo("cancelar la transferencia");

/**
 * 409 al borrar el rol por defecto. No es un `*_FAILED` porque no es un fallo
 * transitorio: reintentar no sirve, hay que hacer otra cosa primero.
 */
export const ROLE_IS_DEFAULT =
  "Este es el rol por defecto. Primero asigná otro rol como predeterminado.";

// --- Perfil ---
export const OWN_PROFILE_LOAD_FAILED = failedTo("cargar tu perfil");
export const PROFILE_LOAD_FAILED = failedTo("cargar el perfil");
export const PROFILE_UPDATE_FAILED = failedTo("actualizar tu perfil");
export const STATUS_UPDATE_FAILED = failedTo("actualizar tu estado");
export const STATUS_CLEAR_FAILED = failedTo("borrar tu estado");

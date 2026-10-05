/**
 * Textos de pantalla que las dos apps muestran igual: titulos, descripciones,
 * placeholders y etiquetas de accesibilidad.
 *
 * A diferencia de `errors.ts` o `actions.ts`, esto no reacciona a nada del
 * backend: es copy del producto. Va aca porque estaba escrito dos veces y ya
 * habia empezado a separarse (los mensajes de accion se habian desincronizado
 * en el tuteo, estos todavia no).
 *
 * Lo que NO va aca: texto que una plataforma dice distinto a proposito. Si
 * alguna vez web y mobile tienen que decir cosas diferentes en la misma
 * pantalla, eso se queda en cada app y no se fuerza aca.
 */

// --- Home sin servidores ---
export const EMPTY_HOME_TITLE = "Tu espacio está esperándote";
export const CREATE_FIRST_SERVER_TITLE = "Crear mi primer servidor";
export const CREATE_FIRST_SERVER_DESCRIPTION =
  "Elegí un nombre e ícono. El resto lo hacemos nosotros: dos canales listos para usar desde el principio.";
export const JOIN_WITH_LINK_TITLE = "Unirme con un enlace";
export const JOIN_WITH_LINK_DESCRIPTION =
  "¿Tenés un código de invitación? Pegalo acá y entrás al instante.";
export const UNLIMITED_INVITES_FEATURE = "Invitaciones sin límite de usos";

// --- Invitaciones ---
export const INVITE_CODE_REQUIRED = "Pegá un enlace o código de invitación.";
export const MAX_USES_LABEL = "Límite de usos (opcional)";

/**
 * Se concatenan despues del nombre del servidor, por eso arrancan con espacio.
 *
 * TODO: "barra lateral" viene de `web-client`. En `app-mobile` los servidores
 * estan en el riel de la izquierda y en `ServerPickerScreen`, asi que el texto
 * es impreciso ahi. Decidir si se generaliza ("en tu lista de servidores") o
 * si cada app dice lo suyo.
 */
export const JOINED_SERVER_SUFFIX = " te está esperando en la barra lateral.";
export const ALREADY_MEMBER_SUFFIX = " ya te tenía como miembro.";

// --- Perfil propio ---
export const CHANGE_AVATAR_LABEL = "Cambiar foto de perfil";
export const CANCEL_NAME_EDIT_LABEL = "Cancelar edición del nombre";
export const DESCRIPTION_PLACEHOLDER = "Contá algo sobre vos...";
export const NO_DESCRIPTION_YET = "Todavía no agregaste una descripción.";
export const CLEAR_CUSTOM_STATUS_LABEL = "Quitar estado personalizado";
export const CUSTOM_STATUS_PLACEHOLDER = "¿Qué estás haciendo?";

// --- Canales ---
export const CHANNEL_START_NOTICE =
  "Este es el comienzo del canal. El chat todavía no está conectado en esta versión.";
export const VOICE_NOT_IMPLEMENTED =
  "La conexión de voz todavía no está implementada en esta versión.";

// --- Transferencia de propiedad ---
export const TRANSFER_CHOOSE_NEW_OWNER = "Elegí el nuevo propietario";
export const TRANSFER_NO_OTHER_MEMBERS =
  "No hay otros miembros en este servidor todavía.";
export const TRANSFER_PENDING_OTHER_VIEWER =
  "Hay una transferencia de propiedad pendiente para este servidor.";
export const TRANSFER_NONE_PENDING =
  "No hay ninguna transferencia de propiedad pendiente.";

// --- Usuarios ---
/** Nombre de un usuario cuyo perfil todavia no se replico en el back (`profile: null`). */
export const UNKNOWN_USER_NAME = "Usuario desconocido";

// --- Baneos ---
export const BANS_TITLE = "Gestionar baneos";
export const BANS_SUBTITLE = "Consultá y revocá los baneos del servidor";
export const BANS_REVOKE_HINT =
  "Revocar un baneo permite volver con una invitación válida, sin restaurar la membresía ni los roles anteriores.";
export const BANS_TAB_MEMBERS = "Banear miembro";
export const BANS_MEMBERS_HINT =
  "Mirá el perfil de un miembro o banealo directamente.";
export const BANS_MEMBERS_EMPTY = "No hay miembros que puedas banear.";
export const BANS_MEMBERS_EMPTY_SEARCH =
  "No hay miembros que coincidan con la búsqueda.";
export const BANS_MEMBERS_SEARCH_LABEL =
  "Buscar miembros por nombre de usuario";
export const VIEW_PROFILE_LABEL = "Ver perfil";
export const BANS_SEARCH_LABEL = "Buscar baneados por nombre de usuario";

export function bansTabLabel(count: number): string {
  return `Baneados (${count})`;
}
export const BANS_SEARCH_PLACEHOLDER = "Buscar por nombre de usuario...";
export const BANS_EMPTY = "No hay usuarios baneados.";
export const BANS_EMPTY_SEARCH =
  "No hay baneados que coincidan con la búsqueda.";
export const BAN_NO_REASON = "Sin motivo indicado";
export const BAN_REVOKE_LABEL = "Revocar";
export const BAN_MEMBER_TITLE = "Banear miembro";
export const BAN_MEMBER_SUBTITLE =
  "Esta acción restringe el acceso al servidor";
export const BAN_MEMBER_CONSEQUENCES =
  "Perderá su membresía y sus roles. No podrá volver con ninguna invitación mientras esté baneado. Si hay una transferencia de propiedad pendiente hacia esta persona, se cancelará.";
export const BAN_REASON_LABEL = "Motivo del baneo";
export const BAN_REASON_PLACEHOLDER =
  "Contá por qué se banea a este miembro...";
export const BAN_CONFIRM_LABEL = "Confirmar baneo";
export const BAN_ACTION_LABEL = "Banear";

export function banSuccessNotice(name: string): string {
  return `${name} fue baneado del servidor. Las invitaciones existentes ya no le permiten entrar.`;
}
export function unbanSuccessNotice(name: string): string {
  return `Se revocó el baneo de ${name}. Puede volver con una invitación válida.`;
}

// --- Paginacion ---
export const PAGINATION_PREVIOUS = "Anterior";
export const PAGINATION_NEXT = "Siguiente";

export function paginationSummary(
  from: number,
  to: number,
  total: number,
  noun: string,
): string {
  return `Mostrando ${from}–${to} de ${total} ${noun}`;
}
export function searchResultsSummary(
  matches: number,
  total: number,
  noun: string,
): string {
  return `${matches} ${matches === 1 ? "resultado" : "resultados"} de ${total} ${noun}`;
}

// --- Roles ---
export const NO_ROLES_YET = "Todavía no hay roles.";

/**
 * --- Configuracion del servidor ---
 *
 * Solo lo que las dos apps dicen IGUAL. El titulo del modal y su subtitulo no
 * estan aca: el titulo es un string suelto que cada app escribe donde lo usa, y
 * el subtitulo cambia por plataforma (mobile dice "Tocá el banner o el ícono
 * para cambiarlos" y en web no se toca nada).
 *
 * Las etiquetas de seccion se guardan en capitalizacion normal; que se vean en
 * mayusculas es decision de cada app (CSS en web, `textTransform` en mobile).
 */
export const SERVER_NAME_LABEL = "Nombre del servidor";
export const SERVER_NAME_PLACEHOLDER = "Mi servidor épico";
export const BANNER_PRESETS_LABEL = "O elegí un fondo";
export const ADD_BANNER_LABEL = "Agregar banner";
export const CHANGE_BANNER_LABEL = "Cambiar banner";
export const REMOVE_BANNER_LABEL = "Quitar banner";
export const CHANGE_SERVER_ICON_LABEL = "Cambiar ícono";

// --- Chat de un canal de texto ---
export const channelWelcomeTitle = (channelName: string) =>
  `Bienvenido a #${channelName}`;
export const channelWelcomeSubtitle = (channelName: string) =>
  `Este es el comienzo del canal #${channelName}.`;
export const messageInputPlaceholder = (channelName: string) =>
  `Escribí un mensaje en #${channelName}`;
export const SEND_MESSAGE_LABEL = "Enviar mensaje";
export const ADD_REACTION_LABEL = "Agregar reacción";
export const ATTACH_FILE_LABEL = "Adjuntar archivo";
export const EMOJI_PICKER_LABEL = "Emojis";
/** Adjuntos y selector de emojis todavia no existen. */
export const CHAT_FEATURE_NOT_AVAILABLE = "Todavía no está disponible";
export const LOAD_OLDER_MESSAGES_LABEL = "Cargar mensajes anteriores";
export const LOADING_MESSAGES_LABEL = "Cargando mensajes…";
export const RETRY_LABEL = "Reintentar";

// --- Editar / eliminar mensaje ---
export const EDIT_MESSAGE_LABEL = "Editar mensaje";
export const DELETE_MESSAGE_LABEL = "Eliminar mensaje";
export const MESSAGE_EDITED_LABEL = "(editado)";
export const DELETE_MESSAGE_CONFIRM_TITLE = "¿Eliminar mensaje?";
export const DELETE_MESSAGE_CONFIRM_BODY =
  "Se va a eliminar para todos los miembros y no se puede deshacer.";
export const DELETE_MESSAGE_CONFIRM_ACTION = "Eliminar";
export const DELETE_MESSAGE_CANCEL_ACTION = "Cancelar";
export const EDIT_MESSAGE_HINT = "Esc para cancelar · Enter para guardar";

// --- Mensajes directos ---
export const DIRECT_MESSAGES_TITLE = "Mensajes directos";
export const NEW_DIRECT_MESSAGE_LABEL = "Nuevo mensaje directo";
export const SELECT_CONVERSATION_NOTICE =
  "Seleccioná una conversación para empezar";
export const NO_CONVERSATIONS_YET = "Todavía no tenés conversaciones directas.";
export const dmConversationStart = (name: string) =>
  `Este es el comienzo de tu conversación directa con ${name}.`;
export const dmInputPlaceholder = (name: string) => `Mensaje directo a ${name}`;
/** El usuario actual bloqueó al destinatario: no puede escribirle. */
export const DM_BLOCKED_CANNOT_SEND =
  "No podés enviar mensajes directos a este usuario.";
/** El destinatario bloqueó al usuario actual: el envío no se entrega. */
export const DM_MESSAGE_BLOCKED_NOTICE =
  "No se pudo entregar el mensaje. Este usuario te bloqueó.";

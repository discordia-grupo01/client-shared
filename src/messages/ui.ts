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

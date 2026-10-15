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
export const EDIT_CHANNEL_LABEL = "Editar canal";
export const OVERRIDE_CHANNEL_PERMISSIONS_LABEL = "Sobrescribir permisos";
export const DELETE_CHANNEL_LABEL = "Eliminar canal";

/**
 * Sin SEND_MESSAGES en el canal (con sus excepciones aplicadas), el
 * compositor queda deshabilitado con este texto en vez del placeholder.
 */
export const SEND_MESSAGES_DENIED_PLACEHOLDER =
  "No tenés permiso para enviar mensajes en este canal";

/**
 * --- Configuracion de un canal ---
 *
 * Pantalla con dos secciones: "Vista general" (nombre y tema) y "Permisos"
 * (sobrescribir los permisos de cada rol en ese canal).
 */
export const CHANNEL_SETTINGS_OVERVIEW_SECTION = "Vista general";
export const CHANNEL_SETTINGS_PERMISSIONS_SECTION = "Permisos";
export const CHANNEL_NAME_LABEL = "Nombre del canal";
export const CHANNEL_TOPIC_LABEL = "Tema del canal";
export const CHANNEL_TOPIC_PLACEHOLDER = "Contá de qué trata este canal...";
export const CHANNEL_TOPIC_HINT =
  "El tema se muestra en el encabezado del canal para todos los miembros.";

export const CHANNEL_PERMISSIONS_TITLE = "Permisos del canal";
export function channelPermissionsSubtitle(channelName: string): string {
  return `Personalizá qué puede hacer cada rol en este canal. Estos cambios aplican solo a #${channelName} y no modifican los permisos de los roles en el resto del servidor.`;
}
export const CHANNEL_PERMISSIONS_ADMINS_NOTE =
  "Los administradores y el dueño del servidor tienen todos los permisos en todos los canales.";
export const CHANNEL_PERMISSIONS_ROLES_LABEL = "Roles";
export const ADD_ROLE_OVERRIDE_LABEL = "Agregar rol";
export const ALL_ROLES_HAVE_OVERRIDES = "Todos los roles ya están en la lista.";
export const CLEAR_ROLE_OVERRIDE_LABEL = "Limpiar";
export const OVERRIDE_DENY_LABEL = "Denegar";
export const OVERRIDE_INHERIT_LABEL = "Heredar";
export const OVERRIDE_ALLOW_LABEL = "Permitir";
export const INHERITED_ALLOWED_LABEL = "Heredado: permitido";
export const INHERITED_DENIED_LABEL = "Heredado: no permitido";
export const INHERITED_HINT =
  "Es lo que el rol tiene en todo el servidor. Se cambia desde Roles.";
export const ROLE_ABOVE_OWN_HINT =
  "No podés cambiar los permisos de un rol igual o por encima del tuyo";
export const PERMISSION_NOT_HELD_HINT =
  "No podés permitir un permiso que no tenés";

/** Aviso antes de guardar una excepcion que deja sin acceso a quien la hace. */
export const LOSE_CHANNEL_ACCESS_TITLE = "Vas a dejar de ver este canal";
export const LOSE_CHANNEL_ACCESS_BODY =
  "Con estos permisos, ninguno de tus roles puede ver el canal. Si guardás, va a desaparecer de tu lista de canales.";
export const LOSE_CHANNEL_ACCESS_CONFIRM = "Guardar igual";

// --- Cambios sin guardar ---
export const UNSAVED_CHANGES_WARNING = "¡Cuidado! Tenés cambios sin guardar";
export const RESET_CHANGES_LABEL = "Restablecer";
export const SAVE_CHANGES_LABEL = "Guardar cambios";
export const CHANNEL_PERMISSIONS_SAVED = "Permisos del canal actualizados";

export const CHANNEL_START_NOTICE =
  "Este es el comienzo del canal. El chat todavía no está conectado en esta versión.";
/**
 * Lo usa el placeholder de voz que sigue en `develop` de web y mobile. Se borra
 * cuando entre `feature/voice-chat` en las dos apps.
 */
export const VOICE_NOT_IMPLEMENTED =
  "La conexión de voz todavía no está implementada en esta versión.";

// --- Canal de voz ---
export const VOICE_CONNECTED = "Voz conectada";
export const VOICE_CONNECTING = "Conectando…";
export const VOICE_RECONNECTING = "Reconectando…";
export const VOICE_MUTE = "Silenciar";
export const VOICE_UNMUTE = "Activar";
export const VOICE_CAMERA = "Cámara";
export const VOICE_CAMERA_OFF = "Activar";
export const VOICE_SCREEN_SHARE = "Pantalla";
export const VOICE_SCREEN_SHARING = "Compartiendo";
export const VOICE_LEAVE = "Salir";
export const VOICE_MUTE_FOR_ME = "Silenciar para mí";
export const VOICE_UNMUTE_FOR_ME = "Dejar de silenciar para mí";
export const VOICE_MUTE_LABEL = "Silenciar micrófono";
export const VOICE_UNMUTE_LABEL = "Activar micrófono";
export const VOICE_LEAVE_LABEL = "Salir del canal de voz";
export const VOICE_MUTED_LABEL = "Micrófono silenciado";
export const VOICE_SPEAKING_LABEL = "Hablando";
export const VOICE_CAMERA_ON_LABEL = "Cámara encendida";
export const VOICE_MUTED_FOR_ME_LABEL = "Silenciado para vos";
export const VOICE_CAMERA_ON_ACTION = "Encender cámara";
export const VOICE_CAMERA_OFF_ACTION = "Apagar cámara";
export const VOICE_SCREEN_SHARE_START = "Compartir pantalla";
export const VOICE_SCREEN_SHARE_STOP = "Dejar de compartir pantalla";
export const VOICE_CONTROLS_LABEL = "Controles de la llamada";
export const VOICE_PARTICIPANTS_TITLE = "Participantes";
export const VOICE_PARTICIPANTS_BUTTON = "Personas";
export const VOICE_PARTICIPANTS_OPEN = "Ver participantes";
export const VOICE_PARTICIPANTS_CLOSE = "Cerrar participantes";
export const VOICE_PIN = "Fijar";
export const VOICE_UNPIN = "Quitar";
export const VOICE_BACK_TO_GRID = "Volver a la grilla";
export const VOICE_SHOW_LESS = "Mostrar menos";

// Pantalla previa a entrar a un canal de voz.
export const VOICE_JOIN = "Unirse al canal";
export const VOICE_SWITCH = "Cambiar a este canal";
export const VOICE_CHANNEL_EMPTY =
  "Todavía no hay nadie. Entrá y esperá a los demás.";
export const VOICE_IN_CHANNEL_LABEL = "En el canal";

/** Pill del encabezado del canal de voz. */
export function voiceConnectedCount(count: number): string {
  return count === 1 ? "1 conectado" : `${count} conectados`;
}

/** Quien esta en el canal, en la pantalla previa a entrar. */
export function voicePresenceCount(count: number): string {
  return count === 1
    ? "Hay 1 persona en el canal."
    : `Hay ${count} personas en el canal.`;
}

/** Tile del final de la grilla y fila de la lista de canales con quienes no entran. */
export function voiceHiddenCount(count: number): string {
  return `+${count} más`;
}

export function voiceHiddenCountLabel(count: number): string {
  return count === 1 ? "Ver 1 persona más" : `Ver ${count} personas más`;
}

/** Nombre en la lista de participantes: el tuyo lleva "(vos)". */
export function voiceParticipantName(name: string, isLocal: boolean): string {
  return isLocal ? `${name} (vos)` : name;
}

export function voicePinLabel(name: string, isPinned: boolean): string {
  return isPinned ? `Dejar de fijar a ${name}` : `Fijar a ${name}`;
}

/** Segunda linea de "Voz conectada", arriba del panel de usuario. */
export function voiceConnectedLocation(
  channelName: string,
  serverName: string,
): string {
  return `${channelName} • ${serverName}`;
}

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

// --- Menciones ---
export const MENTION_SECTION_MEMBERS = "Miembros";
export const MENTION_SECTION_ROLES = "Roles";
export const MENTION_SECTION_EVERYONE = "Notificar a todos";
export const MENTION_EVERYONE_HINT =
  "Notifica a todos los miembros que puedan ver este canal.";
export const MENTION_ROLE_HINT =
  "Notifica a todos los usuarios con este rol que puedan ver este canal.";
/** Nombre de un rol mencionado que ya no existe. */
export const MENTION_DELETED_ROLE_NAME = "rol eliminado";

/** Titulo de la seccion de miembros mientras se filtra: "Miembros que coinciden con @ale". */
export function mentionMembersMatchTitle(query: string): string {
  return `${MENTION_SECTION_MEMBERS} que coinciden con @${query}`;
}

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
 * Confirmacion antes de sacarle "Ver canales" a @everyone (ver
 * `removesViewChannelsFromEveryone`). En la practica solo la ve el dueño: es
 * el unico que puede editar los permisos de @everyone.
 */
export const EVERYONE_VIEW_CHANNELS_OFF_TITLE =
  '¿Quitarle "Ver canales" a @everyone?';
export const EVERYONE_VIEW_CHANNELS_OFF_BODY =
  'Los miembros que no tengan otro rol con "Ver canales" van a dejar de ver todos los canales del servidor, salvo los que tengan una excepción que se lo permita. Los administradores y el dueño no se ven afectados.';
export const EVERYONE_VIEW_CHANNELS_OFF_CONFIRM = "Quitar permiso";

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

/**
 * --- Eliminar servidor ---
 */
export function deleteServerTitle(serverName: string): string {
  return `Eliminar ${serverName}`;
}
export function deleteServerConfirmBody(serverName: string): string {
  return `¿Seguro que quieres eliminar ${serverName}? Esta acción es irreversible.`;
}
export const DELETE_SERVER_NAME_LABEL =
  "Introduce el nombre exacto del servidor";
export const DELETE_SERVER_CONFIRM_ACTION = "Eliminar servidor";

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
export const MESSAGE_NOT_SENT_LABEL = "No se pudo enviar el mensaje.";
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
export const LOADING_DM_CANDIDATES_LABEL = "Cargando…";
export const NO_CONVERSATIONS_YET = "Todavía no tenés conversaciones directas.";
export const dmConversationStart = (name: string) =>
  `Este es el comienzo de tu conversación directa con ${name}.`;
export const dmInputPlaceholder = (name: string) => `Mensaje directo a ${name}`;
/** El usuario actual bloqueó al destinatario: no puede escribirle. */
export const DM_BLOCKED_CANNOT_SEND =
  "No podés enviar mensajes directos a este usuario.";

// --- Bloquear y desbloquear usuarios ---
export const BLOCK_USER_LABEL = "Bloquear";
export const UNBLOCK_USER_LABEL = "Desbloquear";
export const BLOCKED_BADGE_LABEL = "bloqueado";
export const blockUserTitle = (name: string) => `¿Bloquear a ${name}?`;
export const BLOCK_USER_BODY =
  "Ninguno de los dos va a poder enviarle mensajes directos al otro ni iniciar llamadas privadas. El historial de la conversación se conserva para los dos. Podés desbloquearlo cuando quieras.";
export const BLOCK_USER_CONFIRM_ACTION = "Bloquear";
export const unblockUserTitle = (name: string) => `¿Desbloquear a ${name}?`;
export const UNBLOCK_USER_BODY =
  "Van a poder volver a enviarse mensajes directos e iniciar llamadas privadas.";
export const UNBLOCK_USER_CONFIRM_ACTION = "Desbloquear";
export const BLOCK_USER_CANCEL_ACTION = "Cancelar";

// --- Palabras prohibidas (configuracion del servidor) ---
export const WORD_FILTER_TITLE = "Palabras prohibidas";
export const WORD_FILTER_DESCRIPTION =
  "Los mensajes que contengan estas palabras no se van a poder enviar. Los mensajes que ya se enviaron no cambian.";
export const WORD_FILTER_INPUT_PLACEHOLDER = "Agregar palabra o frase";
export const WORD_FILTER_ADD_ACTION = "Agregar";
export const WORD_FILTER_EMPTY = "Todavía no hay palabras prohibidas.";
export const WORD_FILTER_SAVE_ACTION = "Guardar cambios";
export const WORD_FILTER_SAVED = "Lista guardada.";
export const removeBannedWordLabel = (word: string) => `Quitar «${word}»`;

// --- Expulsar (#59) ---
export const KICK_ACTION_LABEL = "Expulsar";
export const KICK_MEMBER_TITLE = "Expulsar miembro";
export const KICK_MEMBER_SUBTITLE = "Sale del servidor, pero puede volver";
export const KICK_MEMBER_CONSEQUENCES =
  "Perderá su membresía, sus roles y el acceso a los canales. Puede volver a unirse con una nueva invitación.";
export const KICK_CONFIRM_LABEL = "Confirmar expulsión";
export function kickSuccessNotice(name: string): string {
  return `${name} fue expulsado del servidor. Puede volver con una nueva invitación.`;
}

// --- Silenciar (#60) ---
export const MUTE_ACTION_LABEL = "Silenciar";
export const UNMUTE_ACTION_LABEL = "Quitar silencio";
export const MUTE_MEMBER_TITLE = "Silenciar miembro";
export const MUTE_MEMBER_SUBTITLE = "No podrá escribir ni hablar por un tiempo";
export const MUTE_DURATION_LABEL = "Duración";
export const MUTE_REASON_LABEL = "Motivo";
export const MUTE_REASON_PLACEHOLDER =
  "Contá por qué se silencia a este miembro...";
export const MUTE_MEMBER_CONSEQUENCES =
  "Sigue en el servidor y puede leer, pero no puede enviar mensajes ni hablar en canales de voz hasta que termine el silencio.";
export const MUTE_CONFIRM_LABEL = "Confirmar silencio";
export const MUTED_BADGE_LABEL = "Silenciado";
export function muteSuccessNotice(name: string, until: string): string {
  return `${name} quedó silenciado hasta ${formatMutedUntil(until)}.`;
}
export function unmuteSuccessNotice(name: string): string {
  return `${name} ya puede volver a escribir y hablar.`;
}
/** "las 18:30" si termina hoy; si no, "el 14/10 a las 18:30". Hora local. */
export function formatMutedUntil(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const time = new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
  if (date.toDateString() === now.toDateString()) return `las ${time}`;
  const day = new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
  return `el ${day} a las ${time}`;
}
export function mutedUntilLabel(iso: string, now: Date = new Date()): string {
  return `Silenciado hasta ${formatMutedUntil(iso, now)}`;
}

// --- Miembros por rol (#58) ---
export const ROLE_MEMBERS_TAB = "Miembros";
export const ROLE_MEMBERS_EMPTY = "Nadie tiene este rol todavía.";
export function roleMembersCount(total: number): string {
  return total === 1 ? "1 miembro" : `${total} miembros`;
}

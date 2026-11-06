export const NOTIFICATIONS_LOAD_FAILED =
  "No pudimos cargar tus notificaciones. Intentá de nuevo.";

export const NOTIFICATIONS_TITLE = "Notificaciones";

export const NOTIFICATIONS_EMPTY = "No tenés notificaciones.";

export const NOTIFICATIONS_LOADING = "Cargando…";

export const NOTIFICATIONS_LOAD_OLDER_LABEL = "Ver anteriores";

export const NOTIFICATIONS_CLOSE_LABEL = "Cerrar";

export const NOTIFICATIONS_UNKNOWN_CHANNEL = "un canal";

export const NOTIFICATIONS_DIRECT_MESSAGE_LABEL = "Mensaje directo";

export const NOTIFICATIONS_SHOW_LESS_LABEL = "Ver menos";

export const NOTIFICATIONS_TAB_LABELS = {
  unread: "No leídos",
  all: "Todas",
  mentions: "Menciones",
  direct_messages: "Directos",
} as const;

export const NOTIFICATIONS_EMPTY_BY_TAB = {
  unread: "No tenés notificaciones sin leer.",
  all: NOTIFICATIONS_EMPTY,
  mentions: "No tenés menciones.",
  direct_messages: "No tenés mensajes directos.",
} as const;

export function notificationsShowMoreLabel(hidden: number): string {
  return `Ver ${hidden} más`;
}

export const NOTIFICATIONS_ATTACHMENT_PREVIEW = "Archivo adjunto";

export const NOTIFICATIONS_UNKNOWN_USER_MENTION = "@usuario";

export const NOTIFICATIONS_UNKNOWN_ROLE_MENTION = "@rol";

export const NOTIFICATIONS_MARK_ALL_READ_LABEL = "Marcar todo como leído";

export const NOTIFICATIONS_UNREAD_LABEL = "No leído";

export const UNREAD_MESSAGES_LABEL = "Mensajes sin leer";

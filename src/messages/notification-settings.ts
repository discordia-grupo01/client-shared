import type { NotificationLevel } from "../domain/notification-settings";

export const NOTIFICATION_SETTINGS_LOAD_FAILED =
  "No pudimos cargar tus preferencias de notificación.";

export const NOTIFICATION_SETTINGS_SAVE_FAILED =
  "No pudimos guardar el cambio. Intentá de nuevo.";

export const NOTIFICATION_SETTINGS_MENU_LABEL = "Notificaciones";

export const NOTIFICATION_SETTINGS_CLOSE_LABEL = "Cerrar";

export const NOTIFICATION_SETTINGS_MUTED_TITLE = "Silenciado";

export const NOTIFICATION_SETTINGS_MUTED_HINT =
  "Sin avisos destacados. La actividad sigue contando como no leída.";

export const NOTIFICATION_SETTINGS_LEVEL_TITLE = "Qué te avisa";

export const NOTIFICATION_SETTINGS_SERVER_MUTED_NOTE =
  "El servidor está silenciado: todos sus canales también.";

export function notificationSettingsChannelTitle(name: string): string {
  return `Notificaciones de #${name}`;
}

export function notificationSettingsServerTitle(name: string): string {
  return `Notificaciones de ${name}`;
}

export function notificationMuteLabel(
  scope: "channel" | "server",
  muted: boolean,
): string {
  const target = scope === "channel" ? "canal" : "servidor";
  return muted ? `Reactivar ${target}` : `Silenciar ${target}`;
}

export const NOTIFICATION_LEVEL_LABELS: Readonly<
  Record<NotificationLevel, string>
> = {
  all: "Todos los mensajes",
  mentions: "Solo menciones",
  none: "Nada",
};

export const NOTIFICATION_LEVEL_DESCRIPTIONS: Readonly<
  Record<NotificationLevel, string>
> = {
  all: "Te avisa cada mensaje nuevo.",
  mentions: "Te avisa cuando te mencionan.",
  none: "No te avisa ni siquiera las menciones.",
};

export const NOTIFICATION_LEVEL_INHERITED_BADGE = "Heredado del servidor";

export const NOTIFICATION_LEVEL_DEFAULT_BADGE = "Predeterminado";

export function notificationLevelResetLabel(
  scope: "channel" | "server",
): string {
  return scope === "channel"
    ? "Usar el del servidor"
    : "Restablecer al predeterminado";
}

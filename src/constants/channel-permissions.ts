import type { Channel } from "../domain/channel";
import type { ChannelOverridePermission } from "../domain/channel-permissions";

/**
 * Texto de cada permiso en la pantalla "Sobrescribir permisos" de un canal.
 * No reusa `PERMISSION_COPY` (el editor de roles) a proposito: ahi se habla
 * del servidor ("Ver canales") y aca de un canal puntual ("Ver canal").
 */
export const CHANNEL_PERMISSION_COPY: Record<
  ChannelOverridePermission,
  { label: string; desc: string }
> = {
  VIEW_CHANNELS: {
    label: "Ver canal",
    desc: "Permite ver este canal en la lista de canales y leer sus mensajes.",
  },
  SEND_MESSAGES: {
    label: "Enviar mensajes",
    desc: "Permite enviar mensajes en este canal.",
  },
  MANAGE_MESSAGES: {
    label: "Gestionar mensajes",
    desc: "Permite eliminar mensajes de otros miembros en este canal.",
  },
  ADD_REACTIONS: {
    label: "Agregar reacciones",
    desc: "Permite reaccionar a los mensajes de este canal.",
  },
};

export interface ChannelPermissionGroup {
  title: string;
  permissions: readonly ChannelOverridePermission[];
}

const GENERAL_GROUP: ChannelPermissionGroup = {
  title: "Permisos generales del canal",
  permissions: ["VIEW_CHANNELS"],
};

const TEXT_GROUP: ChannelPermissionGroup = {
  title: "Permisos de canal de texto",
  permissions: ["SEND_MESSAGES", "MANAGE_MESSAGES", "ADD_REACTIONS"],
};

/**
 * Grupos en que se muestran los permisos. Los de mensajes no aplican a un
 * canal de voz (ver `overridablePermissionsFor`). Los titulos van en
 * capitalizacion normal: que se vean en mayusculas lo decide cada app.
 */
export function channelPermissionGroupsFor(
  kind: Channel["kind"],
): readonly ChannelPermissionGroup[] {
  return kind === "voice" ? [GENERAL_GROUP] : [GENERAL_GROUP, TEXT_GROUP];
}

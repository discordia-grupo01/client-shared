import type { RolePermission } from "../domain/role";

/** Colores sugeridos para un rol. Ademas se acepta cualquier hex custom. */
export const COLOR_PALETTE = [
  "#e05252",
  "#e8a800",
  "#38A169",
  "#1abc9c",
  "#245C6B",
  "#6b95bd",
  "#9b59b6",
  "#e91e8c",
  "#e67e22",
  "#f1c40f",
  "#2ecc71",
  "#3498db",
  "#1C293B",
  "#607d8b",
  "#9e9e9e",
  "#8B4513",
];

export const PERMISSION_COPY: Record<
  RolePermission,
  { label: string; desc: string }
> = {
  VIEW_CHANNELS: {
    label: "Ver canales",
    desc: "Permite ver los canales del servidor.",
  },
  SEND_MESSAGES: {
    label: "Enviar mensajes",
    desc: "Permite enviar mensajes en canales de texto.",
  },
  MANAGE_CHANNELS: {
    label: "Gestionar canales",
    desc: "Puede crear, editar y eliminar canales.",
  },
  MANAGE_ROLES: {
    label: "Gestionar roles",
    desc: "Puede crear, editar y asignar roles a miembros.",
  },
  KICK_MEMBERS: {
    label: "Expulsar miembros",
    desc: "Puede expulsar miembros del servidor.",
  },
  BAN_MEMBERS: {
    label: "Banear miembros",
    desc: "Puede banear miembros permanentemente.",
  },
  MANAGE_SERVER: {
    label: "Gestionar el servidor",
    desc: "Puede cambiar la configuración del servidor.",
  },
};

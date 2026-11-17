import { type BoostLevel } from "../domain/boost";

import { boostCountLabel, boostLevelLabel } from "./boost";
import { roleMembersCount } from "./ui";

export const SERVER_MENU_INVITE_LABEL = "Invitar miembros";
export const SERVER_SETTINGS_MENU_LABEL = "Configuración del servidor";

export const SERVER_SETTINGS_MENU_DESCRIPTION = "Emojis, roles, baneos y más";

export const SERVER_MENU_CREATE_CHANNEL_LABEL = "Crear canal";
export const SERVER_MENU_CREATE_CATEGORY_LABEL = "Crear categoría";
export const SERVER_MENU_TRANSFER_LABEL = "Transferir propiedad";
export const SERVER_MENU_LEAVE_LABEL = "Abandonar servidor";

export const SERVER_QUICK_ACTIONS = [
  "invite",
  "notifications",
  "boosts",
  "emojis",
] as const;

export type ServerQuickAction = (typeof SERVER_QUICK_ACTIONS)[number];

export const SERVER_QUICK_ACTION_LABELS: Readonly<
  Record<ServerQuickAction, string>
> = {
  invite: "Invitar",
  notifications: "Notificaciones",
  boosts: "Boosts",
  emojis: "Emojis",
};

export function emojiSlotsBadge(used: number, max: number): string {
  return `${used}/${max}`;
}

export function serverSheetMetaLabel(
  level: BoostLevel,
  boostCount: number,
  memberCount: number,
): string {
  return [
    boostLevelLabel(level),
    boostCountLabel(boostCount),
    roleMembersCount(memberCount),
  ].join(" · ");
}

export const ROLES_SECTION_TITLE = "Roles";
export const ROLES_SECTION_SUBTITLE = "Permisos y jerarquía";

export const BANS_SECTION_TITLE = "Baneos";
export const BANS_SECTION_SUBTITLE = "Usuarios baneados";

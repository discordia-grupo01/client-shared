import type { MessageAuthor } from "../domain/message";

/**
 * Autores de demo para los mensajes directos, que siguen maquetados mientras no
 * exista el servicio de DMs. Los mensajes de canal ya salen de `messaging`
 * (ver `useChannelMessages`). Se borra cuando se integren los DMs.
 */
export const DEMO_AUTHORS: Record<string, MessageAuthor> = {
  "demo-xeno": {
    id: "demo-xeno",
    name: "XenoBlaze",
    avatarUrl: null,
    roleName: "Administrador",
    roleColor: "#fce3a4",
  },
  "demo-night": {
    id: "demo-night",
    name: "NightOwl_42",
    avatarUrl: null,
    roleName: "Moderador",
    roleColor: "#38a169",
  },
  "demo-pixel": {
    id: "demo-pixel",
    name: "PixelHunter",
    avatarUrl: null,
    roleName: null,
    roleColor: "#6b95bd",
  },
};

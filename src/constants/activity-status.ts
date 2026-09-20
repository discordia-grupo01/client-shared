/**
 * Maquetado puramente visual: identify-service no tiene ningun sistema de
 * presencia todavia (sin campo, sin websocket). No se persiste ni se propaga
 * a otros usuarios.
 *
 * El mapeo a color lo resuelve cada app con su theme: web con clases de
 * Tailwind, mobile con su paleta. Eso es presentacion y no va aca.
 */
export type ActivityStatus = "online" | "idle" | "dnd" | "offline";

export const ACTIVITY_STATUS_LABEL: Record<ActivityStatus, string> = {
  online: "En línea",
  idle: "Ausente",
  dnd: "No molestar",
  offline: "Desconectado",
};

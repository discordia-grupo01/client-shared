/**
 * Maquetado puramente visual: identify-service no tiene ningun sistema de
 * presencia todavia (sin campo, sin websocket). No se persiste ni se propaga
 * a otros usuarios.
 *
 * Habia dos vocabularios para lo mismo: el selector decia "Automático" e
 * "Invisible" y el puntito decia "En línea" y "Desconectado". Eran tres
 * opciones con seis nombres. Ahora es un solo set.
 *
 * Habia ademas un cuarto estado, `idle` ("Ausente"), que no producia nadie.
 *
 * TODO: cuando exista presencia de verdad van a hacer falta dos cosas que hoy
 * no se distinguen: lo que el usuario elige y lo que el servidor reporta de
 * otra persona (que puede ser "ausente por inactividad", sin que nadie lo
 * haya elegido). Recien ahi tiene sentido volver a separar los tipos.
 *
 * El mapeo a color lo resuelve cada app con su theme: web con clases de
 * Tailwind, mobile con su paleta. Eso es presentacion y no va aca.
 */
export type ActivityStatus = "online" | "dnd" | "offline";

/** El orden es el que se muestra en el selector. */
export const ACTIVITY_STATUSES: readonly ActivityStatus[] = [
  "online",
  "dnd",
  "offline",
];

export const ACTIVITY_STATUS_LABEL: Record<ActivityStatus, string> = {
  online: "En línea",
  dnd: "No molestar",
  offline: "Desconectado",
};

/** La linea de ayuda debajo de cada opcion: que ven los demas. */
export const ACTIVITY_STATUS_DESCRIPTION: Record<ActivityStatus, string> = {
  online: "El resto te ve conectado.",
  dnd: "Nadie puede enviarte mensajes directos.",
  offline: "Aparecés como desconectado para el resto.",
};

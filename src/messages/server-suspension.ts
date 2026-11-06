/**
 * Mensajes de servidor suspendido por el staff de la plataforma.
 */

/** Pantalla que reemplaza a todo el servidor (canales, chat y miembros) mientras dure la suspensión. */
export const SERVER_SUSPENDED_TITLE = "Este servidor está suspendido";
export const SERVER_SUSPENDED_HINT =
  "El equipo de la plataforma suspendió este servidor. Vas a poder entrar cuando se levante la suspensión.";

/** Cómo se nombra en la barra un servidor suspendido (tooltip y lector de pantalla). */
export function serverSuspendedLabel(serverName: string): string {
  return `${serverName}, suspendido`;
}

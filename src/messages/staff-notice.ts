/**
 * Modal que ve el dueño cuando el staff eliminó su servidor. El motivo no
 * viaja en ningún evento, así que no se muestra.
 */
export const SERVER_DELETED_NOTICE_TITLE = "Tu servidor fue eliminado";
export const SERVER_DELETED_NOTICE_ACTION = "Entendido";

export function serverDeletedNoticeDescription(serverName: string): string {
  return `El equipo de la plataforma eliminó el servidor "${serverName}". Esta acción no se puede deshacer.`;
}

export const STAFF_NOTICES_LOAD_FAILED =
  "No se pudieron cargar los avisos de la plataforma.";
export const STAFF_NOTICE_SEEN_FAILED =
  "No se pudo marcar el aviso como visto.";

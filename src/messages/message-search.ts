/**
 * Textos de la busqueda de mensajes y del salto a un resultado. Todos en voseo.
 */
import { MAX_MESSAGE_SEARCH_LENGTH } from "../constants/limits";

export const MESSAGE_SEARCH_PLACEHOLDER = "Buscar mensajes";
export const MESSAGE_SEARCH_LABEL = "Buscar mensajes en el servidor";
export const MESSAGE_SEARCH_TITLE = "Resultados de búsqueda";
export const MESSAGE_SEARCH_CLOSE = "Cerrar búsqueda";
export const MESSAGE_SEARCH_SUBMIT = "Buscar";

/** Antes de la primera busqueda. */
export const MESSAGE_SEARCH_HINT_TITLE = "Buscá en este servidor";
export const MESSAGE_SEARCH_HINT =
  "Escribí una palabra y apretá Enter, o elegí un autor.";

/** CA 3: la busqueda no encontro nada. */
export const MESSAGE_SEARCH_NO_RESULTS_TITLE = "No encontramos mensajes";
export const MESSAGE_SEARCH_NO_RESULTS_HINT =
  "Probá con otras palabras o sacá el filtro de autor.";

export const MESSAGE_SEARCH_LOADING = "Buscando…";

/** Filtro de autor. */
export const MESSAGE_SEARCH_AUTHOR_LABEL = "De";
export const MESSAGE_SEARCH_ANY_AUTHOR = "Cualquiera";
export const MESSAGE_SEARCH_PICK_AUTHOR = "Elegir autor";
export const MESSAGE_SEARCH_CLEAR_AUTHOR = "Quitar filtro de autor";
export const MESSAGE_SEARCH_AUTHOR_PLACEHOLDER = "Buscar miembro…";
export const MESSAGE_SEARCH_NO_MEMBERS = "No hay miembros con ese nombre";

/** Validaciones antes de mandar la busqueda. */
export const MESSAGE_SEARCH_EMPTY_QUERY =
  "Escribí algo o elegí un autor para buscar.";
export const MESSAGE_SEARCH_TEXT_TOO_LONG = `La búsqueda puede tener hasta ${MAX_MESSAGE_SEARCH_LENGTH} caracteres.`;

/** Errores del back. */
export const MESSAGE_SEARCH_FAILED =
  "No se pudo completar la búsqueda, intentá de nuevo en un momento.";
export const MESSAGE_SEARCH_RATE_LIMITED =
  "Estás buscando muy rápido. Esperá un momento y volvé a intentar.";
export const MESSAGE_SEARCH_PAGE_FAILED =
  "No pudimos cargar esta página. Volvé a buscar.";
export const MESSAGE_SEARCH_NOT_MEMBER = "No sos miembro de este servidor.";
export const MESSAGE_SEARCH_INVALID_QUERY = `Ingresá un término de hasta ${MAX_MESSAGE_SEARCH_LENGTH} caracteres o elegí un autor para buscar.`;

const SEARCH_ERROR_MESSAGES: Readonly<Record<string, string>> = {
  INVALID_SEARCH_QUERY: MESSAGE_SEARCH_INVALID_QUERY,
  INVALID_CURSOR: MESSAGE_SEARCH_PAGE_FAILED,
  NOT_SERVER_MEMBER: MESSAGE_SEARCH_NOT_MEMBER,
  SEARCH_UNAVAILABLE: MESSAGE_SEARCH_FAILED,
};

export function messageSearchErrorFor(code: unknown, status?: number): string {
  if (status === 429) return MESSAGE_SEARCH_RATE_LIMITED;
  return (
    (typeof code === "string" ? SEARCH_ERROR_MESSAGES[code] : undefined) ??
    MESSAGE_SEARCH_FAILED
  );
}

export function messageSearchResultsCount(
  total: number,
  capped: boolean = false,
): string {
  if (capped) return `${total}+ resultados`;
  return total === 1 ? "1 resultado" : `${total} resultados`;
}

export const VIEWING_OLDER_MESSAGES = "Estás viendo mensajes anteriores";
export const JUMP_TO_PRESENT_LABEL = "Ir al presente";
export const LOAD_NEWER_MESSAGES_LABEL = "Cargar mensajes más recientes";
export const JUMP_TO_MESSAGE_FAILED =
  "No pudimos abrir ese mensaje. Intentá de nuevo.";
export const JUMP_TO_MESSAGE_LABEL = "Ir al mensaje";

/** "1 adjunto", "3 adjuntos": los resultados no muestran los archivos. */
export function messageAttachmentsCount(count: number): string {
  return count === 1 ? "1 adjunto" : `${count} adjuntos`;
}

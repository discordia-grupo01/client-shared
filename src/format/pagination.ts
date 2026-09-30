/**
 * Paginacion en memoria, para listas que el backend no filtra ni pagina como
 * la UI necesita (la de baneados: el back solo devuelve `user_id`, el nombre
 * se resuelve aparte, asi que buscar por nombre y paginar lo hace el front).
 *
 * Las paginas son 1-based, porque es lo que ve el usuario.
 */

export const DEFAULT_PAGE_SIZE = 20;

/** Cuantos numeros de pagina se muestran a la vez en la barra. */
export const PAGE_WINDOW_SIZE = 5;

/** Siempre hay al menos una pagina, aunque la lista este vacia. */
export function pageCountOf(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

/** Deja `page` dentro de `[1, pageCount]`: al filtrar o borrar puede quedar fuera. */
export function clampPage(page: number, pageCount: number): number {
  return Math.min(Math.max(1, page), pageCount);
}

export function paginate<T>(
  items: readonly T[],
  page: number,
  pageSize: number,
): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

/** Rango que se esta mostrando, 1-based e inclusive: "11-20 de 44". */
export function pageRange(
  page: number,
  pageSize: number,
  total: number,
): { from: number; to: number } {
  if (total === 0) return { from: 0, to: 0 };
  return {
    from: (page - 1) * pageSize + 1,
    to: Math.min(page * pageSize, total),
  };
}

/**
 * Los numeros de pagina a dibujar: una ventana de `windowSize` centrada en la
 * pagina actual que se pega al borde cuando esta cerca del principio o del
 * final, para que siempre haya `windowSize` botones si alcanzan las paginas.
 */
export function visiblePages(
  page: number,
  pageCount: number,
  windowSize: number = PAGE_WINDOW_SIZE,
): number[] {
  const size = Math.min(windowSize, pageCount);
  const start = Math.min(
    Math.max(1, page - Math.floor(size / 2)),
    pageCount - size + 1,
  );
  return Array.from({ length: size }, (_, index) => start + index);
}

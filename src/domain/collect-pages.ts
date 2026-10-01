import type { ApiResult } from "./api-result";

export interface PageOf<T> {
  items: T[];
  total: number;
}

/**
 * Junta TODAS las paginas de un listado paginado por `offset` (el back corta
 * en 100 por request) para las pantallas que buscan y paginan en memoria. Las
 * paginas se piden en orden; se corta si el back devuelve una vacia aunque
 * falten items (algo se borro entre dos requests). Falla con la primera
 * pagina que falle.
 */
export async function collectAllPages<T>(
  fetchPage: (offset: number) => Promise<ApiResult<PageOf<T>>>,
): Promise<ApiResult<PageOf<T>>> {
  const items: T[] = [];
  let total = 0;

  do {
    const page = await fetchPage(items.length);
    if (!page.ok) return page;
    if (page.data.items.length === 0) break;
    items.push(...page.data.items);
    total = page.data.total;
  } while (items.length < total);

  return { ok: true, status: 200, data: { items, total: items.length } };
}

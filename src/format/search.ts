/**
 * Minusculas y sin tildes: "Andrés" se encuentra escribiendo "andres". Es la
 * misma normalizacion para lo que se escribe y para lo que se compara.
 */
export function normalizeSearchText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/** Una busqueda vacia coincide con todo. */
export function matchesSearch(text: string, query: string): boolean {
  const needle = normalizeSearchText(query);
  return needle === "" || normalizeSearchText(text).includes(needle);
}

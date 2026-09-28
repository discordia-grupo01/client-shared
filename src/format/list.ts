import { UNASSIGNED_CATEGORY_NAME } from "../constants/app";
import type { Category } from "../domain/category";
import type { Channel } from "../domain/channel";

/**
 * Canales y categorias vienen con `position` y el backend NO los ordena: los
 * devuelve como salgan de la base. Ordenar es responsabilidad del front, y
 * estaba escrito a mano en cinco lugares entre las dos apps.
 *
 * Copia el array en vez de ordenarlo en el lugar: `server.channels` viene de
 * un estado de React y mutarlo no dispara el re-render.
 */
export function sortByPosition<T extends { position: number }>(
  items: readonly T[],
): T[] {
  return [...items].sort((a, b) => a.position - b.position);
}

/**
 * Los canales de una categoria, ordenados. `categoryId` en `null` devuelve los
 * que no estan en ninguna, que es la seccion de arriba de la lista.
 */
export function channelsOfCategory(
  channels: readonly Channel[],
  categoryId: string | null,
): Channel[] {
  return sortByPosition(
    channels.filter((channel) => channel.category_id === categoryId),
  );
}

/**
 * "Sin asignar" es una categoria real (el backend la crea en todo server,
 * como fallback para canales sin categoria explicita), pero en la UI no se
 * muestra como una categoria mas: sus canales van en la seccion de arriba,
 * sin el header/menu de una categoria real. La API no manda ningun flag
 * para esto, asi que se distingue por nombre exacto.
 */
export function isUnassignedCategory(category: Category): boolean {
  return category.name === UNASSIGNED_CATEGORY_NAME;
}

/**
 * Las categorias que se muestran como secciones propias (con su header):
 * todas menos "Sin asignar".
 */
export function visibleCategories(categories: readonly Category[]): Category[] {
  return categories.filter((category) => !isUnassignedCategory(category));
}

/**
 * Los canales de la seccion de arriba, sin agrupar bajo ninguna categoria:
 * los que no tienen category_id (hoy solo pasa si se borro la categoria
 * "Sin asignar" del server) mas los que estan en "Sin asignar".
 */
export function topLevelChannels(
  channels: readonly Channel[],
  categories: readonly Category[],
): Channel[] {
  const unassigned = categories.find(isUnassignedCategory);
  return sortByPosition(
    channels.filter(
      (channel) =>
        channel.category_id === null || channel.category_id === unassigned?.id,
    ),
  );
}

/**
 * Primera letra del nombre, para el avatar cuando no hay imagen.
 *
 * Devuelve `null` con un nombre vacio en vez de un caracter inventado: cada
 * pantalla decide que poner. El avatar usa `?`, y el preview de "crear
 * servidor" no muestra nada hasta que escribis algo.
 *
 * Usa spread y no `charAt(0)`: el nombre de un servidor puede empezar con un
 * emoji, y `charAt` devolveria media pareja subrogada (un caracter roto).
 */
export function getInitial(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed === "") return null;
  return [...trimmed][0].toUpperCase();
}

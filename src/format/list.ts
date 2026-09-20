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

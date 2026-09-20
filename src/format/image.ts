/**
 * El backend devuelve dos formatos segun donde este guardada la imagen: una
 * ruta relativa (`/uploads/profile-images/x.jpg`) o una URL absoluta de
 * Supabase. Esto normaliza los dos casos.
 *
 * `apiUrl` se pasa por parametro porque cada app la resuelve distinto y este
 * paquete no puede leer variables de entorno.
 */
export function resolveImageUrl(
  imagePath: string | null | undefined,
  apiUrl: string,
): string | null {
  if (!imagePath) return null;
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  return `${apiUrl}${imagePath}`;
}

/** "image/jpeg" -> "JPEG". */
function formatType(mimeType: string): string {
  return mimeType.replace("image/", "").toUpperCase();
}

/**
 * `["image/png", "image/jpeg", "image/webp"]` -> `"PNG, JPEG o WEBP"`.
 *
 * Los mensajes se arman desde la lista para que no puedan desincronizarse.
 * Antes las cuatro copias decian "JPEG, PNG o GIF" aunque dos de las listas no
 * aceptaban GIF.
 */
export function formatImageTypes(types: readonly string[]): string {
  const names = types.map(formatType);
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} o ${names[names.length - 1]}`;
}

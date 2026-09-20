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

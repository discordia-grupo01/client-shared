/**
 * Formatea una fecha ISO como "12 de marzo de 2022". Devuelve "" si es invalida.
 *
 * OJO: formatea en la zona horaria del dispositivo, no en UTC. El back guarda
 * `created_at` en UTC, asi que una cuenta creada a la medianoche UTC se ve un
 * dia antes desde Argentina (UTC-3). Comportamiento heredado de las dos apps;
 * ver si se fija a UTC.
 */
export function formatMemberSince(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

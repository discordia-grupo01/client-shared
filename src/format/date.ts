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

/**
 * Dias que faltan para una fecha ISO, redondeado. Nunca negativo: si ya paso,
 * devuelve 0 y el llamador muestra "vencida" por otro lado.
 */
export function daysUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.round(ms / (24 * 60 * 60 * 1000)));
}

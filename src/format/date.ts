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

const SHORT_MONTHS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
] as const;

export function dayAndMonth(date: Date): string {
  return `${date.getDate()} ${SHORT_MONTHS[date.getMonth()]}`;
}

export function formatDayAndMonth(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  return dayAndMonth(date);
}

export function daysUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.round(ms / (24 * 60 * 60 * 1000)));
}

/**
 * Formatos de fecha de los mensajes. Como `formatMemberSince`, usan la zona
 * horaria del dispositivo: la hora de un mensaje se lee en hora local.
 */

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** "14:32". Devuelve "" si la fecha es invalida. */
export function formatMessageTime(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * "Hoy a las 14:32", "Ayer a las 14:32" o "12/03/2026 14:32". `now` se
 * inyecta para poder testearlo. Devuelve "" si la fecha es invalida.
 */
export function formatMessageTimestamp(
  isoDate: string,
  now: Date = new Date(),
): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";

  const time = formatMessageTime(isoDate);
  if (isSameDay(date, now)) return `Hoy a las ${time}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) return `Ayer a las ${time}`;

  const day = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
  return `${day} ${time}`;
}

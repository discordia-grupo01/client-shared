function groupThousands(value: number): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** 499900 -> "$ 4.999"; 150 -> "$ 1,50". */
export function formatArsFromCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(Math.round(cents));
  const pesos = Math.floor(abs / 100);
  const rest = abs % 100;
  const decimals = rest === 0 ? "" : `,${String(rest).padStart(2, "0")}`;
  return `${sign}$ ${groupThousands(pesos)}${decimals}`;
}

/** 1200 -> "1.200 puntos"; 1 -> "1 punto". */
export function formatPoints(points: number): string {
  return `${groupThousands(points)} ${Math.abs(points) === 1 ? "punto" : "puntos"}`;
}

/** Movimiento del saldo con signo: 550 -> "+550", -100 -> "−100". */
export function formatPointsDelta(delta: number): string {
  if (delta === 0) return "0";
  return `${delta > 0 ? "+" : "−"}${groupThousands(Math.abs(delta))}`;
}

const BILLING_DATE_TIME = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
});

export function formatBillingDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : BILLING_DATE_TIME.format(date);
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

function dayAndMonth(date: Date): string {
  return `${date.getDate()} ${SHORT_MONTHS[date.getMonth()]}`;
}

function clockTime(date: Date): string {
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${date.getHours()}:${minutes}`;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatShortDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${dayAndMonth(date)} ${date.getFullYear()}`;
}

export function formatShortDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${formatShortDate(iso)}, ${clockTime(date)}`;
}

export function formatShortDateTimeRange(
  fromIso: string,
  toIso: string,
): string {
  const from = new Date(fromIso);
  const to = new Date(toIso);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return "";
  const start =
    from.getFullYear() === to.getFullYear()
      ? `${dayAndMonth(from)}, ${clockTime(from)}`
      : formatShortDateTime(fromIso);
  return `${start} al ${formatShortDateTime(toIso)}`;
}

export function formatDayAndTime(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  if (!sameDay(date, now)) return formatShortDateTime(iso);
  return `Hoy, ${clockTime(date)}`;
}

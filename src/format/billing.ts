
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

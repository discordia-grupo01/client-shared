/**
 * `max_uses` es opcional: vacio significa "sin limite". Si viene, el back
 * exige un entero positivo (`ErrInviteMaxUsesInvalid`).
 */
export function validateMaxUses(input: string): string | undefined {
  const trimmed = input.trim();
  if (trimmed === "") return undefined;

  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return "El límite de usos debe ser un número entero mayor a 0.";
  }
  return undefined;
}

/** Devuelve el valor listo para mandar: `null` cuando no hay limite. */
export function parseMaxUses(input: string): number | null {
  const trimmed = input.trim();
  return trimmed === "" ? null : Number(trimmed);
}

/** El back solo acepta #RRGGBB: rechaza #RGB y nombres de color. */
export function isValidHex(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

/** Asume un hex valido; validar con `isValidHex` antes si viene del usuario. */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

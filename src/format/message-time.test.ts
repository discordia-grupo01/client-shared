import { describe, expect, it } from "vitest";

import { formatMessageTime, formatMessageTimestamp } from "./message-time";

// Fechas sin "Z" a proposito: se interpretan en hora local, igual que el
// formateo, asi el test no depende de la zona horaria de la maquina.
const AHORA = new Date("2026-09-29T18:00:00");

describe("formatMessageTime", () => {
  it("formatea la hora con dos digitos", () => {
    expect(formatMessageTime("2026-09-29T09:05:00")).toBe("09:05");
  });

  it("devuelve string vacio si la fecha es invalida", () => {
    expect(formatMessageTime("no-es-una-fecha")).toBe("");
  });
});

describe("formatMessageTimestamp", () => {
  it("hoy", () => {
    expect(formatMessageTimestamp("2026-09-29T14:32:00", AHORA)).toBe(
      "Hoy a las 14:32",
    );
  });

  it("ayer", () => {
    expect(formatMessageTimestamp("2026-09-28T23:59:00", AHORA)).toBe(
      "Ayer a las 23:59",
    );
  });

  it("otro dia", () => {
    expect(formatMessageTimestamp("2026-03-12T08:00:00", AHORA)).toBe(
      "12/03/2026 08:00",
    );
  });

  it("devuelve string vacio si la fecha es invalida", () => {
    expect(formatMessageTimestamp("", AHORA)).toBe("");
  });
});

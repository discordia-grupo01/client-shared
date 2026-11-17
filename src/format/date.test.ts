import { describe, expect, it } from "vitest";

import { formatDayAndMonth, formatMemberSince } from "./date";

describe("formatMemberSince", () => {
  // Mediodia UTC a proposito: con medianoche el resultado cambia segun la zona
  // horaria del dispositivo (ver nota sobre timezone en date.ts).
  it("formatea una fecha ISO en es-AR", () => {
    expect(formatMemberSince("2022-03-12T12:00:00Z")).toBe(
      "12 de marzo de 2022",
    );
  });

  it("devuelve string vacio si la fecha es invalida", () => {
    expect(formatMemberSince("no-es-una-fecha")).toBe("");
    expect(formatMemberSince("")).toBe("");
  });
});

describe("formatDayAndMonth", () => {
  it("abrevia el mes sin punto", () => {
    expect(formatDayAndMonth("2026-11-03T12:00:00Z")).toBe("3 nov");
    expect(formatDayAndMonth("2026-01-28T12:00:00Z")).toBe("28 ene");
  });

  it("devuelve string vacio si la fecha es invalida", () => {
    expect(formatDayAndMonth("no-es-una-fecha")).toBe("");
    expect(formatDayAndMonth("")).toBe("");
  });
});

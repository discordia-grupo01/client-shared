import { describe, expect, it } from "vitest";

import {
  ACTIVITY_STATUS_CHOICE_DESCRIPTION,
  ACTIVITY_STATUS_CHOICE_LABEL,
  ACTIVITY_STATUS_CHOICES,
  ACTIVITY_STATUS_LABEL,
  displayedStatus,
} from "./activity-status";

describe("estado de actividad", () => {
  it("son cuatro opciones, en el orden del selector", () => {
    expect(ACTIVITY_STATUS_CHOICES).toEqual([
      "online",
      "idle",
      "dnd",
      "invisible",
    ]);
  });

  it("cada opcion tiene nombre y una descripcion (puede ser vacia)", () => {
    for (const choice of ACTIVITY_STATUS_CHOICES) {
      expect(ACTIVITY_STATUS_CHOICE_LABEL[choice]).toBeTruthy();
      expect(ACTIVITY_STATUS_CHOICE_DESCRIPTION[choice]).toBeDefined();
    }
    expect(Object.keys(ACTIVITY_STATUS_CHOICE_LABEL)).toHaveLength(
      ACTIVITY_STATUS_CHOICES.length,
    );
  });

  it("no hay dos opciones con el mismo nombre", () => {
    const nombres = Object.values(ACTIVITY_STATUS_CHOICE_LABEL);
    expect(new Set(nombres).size).toBe(nombres.length);
  });

  it("invisible se muestra como desconectado y el resto no cambia", () => {
    expect(displayedStatus("invisible")).toBe("offline");
    expect(displayedStatus("online")).toBe("online");
    expect(displayedStatus("idle")).toBe("idle");
    expect(displayedStatus("dnd")).toBe("dnd");
    expect(ACTIVITY_STATUS_LABEL.offline).toBe("Desconectado");
  });
});

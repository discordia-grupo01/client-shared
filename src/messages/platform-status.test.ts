import { describe, expect, it } from "vitest";

import { platformServiceLabel } from "../constants/platform-services";
import type { Incident } from "../domain/platform-status";
import {
  activeIncidentsLabel,
  incidentSinceLabel,
  statusNoticeKey,
  statusNoticeText,
} from "./platform-status";

function incident(id: string, title = `Incidente ${id}`): Incident {
  return {
    id,
    title,
    description: "Detalle",
    affected_services: ["messaging"],
    platform_status: "degraded",
    status: "active",
    created_at: "2026-11-03T10:00:00Z",
  };
}

describe("statusNoticeText", () => {
  it("muestra el título si hay uno solo y la cantidad si hay más", () => {
    expect(statusNoticeText([incident("a", "Demoras en mensajes")])).toBe(
      "Demoras en mensajes",
    );
    expect(statusNoticeText([incident("a"), incident("b")])).toBe(
      "Hay 2 incidentes activos",
    );
  });
});

describe("statusNoticeKey", () => {
  it("no depende del orden y cambia si aparece un incidente nuevo", () => {
    const key = statusNoticeKey([incident("b"), incident("a")]);
    expect(key).toBe(statusNoticeKey([incident("a"), incident("b")]));
    expect(key).not.toBe(
      statusNoticeKey([incident("a"), incident("b"), incident("c")]),
    );
  });
});

describe("activeIncidentsLabel", () => {
  it("usa singular, plural y el caso vacío", () => {
    expect(activeIncidentsLabel(0)).toBe("Sin incidentes activos");
    expect(activeIncidentsLabel(1)).toBe("1 incidente activo");
    expect(activeIncidentsLabel(2)).toBe("2 incidentes activos");
  });
});

describe("incidentSinceLabel", () => {
  const now = Date.parse("2026-11-03T12:00:00Z");

  it("muestra minutos, horas y días", () => {
    expect(incidentSinceLabel("2026-11-03T11:59:30Z", now)).toBe(
      "desde hace instantes",
    );
    expect(incidentSinceLabel("2026-11-03T11:20:00Z", now)).toBe(
      "desde hace 40 min",
    );
    expect(incidentSinceLabel("2026-11-03T09:00:00Z", now)).toBe(
      "desde hace 3 h",
    );
    expect(incidentSinceLabel("2026-11-02T12:00:00Z", now)).toBe(
      "desde hace 1 día",
    );
  });
});

describe("platformServiceLabel", () => {
  it("traduce los ids conocidos y deja los demás como vienen", () => {
    expect(platformServiceLabel("voice")).toBe("Voz");
    expect(platformServiceLabel("otro")).toBe("otro");
  });
});

import type {
  Incident,
  IncidentType,
  PlatformStatus,
} from "../domain/platform-status";

export const PLATFORM_STATUS_TITLE = "Estado de la plataforma";

export const PLATFORM_STATUS_LOAD_FAILED =
  "No pudimos consultar el estado de la plataforma.";

export const PLATFORM_STATUS_LABELS: Readonly<Record<PlatformStatus, string>> =
  {
    operational: "Todo funciona con normalidad",
    degraded: "Estamos teniendo problemas",
    maintenance: "Mantenimiento en curso",
  };

export const PLATFORM_STATUS_SUMMARIES: Readonly<
  Record<PlatformStatus, string>
> = {
  operational: "No hay incidentes en este momento.",
  degraded:
    "Algunas funciones pueden fallar o andar lento. Ya estamos trabajando para resolverlo.",
  maintenance:
    "Estamos haciendo mejoras. Algunas funciones pueden no estar disponibles por un rato.",
};

export const INCIDENT_TYPE_LABELS: Readonly<Record<IncidentType, string>> = {
  degraded: "Problema",
  maintenance: "Mantenimiento",
};

export const VIEW_PLATFORM_STATUS_LABEL = "Ver estado";
export const HIDE_STATUS_NOTICE_LABEL = "Ocultar aviso";

export function statusNoticeText(incidents: readonly Incident[]): string {
  if (incidents.length === 1) return incidents[0].title;
  return `Hay ${incidents.length} incidentes activos`;
}

export function activeIncidentsLabel(count: number): string {
  if (count === 0) return "Sin incidentes activos";
  return `${count} ${count === 1 ? "incidente activo" : "incidentes activos"}`;
}

export function incidentSinceLabel(isoDate: string, now = Date.now()): string {
  const minutes = Math.max(
    0,
    Math.floor((now - new Date(isoDate).getTime()) / 60_000),
  );
  if (minutes < 1) return "desde hace instantes";
  if (minutes < 60) return `desde hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `desde hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `desde hace ${days} ${days === 1 ? "día" : "días"}`;
}

export function statusNoticeKey(incidents: readonly Incident[]): string {
  return incidents
    .map((incident) => incident.id)
    .sort()
    .join(",");
}

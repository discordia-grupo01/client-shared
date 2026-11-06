export type PlatformStatus = "operational" | "degraded" | "maintenance";

export type IncidentType = Exclude<PlatformStatus, "operational">;

export type PlatformServiceId =
  | "identify"
  | "servers"
  | "messaging"
  | "notifications"
  | "voice"
  | "admin"
  | "metrics";

export interface Incident {
  id: string;
  title: string;
  description: string;
  affected_services: string[];
  platform_status: IncidentType;
  status: "active" | "resolved";
  created_at: string;
  resolved_at?: string;
}

export interface PlatformStatusResponse {
  status: PlatformStatus;
  incidents: Incident[];
}

export const PLATFORM_STATUS_SOCKET_EVENTS = {
  changed: "status_changed",
} as const;

export interface PlatformStatusChangedPayload {
  refetch: true;
  status: PlatformStatus;
}

export type PlatformStatusResult =
  ({ ok: true } & PlatformStatusResponse) | { ok: false; message: string };

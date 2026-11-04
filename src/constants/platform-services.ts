import type { PlatformServiceId } from "../domain/platform-status";

export const PLATFORM_SERVICES: readonly {
  id: PlatformServiceId;
  label: string;
}[] = [
  { id: "identify", label: "Identidad y autenticación" },
  { id: "servers", label: "Servidores y canales" },
  { id: "messaging", label: "Mensajería" },
  { id: "notifications", label: "Notificaciones" },
  { id: "voice", label: "Voz" },
  { id: "admin", label: "Administración" },
  { id: "metrics", label: "Métricas" },
];

export function platformServiceLabel(id: string): string {
  return PLATFORM_SERVICES.find((service) => service.id === id)?.label ?? id;
}

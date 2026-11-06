import type { ServerSummary } from "./server";

const NONE: ReadonlySet<string> = new Set();

/** Ids de los servidores que el staff suspendió. */
export function suspendedServerIds(
  servers: readonly Pick<ServerSummary, "id" | "suspended">[],
): ReadonlySet<string> {
  const ids = servers.filter((server) => server.suspended).map((s) => s.id);
  return ids.length === 0 ? NONE : new Set(ids);
}

/**
 * Saca lo que viene de un servidor suspendido (historial de notificaciones,
 * menciones). No se borra nada: al reactivarlo vuelve a aparecer solo.
 */
export function withoutSuspendedServers<T extends { server_id: string | null }>(
  items: readonly T[],
  suspended: ReadonlySet<string>,
): readonly T[] {
  if (suspended.size === 0) return items;
  const kept = items.filter(
    (item) => item.server_id === null || !suspended.has(item.server_id),
  );
  return kept.length === items.length ? items : kept;
}

/**
 * Lo mismo para los estados guardados por id con su `serverId` (no leídos,
 * menciones sin leer). Devuelve el mismo objeto si no hay nada que sacar.
 */
export function withoutSuspendedEntries<
  T extends Readonly<Record<string, { serverId: string }>>,
>(state: T, suspended: ReadonlySet<string>): T {
  if (suspended.size === 0) return state;
  const entries = Object.entries(state);
  const kept = entries.filter(([, entry]) => !suspended.has(entry.serverId));
  return kept.length === entries.length
    ? state
    : (Object.fromEntries(kept) as T);
}

/** Deja el servidor como lo lista `GET /v1/servers` cuando está suspendido: sin canales ni categorías. */
export function markServerSuspended(
  servers: readonly ServerSummary[],
  serverId: string,
): ServerSummary[] {
  return servers.map((server) =>
    server.id === serverId
      ? { ...server, suspended: true, channels: [], categories: [] }
      : server,
  );
}

import {
  type ActivityStatus,
  type ActivityStatusChoice,
  displayedStatus,
} from "../constants/activity-status";
import type {
  ListPresenceResult,
  OwnStatusPayload,
  PresenceEntry,
  PresenceMap,
  UserChannelJoinReply,
} from "../domain/presence";
import { OWN_STATUS_FAILED, presenceErrorFor } from "../messages/presence";

import type {
  MessageActionResult,
  PushOptions,
  RealtimeChannel,
} from "./channel-chat";
import type { AcquireSocketResult } from "../socket/socket-manager";

// El paquete no tiene tipos de timers (lib ES2020 sin "dom" ni @types/node);
// en runtime son los globales de cada plataforma.
declare function setTimeout(callback: () => void, ms: number): unknown;
declare function clearTimeout(id: unknown): void;

/** Tope de ids por pedido de `GET /v1/presence`. */
export const PRESENCE_MAX_IDS_PER_REQUEST = 100;

/** Lo que usa el back si no configuro otra cosa (`PRESENCE_IDLE_MS`). */
export const DEFAULT_IDLE_AFTER_MS = 5 * 60 * 1000;

export const NO_PRESENCE: PresenceMap = {};

/**
 * Suma estados al mapa. Un dato con `version` menor al que ya se tiene llego
 * tarde (por ejemplo, la foto inicial despues de un aviso en vivo) y se ignora.
 * Devuelve el mismo mapa si nada cambio, asi React no re-renderiza.
 */
export function mergePresence(
  current: PresenceMap,
  entries: readonly PresenceEntry[],
): PresenceMap {
  let next: Record<string, { status: ActivityStatus; version: number }> | null =
    null;
  for (const entry of entries) {
    const known = (next ?? current)[entry.user_id];
    if (known && known.version > entry.version) continue;
    if (
      known &&
      known.version === entry.version &&
      known.status === entry.status
    )
      continue;
    next ??= { ...current };
    next[entry.user_id] = { status: entry.status, version: entry.version };
  }
  return next ?? current;
}

/** Quien no esta en el mapa, para el front, esta desconectado. */
export function presenceOf(map: PresenceMap, userId: string): ActivityStatus {
  return map[userId]?.status ?? "offline";
}

/** Parte los ids en tandas que entren en un pedido de `GET /v1/presence`. */
export function presenceIdBatches(
  userIds: readonly string[],
  size: number = PRESENCE_MAX_IDS_PER_REQUEST,
): string[][] {
  const unique = [...new Set(userIds)];
  const batches: string[][] = [];
  for (let i = 0; i < unique.length; i += size) {
    batches.push(unique.slice(i, i + size));
  }
  return batches;
}

export interface PresenceState {
  presences: PresenceMap;
  ownUserId: string | null;
  /** Lo que elegiste. `null` hasta que se une la sala personal. */
  ownChoice: ActivityStatusChoice | null;
  /** La sala personal esta unida: si no, para el back no estas conectado. */
  isOwnConnected: boolean;
  idleAfterMs: number;
  /** Cuantas veces se unio la sala personal: cada union es una conexion nueva en el back. */
  userRoomJoins: number;
}

/**
 * El estado que se muestra de alguien. El propio sale de lo que elegiste y no
 * del back, que te ve `offline` si estas invisible: asi no hay parpadeos.
 */
export function displayedPresenceOf(
  state: PresenceState,
  userId: string,
): ActivityStatus {
  if (userId === state.ownUserId) {
    return state.isOwnConnected && state.ownChoice
      ? displayedStatus(state.ownChoice)
      : "offline";
  }
  return presenceOf(state.presences, userId);
}

/**
 * Estado de actividad de la sesion: el propio y el de los demas. Vive fuera de
 * React para que cada app lo lea con `useSyncExternalStore` desde cualquier
 * componente; los eventos de las salas lo alimentan.
 */
export interface PresenceStore {
  getState: () => PresenceState;
  subscribe: (listener: () => void) => () => void;
  /** La sala personal quedo unida (al entrar o tras un corte). */
  userRoomJoined: (reply: UserChannelJoinReply | undefined) => void;
  /** Se corto la sala personal: Phoenix la vuelve a unir sola. */
  userRoomLost: () => void;
  ownStatusUpdated: (payload: OwnStatusPayload) => void;
  /** Cambia tu eleccion en pantalla antes de que el back confirme. */
  setOwnChoice: (choice: ActivityStatusChoice | null) => void;
  /** Foto de `GET /v1/presence` o un `presence_updated` de la sala personal. */
  applyEntries: (entries: readonly PresenceEntry[]) => void;
  /** Foto del `join` a `presence:<server>`: solo trae a los conectados. */
  applyServerSnapshot: (
    serverId: string,
    entries: readonly PresenceEntry[],
  ) => void;
  /** `presence_updated` de la sala `presence:<server>`. */
  applyServerUpdate: (serverId: string, entry: PresenceEntry) => void;
}

export function createPresenceStore(ownUserId: string | null): PresenceStore {
  let state: PresenceState = {
    presences: NO_PRESENCE,
    ownUserId,
    ownChoice: null,
    isOwnConnected: false,
    idleAfterMs: DEFAULT_IDLE_AFTER_MS,
    userRoomJoins: 0,
  };
  const listeners = new Set<() => void>();
  const seenOnServer = new Map<string, Set<string>>();

  function set(next: PresenceState): void {
    if (next === state) return;
    state = next;
    listeners.forEach((listener) => listener());
  }

  function setPresences(presences: PresenceMap): void {
    if (presences !== state.presences) set({ ...state, presences });
  }

  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    userRoomJoined: (reply) =>
      set({
        ...state,
        ownChoice: reply?.status ?? state.ownChoice ?? "online",
        idleAfterMs: reply?.idle_after_ms ?? state.idleAfterMs,
        isOwnConnected: true,
        userRoomJoins: state.userRoomJoins + 1,
      }),
    userRoomLost: () => {
      if (state.isOwnConnected) set({ ...state, isOwnConnected: false });
    },
    ownStatusUpdated: (payload) => {
      if (payload.status !== state.ownChoice)
        set({ ...state, ownChoice: payload.status });
    },
    setOwnChoice: (choice) => {
      if (choice !== state.ownChoice) set({ ...state, ownChoice: choice });
    },
    applyEntries: (entries) =>
      setPresences(mergePresence(state.presences, entries)),
    applyServerSnapshot: (serverId, entries) => {
      const online = new Set(entries.map((entry) => entry.user_id));
      const gone: PresenceEntry[] = [];
      for (const userId of seenOnServer.get(serverId) ?? []) {
        const known = state.presences[userId];
        if (!online.has(userId) && known) {
          gone.push({
            user_id: userId,
            status: "offline",
            version: known.version,
          });
        }
      }
      seenOnServer.set(serverId, online);
      setPresences(mergePresence(state.presences, [...gone, ...entries]));
    },
    applyServerUpdate: (serverId, entry) => {
      const seen = seenOnServer.get(serverId) ?? new Set<string>();
      seen.add(entry.user_id);
      seenOnServer.set(serverId, seen);
      setPresences(mergePresence(state.presences, [entry]));
    },
  };
}

export type UserRoomPush = (
  event: string,
  payload: object,
  options: PushOptions,
) => Promise<MessageActionResult>;

export async function changeOwnStatus(
  store: PresenceStore,
  push: UserRoomPush,
  choice: ActivityStatusChoice,
): Promise<MessageActionResult> {
  const previous = store.getState().ownChoice;
  if (previous === choice) return { ok: true };
  store.setOwnChoice(choice);
  const result = await push(
    "set_status",
    { status: choice },
    { failedMessage: OWN_STATUS_FAILED, errorMessageFor: presenceErrorFor },
  );
  if (!result.ok && store.getState().ownChoice === choice) {
    store.setOwnChoice(previous);
  }
  return result;
}

export function reportActivity(
  push: UserRoomPush,
  idle: boolean,
): Promise<MessageActionResult> {
  return push(
    "activity",
    { state: idle ? "idle" : "active" },
    { failedMessage: OWN_STATUS_FAILED, errorMessageFor: presenceErrorFor },
  );
}

export interface PresenceChannelHandlers {
  snapshot: (entries: PresenceEntry[]) => void;
  updated: (entry: PresenceEntry) => void;
}

const PRESENCE_JOIN_REJECTIONS = new Set([
  "FORBIDDEN",
  "ACCOUNT_SUSPENDED",
  "SUSPENSION_UNAVAILABLE",
]);

export function joinPresenceChannel(
  room: RealtimeChannel,
  handlers: PresenceChannelHandlers,
): void {
  room.on("presence_updated", (entry: PresenceEntry) =>
    handlers.updated(entry),
  );
  // Te sacaron del servidor: el back cierra la sala, no hay nada mas que escuchar.
  room.on("access_revoked", () => room.leave());
  room
    .join()
    .receive("ok", (response) => {
      const presences = (
        response as { presences?: PresenceEntry[] } | undefined
      )?.presences;
      handlers.snapshot(presences ?? []);
    })
    .receive("error", (response) => {
      const code = (response as { error?: { code?: unknown } } | undefined)
        ?.error?.code;
      if (typeof code === "string" && PRESENCE_JOIN_REJECTIONS.has(code)) {
        room.leave();
      }
    });
}

export interface ChannelSocket {
  channel(topic: string): RealtimeChannel;
}

export function watchServerPresence<S extends ChannelSocket>(
  acquireSocket: () => Promise<AcquireSocketResult<S>>,
  store: PresenceStore,
  serverId: string,
): () => void {
  let cancelled = false;
  let release: (() => void) | null = null;
  let room: RealtimeChannel | null = null;

  void acquireSocket().then((acquired) => {
    if (cancelled) {
      if (acquired.ok) acquired.release();
      return;
    }
    // Sin socket la lista de miembros igual se ve, todos desconectados.
    if (!acquired.ok) return;
    release = acquired.release;
    room = acquired.socket.channel(`presence:${serverId}`);
    joinPresenceChannel(room, {
      snapshot: (entries) => store.applyServerSnapshot(serverId, entries),
      updated: (entry) => store.applyServerUpdate(serverId, entry),
    });
  });

  return () => {
    cancelled = true;
    room?.leave();
    release?.();
  };
}

export async function loadPresence(
  store: PresenceStore,
  userIds: readonly string[],
  request: (userIds: string[]) => Promise<ListPresenceResult>,
): Promise<void> {
  const results = await Promise.all(
    presenceIdBatches(userIds).map((batch) => request(batch)),
  );
  for (const result of results) {
    if (result.ok) store.applyEntries(result.presences);
  }
}

export interface IdleTracker {
  /** Hubo interaccion: reinicia la cuenta y, si estaba ausente, avisa que volvio. */
  activity: () => void;
  isIdle: () => boolean;
  stop: () => void;
}

export interface IdleTrackerOptions {
  idleAfterMs: number;
  onChange: (idle: boolean) => void;
  now?: () => number;
}

/**
 * Cuenta el tiempo sin interaccion. `activity()` se puede llamar en cada
 * movimiento del mouse: solo anota la hora, sin recrear timers.
 */
export function createIdleTracker({
  idleAfterMs,
  onChange,
  now = () => Date.now(),
}: IdleTrackerOptions): IdleTracker {
  let lastActivityAt = now();
  let idle = false;
  let stopped = false;
  let timer: unknown = null;

  function schedule(ms: number): void {
    timer = setTimeout(check, ms);
  }

  function check(): void {
    timer = null;
    if (stopped) return;
    const elapsed = now() - lastActivityAt;
    if (elapsed >= idleAfterMs) {
      idle = true;
      onChange(true);
    } else {
      schedule(idleAfterMs - elapsed);
    }
  }

  schedule(idleAfterMs);

  return {
    activity: () => {
      if (stopped) return;
      lastActivityAt = now();
      if (idle) {
        idle = false;
        onChange(false);
        schedule(idleAfterMs);
      }
    },
    isIdle: () => idle,
    stop: () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      timer = null;
    },
  };
}

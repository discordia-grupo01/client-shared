import {
  CHANGE_COALESCE_MS,
  CHANGE_POLL_INTERVAL_MS,
  CHANGE_RESOURCES,
  type ChangeFilter,
  type ResourceChangedPayload,
} from "../domain/resource-change";

declare function setTimeout(callback: () => void, ms: number): unknown;
declare function clearTimeout(id: unknown): void;
declare function setInterval(callback: () => void, ms: number): unknown;
declare function clearInterval(id: unknown): void;

export function isResourceChangedPayload(
  value: unknown,
): value is ResourceChangedPayload {
  if (typeof value !== "object" || value === null) return false;
  const resource = (value as { resource?: unknown }).resource;
  return (
    typeof resource === "string" &&
    (CHANGE_RESOURCES as readonly string[]).includes(resource)
  );
}

export function matchesChange(
  payload: ResourceChangedPayload,
  filter: ChangeFilter,
): boolean {
  if (!filter.resources.includes(payload.resource)) return false;
  if (
    filter.serverId &&
    payload.server_id &&
    payload.server_id !== filter.serverId
  ) {
    return false;
  }
  if (filter.userId && payload.user_id && payload.user_id !== filter.userId) {
    return false;
  }
  if (filter.kinds && payload.kind && !filter.kinds.includes(payload.kind)) {
    return false;
  }
  return true;
}

export interface ChangeBus {
  publish: (payload: ResourceChangedPayload) => void;
  subscribe: (
    filter: ChangeFilter,
    listener: (payload: ResourceChangedPayload) => void,
  ) => () => void;
  refreshAll: () => void;
}

export function createChangeBus(): ChangeBus {
  const subscribers = new Set<{
    filter: ChangeFilter;
    listener: (payload: ResourceChangedPayload) => void;
  }>();
  return {
    publish: (payload) => {
      for (const subscriber of [...subscribers]) {
        if (matchesChange(payload, subscriber.filter)) {
          subscriber.listener(payload);
        }
      }
    },
    refreshAll: () => {
      for (const subscriber of [...subscribers]) {
        const resource = subscriber.filter.resources[0];
        subscriber.listener(resource ? { resource } : { resource: "servers" });
      }
    },
    subscribe: (filter, listener) => {
      const subscriber = { filter, listener };
      subscribers.add(subscriber);
      return () => {
        subscribers.delete(subscriber);
      };
    },
  };
}

export interface RefreshCoalescer {
  trigger: () => void;
  cancel: () => void;
}

export function createRefreshCoalescer(
  run: () => void | Promise<unknown>,
  delayMs: number = CHANGE_COALESCE_MS,
): RefreshCoalescer {
  let timer: unknown = null;
  let running = false;
  let dirty = false;
  let cancelled = false;

  async function execute(): Promise<void> {
    running = true;
    await Promise.resolve()
      .then(run)
      .catch(() => undefined);
    running = false;
    if (dirty && !cancelled) {
      dirty = false;
      schedule();
    }
  }

  function schedule(): void {
    if (timer !== null) return;
    timer = setTimeout(() => {
      timer = null;
      if (cancelled) return;
      if (running) {
        dirty = true;
        return;
      }
      void execute();
    }, delayMs);
  }

  return {
    trigger: () => {
      cancelled = false;
      if (running) {
        dirty = true;
        return;
      }
      schedule();
    },
    cancel: () => {
      cancelled = true;
      dirty = false;
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    },
  };
}

export interface ChangeWatcherOptions {
  bus: ChangeBus;
  filter: ChangeFilter;
  refresh: () => void | Promise<unknown>;
  isActive: () => boolean;
  onActivate: (listener: () => void) => () => void;
  delayMs?: number;
  pollMs?: number | null;
}

export function watchChanges({
  bus,
  filter,
  refresh,
  isActive,
  onActivate,
  delayMs = CHANGE_COALESCE_MS,
  pollMs = CHANGE_POLL_INTERVAL_MS,
}: ChangeWatcherOptions): () => void {
  const coalescer = createRefreshCoalescer(refresh, delayMs);
  const unsubscribe = bus.subscribe(filter, coalescer.trigger);
  const refreshIfActive = () => {
    if (isActive()) coalescer.trigger();
  };
  const interval =
    pollMs === null ? null : setInterval(refreshIfActive, pollMs);
  const stopActivation = onActivate(refreshIfActive);
  return () => {
    unsubscribe();
    coalescer.cancel();
    if (interval !== null) clearInterval(interval);
    stopActivation();
  };
}

export interface ProfileWatcherOptions<User> {
  bus: ChangeBus;
  isTracked: (userId: string) => boolean;
  fetchProfile: (userId: string) => Promise<User | null>;
  apply: (user: User) => void;
  delayMs?: number;
}

export function watchProfileChanges<User>({
  bus,
  isTracked,
  fetchProfile,
  apply,
  delayMs = CHANGE_COALESCE_MS,
}: ProfileWatcherOptions<User>): () => void {
  const coalescers = new Map<string, RefreshCoalescer>();
  const unsubscribe = bus.subscribe(
    { resources: ["profile"] },
    ({ user_id: userId }) => {
      if (!userId || !isTracked(userId)) return;
      let coalescer = coalescers.get(userId);
      if (!coalescer) {
        coalescer = createRefreshCoalescer(async () => {
          const user = await fetchProfile(userId);
          if (user) apply(user);
        }, delayMs);
        coalescers.set(userId, coalescer);
      }
      coalescer.trigger();
    },
  );
  return () => {
    unsubscribe();
    coalescers.forEach((coalescer) => coalescer.cancel());
    coalescers.clear();
  };
}

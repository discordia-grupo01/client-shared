import type { Message } from "../domain/message";
import type { MessageActionResult } from "./channel-chat";

declare function setTimeout(callback: () => void, ms: number): unknown;
declare function clearTimeout(id: unknown): void;

/** Intentos automaticos por mensaje antes de marcarlo como fallido. */
export const SEND_MAX_ATTEMPTS = 3;
/** Espera tras el intento 1 y tras el 2. */
export const SEND_RETRY_DELAYS_MS = [1_000, 3_000] as const;
/** Cuanto vive un mensaje sin enviar, enviando o fallido. */
export const PENDING_TTL_MS = 2 * 60 * 60 * 1000;
/** Desde cuando un envio sin confirmar se considera lento y deja de verse como normal. */
export const SEND_SLOW_MS = 2_000;
/** Tiempo que se espera el eco de un mensaje que el back ya confirmo. */
const ACKED_GRACE_MS = 30_000;

export const PENDING_ID_PREFIX = "pending:";

/**
 * Mensajes propios de solo texto que todavia no estan en el chat:
 * - `sending`: se esta enviando o espera su proximo intento automatico;
 * - `queued`: no hay conexion, sale solo al volver;
 * - `failed`: se agotaron los intentos, el usuario decide (reintentar o eliminar).
 */
export type PendingStatus = "sending" | "queued" | "failed";

export interface PendingMessage {
  clientId: string;
  content: string;
  status: PendingStatus;
  attempts: number;
  error: string | null;
  createdAt: string;
  /** El back ya lo confirmo; se oculta cuando llega su eco por el socket. */
  acked: boolean;
  /** Lleva mas de `SEND_SLOW_MS` sin confirmarse. */
  slow: boolean;
}

export interface SendQueueOptions {
  /** Mensajes de una sesion anterior (ver `parsePending`). */
  initial?: readonly PendingMessage[];
  /** Un intento de envio, con el mismo `clientId` en cada reintento. */
  send: (content: string, clientId: string) => Promise<MessageActionResult>;
  /** Si el chat puede mandar ahora; si no, los mensajes esperan en cola. */
  isReady: () => boolean;
  newId: () => string;
  now?: () => number;
  /** Se llama con los mensajes que hay que recordar (sin los ya confirmados). */
  onPersist?: (entries: readonly PendingMessage[]) => void;
}

export type SendQueueHandlers = Pick<SendQueueOptions, "send" | "isReady">;

export interface SendQueue {
  /** Cambia como se envia y cuando se puede, sin perder lo que hay en cola. */
  configure: (handlers: SendQueueHandlers) => void;
  getEntries: () => readonly PendingMessage[];
  subscribe: (listener: () => void) => () => void;
  enqueue: (content: string) => void;
  /** Suma mensajes de una sesion anterior que se leyeron despues de crear la cola (storage asincrono). */
  restore: (restored: readonly PendingMessage[]) => void;
  /** Solo aplica a un mensaje `failed`. */
  retry: (clientId: string) => void;
  /** Solo aplica a un mensaje `failed` o `queued`. */
  discard: (clientId: string) => void;
  /** El chat paso a poder mandar: vacia la cola. */
  notifyReady: () => void;
  /** Saca los mensajes cuyo eco ya llego al chat. */
  prune: (presentClientIds: ReadonlySet<string>) => void;
  /** Retoma lo que haya quedado a medias. Se llama al montar el chat. */
  start: () => void;
  /** Frena los envios y los timers (al salir del chat); `start` los retoma. */
  stop: () => void;
}

export function createSendQueue(options: SendQueueOptions): SendQueue {
  const now = options.now ?? Date.now;
  const listeners = new Set<() => void>();
  const waits = new Set<() => void>();
  let entries: readonly PendingMessage[] = options.initial ?? [];
  let handlers: SendQueueHandlers = {
    send: options.send,
    isReady: options.isReady,
  };
  let running = false;
  let stopped = false;

  function commit(next: readonly PendingMessage[]) {
    entries = next;
    options.onPersist?.(next.filter((entry) => !entry.acked));
    listeners.forEach((listener) => listener());
  }

  function patch(clientId: string, change: Partial<PendingMessage>) {
    commit(
      entries.map((entry) =>
        entry.clientId === clientId ? { ...entry, ...change } : entry,
      ),
    );
  }

  function wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const done = () => {
        clearTimeout(id);
        waits.delete(done);
        resolve();
      };
      const id = setTimeout(done, ms);
      waits.add(done);
    });
  }

  function expireAckedLater(clientId: string) {
    const expire = () => {
      clearTimeout(id);
      waits.delete(expire);
      if (stopped) return;
      commit(entries.filter((entry) => entry.clientId !== clientId));
    };
    const id = setTimeout(expire, ACKED_GRACE_MS);
    waits.add(expire);
  }

  function markSlowLater(clientId: string) {
    const mark = () => {
      clearTimeout(id);
      waits.delete(mark);
      if (stopped) return;
      const entry = entries.find((item) => item.clientId === clientId);
      if (entry && !entry.acked && entry.status !== "failed" && !entry.slow) {
        patch(clientId, { slow: true });
      }
    };
    const id = setTimeout(mark, SEND_SLOW_MS);
    waits.add(mark);
  }

  function acknowledge(clientId: string) {
    patch(clientId, { acked: true });
    expireAckedLater(clientId);
  }

  function dropExpired() {
    const alive = entries.filter(
      (entry) => now() - Date.parse(entry.createdAt) < PENDING_TTL_MS,
    );
    if (alive.length !== entries.length) commit(alive);
  }

  function markQueued() {
    const waiting = (entry: PendingMessage) =>
      !entry.acked && entry.status === "sending";
    if (!entries.some(waiting)) return;
    commit(
      entries.map((entry) =>
        waiting(entry) ? { ...entry, status: "queued" as const } : entry,
      ),
    );
  }

  async function run() {
    if (running || stopped) return;
    running = true;
    try {
      for (;;) {
        dropExpired();
        const next = entries.find(
          (entry) => !entry.acked && entry.status !== "failed",
        );
        if (!next) return;
        if (!handlers.isReady()) {
          markQueued();
          return;
        }

        const attempts = next.attempts + 1;
        patch(next.clientId, { status: "sending", attempts });
        const result = await handlers.send(next.content, next.clientId);
        if (stopped) return;
        if (!entries.some((entry) => entry.clientId === next.clientId)) {
          continue;
        }

        if (result.ok) {
          acknowledge(next.clientId);
        } else if (
          result.retryable === false ||
          attempts >= SEND_MAX_ATTEMPTS
        ) {
          patch(next.clientId, { status: "failed", error: result.message });
        } else {
          const delay =
            SEND_RETRY_DELAYS_MS[attempts - 1] ??
            SEND_RETRY_DELAYS_MS[SEND_RETRY_DELAYS_MS.length - 1];
          await wait(delay);
          if (stopped) return;
        }
      }
    } finally {
      running = false;
    }
  }

  return {
    configure(next) {
      handlers = next;
    },
    getEntries: () => entries,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    enqueue(content) {
      if (stopped) return;
      const clientId = options.newId();
      commit([
        ...entries,
        {
          clientId,
          content,
          status: handlers.isReady() ? "sending" : "queued",
          attempts: 0,
          error: null,
          createdAt: new Date(now()).toISOString(),
          acked: false,
          slow: false,
        },
      ]);
      markSlowLater(clientId);
      void run();
    },
    restore(restored) {
      const known = new Set(entries.map((entry) => entry.clientId));
      const added = restored.filter((entry) => !known.has(entry.clientId));
      if (added.length === 0) return;
      commit(
        [...added, ...entries].sort((a, b) =>
          a.createdAt.localeCompare(b.createdAt),
        ),
      );
    },
    retry(clientId) {
      const entry = entries.find((item) => item.clientId === clientId);
      if (stopped || entry?.status !== "failed") return;
      patch(clientId, {
        status: handlers.isReady() ? "sending" : "queued",
        attempts: 0,
        error: null,
        slow: false,
      });
      markSlowLater(clientId);
      void run();
    },
    discard(clientId) {
      const entry = entries.find((item) => item.clientId === clientId);
      if (!entry || entry.status === "sending") return;
      commit(entries.filter((item) => item.clientId !== clientId));
    },
    notifyReady() {
      void run();
    },
    prune(presentClientIds) {
      const rest = entries.filter(
        (entry) => !presentClientIds.has(entry.clientId),
      );
      if (rest.length !== entries.length) commit(rest);
    },
    start() {
      if (!stopped) return;
      stopped = false;
      entries
        .filter((entry) => entry.acked)
        .forEach((entry) => expireAckedLater(entry.clientId));
      entries
        .filter(
          (entry) => !entry.acked && entry.status !== "failed" && !entry.slow,
        )
        .forEach((entry) => markSlowLater(entry.clientId));
      void run();
    },
    stop() {
      stopped = true;
      [...waits].forEach((done) => done());
    },
  };
}

/** Un envio normal no se distingue de un mensaje ya enviado; solo el que se demora o fallo. */
function deliveryOf(entry: PendingMessage): NonNullable<Message["delivery"]> {
  if (entry.status === "failed") return "failed";
  return entry.status === "queued" || entry.attempts > 1 || entry.slow
    ? "waiting"
    : "sending";
}

/**
 * Los mensajes del chat con los propios pendientes en el lugar donde se
 * escribieron (por hora): uno recien enviado queda al final, uno fallido de
 * ayer queda entre los de ayer. Cuando un reintento sale, el mensaje real
 * tiene la hora del envio y aparece al final.
 * Un pendiente cuyo `client_id` ya esta entre los mensajes se oculta: es el
 * mismo mensaje, que ya llego.
 */
export function withPendingMessages(
  messages: readonly Message[],
  pending: readonly PendingMessage[],
  userId: string,
  channelId: string,
): Message[] {
  if (pending.length === 0) return [...messages];

  const present = new Set(
    messages.flatMap((message) =>
      message.client_id ? [message.client_id] : [],
    ),
  );
  const shown = pending
    .filter((entry) => !present.has(entry.clientId))
    .map((entry): Message => ({
      id: PENDING_ID_PREFIX + entry.clientId,
      channel_id: channelId,
      server_id: "",
      user_id: userId,
      content: entry.content,
      inserted_at: entry.createdAt,
      client_id: entry.clientId,
      delivery: deliveryOf(entry),
      ...(entry.error ? { delivery_error: entry.error } : {}),
    }));

  const result = [...messages];
  for (const entry of shown) {
    const time = Date.parse(entry.inserted_at);
    let index = result.length;
    while (index > 0 && Date.parse(result[index - 1].inserted_at) > time) {
      index -= 1;
    }
    result.splice(index, 0, entry);
  }
  return result;
}

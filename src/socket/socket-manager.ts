// El paquete no tiene tipos de timers (lib ES2020 sin "dom" ni @types/node);
// en runtime son los globales de cada plataforma.
declare function setTimeout(callback: () => void, ms: number): unknown;
declare function clearTimeout(id: unknown): void;

export interface RealtimeSocket {
  onOpen(callback: () => void): unknown;
  onClose(callback: () => void): unknown;
  connect(): void;
  disconnect(callback?: () => void): void;
  isConnected(): boolean;
}

export type SocketTicketResult =
  { ok: true; ticket: string } | { ok: false; sessionExpired: boolean };

export type AcquireSocketResult<S> =
  ({ ok: true } & SocketLease<S>) | { ok: false; sessionExpired: boolean };

export interface SocketLease<S> {
  socket: S;
  /** Suelta el socket. Idempotente. */
  release: () => void;
}

export interface SocketLifecycleControls<S> {
  socket: S;
  /** Mientras esta activo, un cierre del socket no dispara la reconexion. */
  suspendReconnect: (suspended: boolean) => void;
  /** Si el socket no esta abierto, reconecta ya con un ticket nuevo. */
  reconnectIfDisconnected: () => void;
}

export interface SocketManagerOptions<S extends RealtimeSocket> {
  /**
   * Arma el `Socket` de la plataforma (URL y clase de Phoenix). `params` hay
   * que pasarlo tal cual: Phoenix lo lee en cada `connect()` y entrega el
   * ticket de esa conexion.
   */
  createSocket: (params: () => { ticket: string }) => S;
  fetchTicket: () => Promise<SocketTicketResult>;
  /** Engancha los eventos de la plataforma; devuelve como desengancharlos. */
  watchLifecycle?: (controls: SocketLifecycleControls<S>) => () => void;
}

export interface SocketManager<S> {
  acquireSocket: () => Promise<AcquireSocketResult<S>>;
  /** Cierra el socket y limpia los timers. Un `acquireSocket` posterior abre uno nuevo. */
  closeSocket: () => void;
  /** Avisa cuando la sesion murio y el socket se cerro (no hay forma de seguir). */
  onSocketSessionExpired: (listener: () => void) => () => void;
}

export const SOCKET_IDLE_CLOSE_MS = 5 * 1000;
/** Espera entre intentos de conseguir un ticket (backoff hasta el maximo). */
export const SOCKET_RETRY_MIN_MS = 1 * 1000;
export const SOCKET_RETRY_MAX_MS = 30 * 1000;

interface SocketState<S> {
  socket: S;
  /** Ticket listo para el proximo `connect()`; Phoenix lo consume al leer los params. */
  ticket: string | null;
  leases: number;
  idleTimer: unknown;
  retryTimer: unknown;
  /** Hay una reconexion en curso: ignora cierres hasta que termine. */
  reconnecting: boolean;
  /** Cierres seguidos sin llegar a abrir: si el servidor rechaza siempre, no martillar. */
  failures: number;
  /** La plataforma pidio no reconectar (ej. la pagina se esta yendo). */
  reconnectSuspended: boolean;
  stopLifecycle: () => void;
}

/**
 * Manager del WebSocket de mensajes: UN solo `Socket` para toda la app.
 * Cambiar de canal es hacer `leave` + `join` sobre el mismo socket.
 *
 * Vive fuera de React a proposito: es una conexion de larga duracion que tiene
 * que sobrevivir a los re-renders. Los hooks piden el socket con
 * `acquireSocket()` y lo sueltan con `release()`; cuando no queda nadie lo
 * usando, se cierra a los pocos segundos (no al instante, porque al cambiar de
 * canal el chat se desmonta y se vuelve a montar enseguida).
 *
 * Autenticacion: el handshake de un WebSocket no admite headers y el JWT en la
 * URL queda en los logs, asi que messaging usa tickets (`POST
 * /v1/socket-tickets`): de un solo uso y con 30 s de vida. Por eso CADA
 * conexion, incluidas las reconexiones, necesita un ticket nuevo, y Phoenix no
 * sirve para reconectar solo (reintentaria con el ticket ya gastado). La
 * reconexion la maneja este modulo: cuando el socket se cierra, pide un ticket
 * y vuelve a abrir. Los canales se vuelven a unir solos (con `last_message_id`)
 * al abrirse.
 *
 * El JWT que messaging guarda con el ticket solo lo usa para consultar
 * permisos a `servers`, que no valida su expiracion (solo lee el `sub`), asi que
 * un socket abierto mucho tiempo sigue funcionando sin renovar nada.
 *
 * Phoenix, la URL, el pedido del ticket y los eventos del ciclo de vida
 * (`pagehide` en web, `AppState` en mobile) los pone cada app.
 */
export function createSocketManager<S extends RealtimeSocket>(
  options: SocketManagerOptions<S>,
): SocketManager<S> {
  let state: SocketState<S> | null = null;
  let opening: Promise<true | { sessionExpired: boolean }> | null = null;
  const sessionExpiredListeners = new Set<() => void>();

  function onSocketSessionExpired(listener: () => void): () => void {
    sessionExpiredListeners.add(listener);
    return () => sessionExpiredListeners.delete(listener);
  }

  async function acquireSocket(): Promise<AcquireSocketResult<S>> {
    if (!state) {
      opening ??= openSocket().finally(() => {
        opening = null;
      });
      const result = await opening;
      if (result !== true || !state) {
        return {
          ok: false,
          sessionExpired:
            typeof result === "object" ? result.sessionExpired : false,
        };
      }
    }
    return { ok: true, ...lease(state) };
  }

  function lease(current: SocketState<S>): SocketLease<S> {
    if (current.idleTimer) {
      clearTimeout(current.idleTimer);
      current.idleTimer = null;
    }
    current.leases += 1;

    let released = false;
    return {
      socket: current.socket,
      release: () => {
        if (released) return;
        released = true;
        current.leases -= 1;
        if (current.leases === 0 && state === current) {
          current.idleTimer = setTimeout(closeSocket, SOCKET_IDLE_CLOSE_MS);
        }
      },
    };
  }

  async function openSocket(): Promise<true | { sessionExpired: boolean }> {
    const first = await options.fetchTicket();
    if (!first.ok) return { sessionExpired: first.sessionExpired };

    // El ticket es de un solo uso: se entrega y se descarta, y la proxima
    // conexion pide otro.
    const socket = options.createSocket(() => {
      const ticket = current.ticket ?? "";
      current.ticket = null;
      return { ticket };
    });
    const current: SocketState<S> = {
      socket,
      ticket: first.ticket,
      leases: 0,
      idleTimer: null,
      retryTimer: null,
      reconnecting: false,
      failures: 0,
      reconnectSuspended: false,
      stopLifecycle: () => {},
    };
    state = current;

    current.stopLifecycle =
      options.watchLifecycle?.({
        socket,
        suspendReconnect: (suspended) => {
          current.reconnectSuspended = suspended;
        },
        reconnectIfDisconnected: () => {
          if (!socket.isConnected()) handleClose(current);
        },
      }) ?? (() => {});

    socket.onOpen(() => {
      current.failures = 0;
    });
    socket.onClose(() => handleClose(current));
    socket.connect();
    return true;
  }

  /**
   * El socket se cerro (se corto la red, el handshake fue rechazado, el servidor
   * se reinicio): se vuelve a abrir con un ticket nuevo. `disconnect` cancela la
   * reconexion automatica de Phoenix, que usaria el ticket ya gastado.
   */
  function handleClose(current: SocketState<S>): void {
    if (state !== current || current.reconnecting || current.reconnectSuspended)
      return;
    current.reconnecting = true;
    current.failures += 1;
    current.socket.disconnect(() => {
      void reconnect(current);
    });
  }

  async function reconnect(current: SocketState<S>): Promise<void> {
    let delayMs = SOCKET_RETRY_MIN_MS;
    // El primer cierre se reintenta enseguida; si el siguiente tambien cierra sin
    // abrir, se espera cada vez mas (1 s, 2 s... hasta 30 s).
    if (current.failures > 1) {
      const backoffMs = Math.min(
        SOCKET_RETRY_MIN_MS * 2 ** (current.failures - 2),
        SOCKET_RETRY_MAX_MS,
      );
      await new Promise<void>((resolve) => {
        current.retryTimer = setTimeout(resolve, backoffMs);
      });
    }
    while (state === current) {
      const result = await options.fetchTicket();
      if (state !== current) return;

      if (result.ok) {
        current.ticket = result.ticket;
        current.reconnecting = false;
        current.socket.connect();
        return;
      }
      if (result.sessionExpired) {
        closeSocket();
        sessionExpiredListeners.forEach((listener) => listener());
        return;
      }

      // Fallo transitorio (sin red, servicio caido): se reintenta con backoff.
      await new Promise<void>((resolve) => {
        current.retryTimer = setTimeout(resolve, delayMs);
      });
      delayMs = Math.min(delayMs * 2, SOCKET_RETRY_MAX_MS);
    }
  }

  function closeSocket(): void {
    const current = state;
    if (!current) return;
    state = null;
    if (current.idleTimer) clearTimeout(current.idleTimer);
    if (current.retryTimer) clearTimeout(current.retryTimer);
    current.stopLifecycle();
    current.socket.disconnect();
  }

  return { acquireSocket, closeSocket, onSocketSessionExpired };
}

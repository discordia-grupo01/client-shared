import type { Message } from "./message";

/**
 * Busqueda de mensajes en un servidor
 * (`GET /v1/servers/:id/messages/search`). Busca solo en los canales de texto
 * donde el usuario tiene `VIEW_CHANNELS`.
 */

/** Lo que arma la persona en el buscador. */
export interface MessageSearchQuery {
  /** Texto que tiene que contener el mensaje; vacio = no filtra por texto. */
  text: string;
  /** Solo mensajes de este autor; `null` = de cualquiera. */
  authorId: string | null;
}

/** Respuesta del back: de mas nuevo a mas viejo, sin mensajes eliminados. */
export interface MessageSearchResponse {
  /** Mismo formato que el historial, pero sin `reactions`. */
  messages: Message[];
  /** Id para pasar como `before` y traer la pagina siguiente; `null` si no hay mas. */
  next_cursor: string | null;
  /** Coincidencias totales (tope 1000). Solo en la primera pagina; despues `null`. */
  total: number | null;
  /** `true` si hay mas de 1000 coincidencias (se muestra "1000+"). */
  total_capped: boolean | null;
}

/** Lo que devuelven los servicios de cada app al buscar. */
export type SearchMessagesResult =
  | {
      ok: true;
      messages: Message[];
      nextCursor: string | null;
      total: number | null;
      totalCapped: boolean;
    }
  | { ok: false; message: string; code?: string };

/**
 * Pedido de mostrar un resultado en su canal. `nonce` cambia en cada click,
 * asi tocar dos veces el mismo resultado vuelve a saltar.
 */
export interface MessageJumpTarget {
  channelId: string;
  messageId: string;
  nonce: number;
}

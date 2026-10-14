import type { Message } from "../domain/message";

/**
 * Mensajes propios de solo texto que no se pudieron enviar. El back no guarda
 * nada de un envio fallido (el error es solo la respuesta que recibe quien
 * envia), asi que el fallido vive unicamente en pantalla: se muestra marcado
 * en el lugar donde se envio y desaparece al salir del chat. Un envio que sale
 * bien no deja nada aca: el mensaje real llega por el socket como siempre.
 */
export interface FailedMessage {
  tempId: string;
  content: string;
  error: string;
  /** El ultimo mensaje del chat al enviar; `null` si estaba vacio. El fallido se muestra justo despues. */
  afterMessageId: string | null;
  createdAt: string;
}

export const FAILED_ID_PREFIX = "failed:";

export function addFailed(
  list: readonly FailedMessage[],
  entry: Omit<FailedMessage, "createdAt">,
  now: Date = new Date(),
): FailedMessage[] {
  return [...list, { ...entry, createdAt: now.toISOString() }];
}

/**
 * Los mensajes del chat con cada fallido justo despues del mensaje que habia
 * al enviarlo (al principio si el chat estaba vacio; al final si ese mensaje
 * ya no esta). Lo que llego despues queda debajo.
 */
export function withFailedMessages(
  messages: readonly Message[],
  failed: readonly FailedMessage[],
  userId: string,
  channelId: string,
): Message[] {
  if (failed.length === 0) return [...messages];

  const toMessage = (f: FailedMessage): Message => ({
    id: FAILED_ID_PREFIX + f.tempId,
    channel_id: channelId,
    server_id: "",
    user_id: userId,
    content: f.content,
    inserted_at: f.createdAt,
    delivery: "failed",
    delivery_error: f.error,
  });

  const known = new Set(messages.map((m) => m.id));
  const after = (id: string | null) =>
    failed.filter((f) => f.afterMessageId === id).map(toMessage);
  const lost = failed
    .filter((f) => f.afterMessageId !== null && !known.has(f.afterMessageId))
    .map(toMessage);

  return [
    ...after(null),
    ...messages.flatMap((message) => [message, ...after(message.id)]),
    ...lost,
  ];
}

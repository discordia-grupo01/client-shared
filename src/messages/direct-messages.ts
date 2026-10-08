import { messageErrorFor } from "./chat";

export const DM_CONVERSATIONS_LOAD_FAILED =
  "No pudimos cargar tus conversaciones. Intentá de nuevo.";
export const DM_MARK_READ_FAILED =
  "No pudimos marcar la conversación como leída.";
export const DM_SEND_FAILED = "No pudimos enviar el mensaje. Intentá de nuevo.";

/** Errores de `send_dm` que no son de un canal. */
const DM_ERROR_MESSAGES: Readonly<Record<string, string>> = {
  CANNOT_MESSAGE_SELF: "No podés enviarte mensajes directos a vos mismo.",
  RECIPIENT_NOT_FOUND: "El destinatario no existe.",
  USERS_UNAVAILABLE:
    "No se pudo verificar al destinatario, intentá de nuevo en un momento.",
  // El back no dice por que (no revela que el otro te bloqueo): no se agrega "te bloqueó".
  DM_NOT_DELIVERED: "No se pudo entregar el mensaje.",
  USER_BLOCKED: "Bloqueaste a este usuario: desbloquealo para escribirle.",
};

/** Texto de un `error.code` de `send_dm`; si no se conoce, cae a `fallback`. */
export function dmErrorFor(code: unknown, fallback: string): string {
  return typeof code === "string" &&
    Object.prototype.hasOwnProperty.call(DM_ERROR_MESSAGES, code)
    ? DM_ERROR_MESSAGES[code]
    : messageErrorFor(code, fallback);
}

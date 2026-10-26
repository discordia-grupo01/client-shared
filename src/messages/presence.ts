import { ACCOUNT_SUSPENDED_MESSAGE } from "./account-suspension";

export const OWN_STATUS_FAILED =
  "No pudimos cambiar tu estado. Intentá de nuevo.";

export const PRESENCE_LOAD_FAILED = "No pudimos cargar el estado de actividad.";

const PRESENCE_ERROR_MESSAGES: Readonly<Record<string, string>> = {
  INVALID_STATUS:
    "El estado tiene que ser en línea, ausente, no molestar o invisible.",
  PRESENCE_UNAVAILABLE:
    "No se pudo actualizar tu estado de actividad, intentá de nuevo en un momento.",
  ACCOUNT_SUSPENDED: ACCOUNT_SUSPENDED_MESSAGE,
};

/** Texto de un `error.code` de `set_status`, `activity` o `GET /v1/presence`. */
export function presenceErrorFor(code: unknown, fallback: string): string {
  return typeof code === "string" &&
    Object.prototype.hasOwnProperty.call(PRESENCE_ERROR_MESSAGES, code)
    ? PRESENCE_ERROR_MESSAGES[code]
    : fallback;
}

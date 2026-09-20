/**
 * Son DOS tipos y los dos estan bien: `servers` tipa `code` como int (el HTTP
 * status repetido) e `identify-service` como string (un codigo simbolico tipo
 * `EMAIL_ALREADY_EXISTS`). Unificarlos romperia uno de los dos.
 */

export interface ServersApiErrorResponse {
  error: {
    code: number;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface IdentityApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type ApiErrorDetails = Record<string, unknown>;

/**
 * Saca `error.details` de un body crudo. `app-mobile` lo necesita porque su
 * `ApiError` guarda el body entero; `web-client` ya tiene `details` suelto en
 * su `ApiFailure` y llama directo a `reasonOf` / `fieldOf`.
 */
export function detailsOf(body: unknown): ApiErrorDetails | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const error = (body as { error?: unknown }).error;
  if (typeof error !== "object" || error === null) return undefined;
  const details = (error as { details?: unknown }).details;
  if (typeof details !== "object" || details === null) return undefined;
  return details as ApiErrorDetails;
}

/** Por que fallo: `name_taken`, `max_uses_invalid`, etc. Ver `reasons.ts`. */
export function reasonOf(
  details: ApiErrorDetails | undefined,
): string | undefined {
  return typeof details?.reason === "string" ? details.reason : undefined;
}

/** Que campo del formulario marcar. */
export function fieldOf(
  details: ApiErrorDetails | undefined,
): string | undefined {
  return typeof details?.field === "string" ? details.field : undefined;
}

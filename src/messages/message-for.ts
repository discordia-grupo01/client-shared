import type { ApiFailure } from "../domain/api-result";
import { isNetworkFailure } from "../domain/api-result";
import { reasonOf } from "../domain/errors";

import { NETWORK_ERROR_MESSAGE, UNEXPECTED_ERROR_MESSAGE } from "./errors";

/** `details.reason` del backend -> texto para el usuario. */
export type ReasonCatalog = Readonly<Record<string, string>>;

/**
 * Traduce un error del backend a un mensaje. Reemplaza el bloque que hoy esta
 * repetido en las dos apps: leer el `reason`, buscarlo en un catalogo y caer a
 * un texto generico.
 *
 * NO interpreta el 401 a proposito. En casi todos los endpoints significa
 * "sesion vencida", pero en `POST /v1/login` significa "contraseña incorrecta".
 * Meterlo aca haria que el login mostrara "Tu sesión expiró" al equivocarse la
 * contraseña. Los dos repos ya lo chequean explicitamente y asi queda.
 */
export function messageFor(
  failure: ApiFailure,
  catalog: ReasonCatalog = {},
  fallback: string = UNEXPECTED_ERROR_MESSAGE,
): string {
  if (isNetworkFailure(failure)) {
    // El cliente HTTP ya distingue "sin red" de "timeout" en el message.
    return failure.message || NETWORK_ERROR_MESSAGE;
  }

  const reason = reasonOf(failure.details);
  if (reason && catalog[reason]) return catalog[reason];

  return fallback;
}

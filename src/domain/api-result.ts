import {
  NETWORK_ERROR_MESSAGE,
  UNEXPECTED_ERROR_MESSAGE,
} from "../messages/errors";

import { detailsOf, type ApiErrorDetails } from "./errors";

export interface ApiSuccess<T> {
  ok: true;
  status: number;
  data: T;
}

export interface ApiFailure {
  ok: false;
  /** `0` cuando no hubo respuesta: sin red, DNS caido o timeout. */
  status: number;
  /**
   * TODO: revisar con backend. Los dos servicios mandan cosas distintas:
   * `servers` manda un numero (el status HTTP repetido) e `identify-service`
   * un string simbolico (`EMAIL_ALREADY_EXISTS`). Hasta que se unifique, el
   * tipo tiene que admitir los dos o miente sobre uno de los dos.
   */
  code: string | number;
  message: string;
  details?: ApiErrorDetails;
}

/**
 * Lo que devuelve el cliente HTTP de cada app. Un error del backend no es una
 * excepcion: un 409 "ese nombre ya existe" es un resultado esperado. La union
 * discriminada ademas impide leer `data` sin haber chequeado `ok`.
 */
export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

/** `status` en 0 es la marca de "no hubo respuesta". */
export function isNetworkFailure(failure: ApiFailure): boolean {
  return failure.status === 0;
}

/**
 * Cuando la request ni siquiera llego: sin red, DNS caido, timeout. El
 * llamador pasa el mensaje si sabe distinguir el caso (web puede separar el
 * timeout mirando el error de axios).
 */
export function networkFailure(
  message: string = NETWORK_ERROR_MESSAGE,
): ApiFailure {
  return { ok: false, status: 0, code: "NETWORK_ERROR", message };
}

/**
 * Forma del body de error de los dos backends.
 *
 * Exportada porque las dos apps la necesitan fuera de `toApiResult`: en los
 * caminos que no pasan por el cliente HTTP normal, como la subida de imagenes
 * con `FileSystem.uploadAsync` en mobile. Estaba definida tres veces
 * (`app-mobile/features/auth/types.ts`, `web-client/types/profile.types.ts` y
 * `web-client/types/server.types.ts`).
 *
 * Todo opcional a proposito: un 502 de un proxy o una pagina de error de nginx
 * tambien caen por aca y no tienen nada de esto.
 */
export interface ApiErrorBody {
  error?: {
    code?: string | number;
    message?: string;
    details?: ApiErrorDetails;
  };
}

/**
 * Traduce una respuesta HTTP a `ApiResult`. Es la decision de "esto salio bien
 * o mal" y es identica en las dos apps: lo unico que cambia entre web y mobile
 * es como se mandan los bytes, no como se interpreta lo que vuelve.
 *
 * `body` puede ser cualquier cosa: `null` en un 204, un string de HTML si
 * contesto un proxy, o el JSON del backend.
 */
export function toApiResult<T>(status: number, body: unknown): ApiResult<T> {
  if (status >= 200 && status < 300) {
    return { ok: true, status, data: body as T };
  }

  const errorBody = body as ApiErrorBody | null | undefined;
  return {
    ok: false,
    status,
    code: errorBody?.error?.code ?? "UNKNOWN_ERROR",
    message: errorBody?.error?.message ?? UNEXPECTED_ERROR_MESSAGE,
    details: detailsOf(body),
  };
}

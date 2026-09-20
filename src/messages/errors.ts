/**
 * Mensajes de error genericos: los que no dependen de la operacion que se
 * estaba haciendo. Los especificos de cada accion van en `actions.ts` y los
 * que vienen de un `details.reason` del backend en `reasons.ts`.
 *
 * Todos en voseo.
 */

/** No hubo respuesta: el dispositivo esta sin red o el server no esta. */
export const NETWORK_ERROR_MESSAGE =
  "No hay conexión con el servidor. Revisá tu conexión a internet e intentá de nuevo.";

/** Hubo conexion pero el server no contesto a tiempo. Web usa 10s en axios. */
export const TIMEOUT_ERROR_MESSAGE =
  "El servidor tardó demasiado en responder. Intentá de nuevo.";

/** El refresh token vencio o fue revocado: hay que volver a loguearse. */
export const SESSION_EXPIRED_MESSAGE =
  "Tu sesión expiró. Volvé a iniciar sesión.";

/** Fallback cuando el backend responde un error que no sabemos interpretar. */
export const UNEXPECTED_ERROR_MESSAGE = "Algo salió mal. Intentá de nuevo.";

/** Fallback de la capa de servicios cuando la request salio pero fallo. */
export const REQUEST_FAILED_MESSAGE =
  "No pudimos procesar la solicitud. Intentá de nuevo.";

/** El backend rechazo el body (400/422) sin decir que campo. */
export const INVALID_DATA_MESSAGE = "Revisá los datos ingresados.";

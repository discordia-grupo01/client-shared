/**
 * Límites y valores de billing que el front necesita conocer. Replicados de
 * `billing/internal/service/` porque el back no los expone por API.
 */

/**
 * Precio de Premium en centavos de ARS (`premiumPricePesos` en
 * `premium_service.go`). Solo para mostrar: lo que se cobra lo decide el back.
 */
export const PREMIUM_PRICE_CENTS = 499_900;

/** Cada cuánto consulta la pantalla de vuelta de Mercado Pago. */
export const PAYMENT_RETURN_POLL_MS = 2_000;

/** Después de esto la pantalla de vuelta deja de consultar y muestra "pendiente". */
export const PAYMENT_RETURN_TIMEOUT_MS = 60_000;

/** Una compra de puntos sin pagar vence a las 24 h (`pendingAbandonAfter`). */
export const POINTS_PURCHASE_EXPIRY_HOURS = 24;

/** Un checkout de Premium sin autorizar se cancela a los 7 días (`subscriptionAbandonAfter`). */
export const PREMIUM_CHECKOUT_EXPIRY_DAYS = 7;

/** Tope de `?limit` en `GET /v1/billing/points`. */
export const BILLING_HISTORY_MAX_LIMIT = 100;

/** Ruta del web a la que Mercado Pago devuelve al usuario (`CHECKOUT_RETURN_URL` + esto). */
export const PAYMENT_RETURN_PATH = "/billing/return";

/** Deep link con el que la app recibe la vuelta del pago. */
export const APP_PAYMENT_RETURN_URL = "discordia://billing/return";

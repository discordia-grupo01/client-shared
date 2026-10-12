/**
 * Cada cuanto se pide `GET /api/voice/participants` mientras se ve la lista de
 * canales de un servidor (#20 CA2). Signaling no tiene todavia un socket que
 * el navegador pueda usar, asi que la lista se mantiene al dia con polling.
 */
export const VOICE_PARTICIPANTS_POLL_MS = 5_000;

/**
 * Minimo entre dos eventos `participants` del puente de mobile. LiveKit avisa
 * de "quien habla" varias veces por segundo; mandar cada cambio por
 * `postMessage` satura el puente sin que se note en pantalla.
 */
export const VOICE_BRIDGE_PARTICIPANTS_THROTTLE_MS = 200;

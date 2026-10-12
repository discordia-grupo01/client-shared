/**
 * Cada cuanto se pide `GET /api/voice/participants` mientras se ve la lista de
 * canales de un servidor (#20 CA2). Signaling no tiene todavia un socket que
 * el navegador pueda usar, asi que la lista se mantiene al dia con polling.
 */
export const VOICE_PARTICIPANTS_POLL_MS = 5_000;

export const VOICE_BRIDGE_PARTICIPANTS_THROTTLE_MS = 200;

export const VOICE_EMBED_PATH = "/voice-embed";

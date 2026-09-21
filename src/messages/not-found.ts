/**
 * Mensajes de 404 y de 403 por dejar de ser miembro.
 *
 * Todos siguen la misma forma ("X ya no existe") porque el 404 casi nunca es
 * un error de tipeo: el recurso estaba y alguien lo borro mientras la pantalla
 * seguia abierta. `web-client` mezclaba las dos formas, "No encontramos ese
 * rol" junto a "Esta transferencia ya no existe", para el mismo caso.
 */

export const SERVER_NOT_FOUND = "Este servidor ya no existe.";
export const CHANNEL_NOT_FOUND = "Este canal ya no existe.";
export const ROLE_NOT_FOUND = "Este rol ya no existe.";
export const INVITE_NOT_FOUND = "Este enlace ya no existe.";
export const TRANSFER_NOT_FOUND = "Esta transferencia ya no existe.";

/**
 * El backend devuelve un solo 404 para las dos causas, asi que el mensaje no
 * puede decidir cual fue.
 */
export const MEMBER_OR_ROLE_NOT_FOUND = "Ese miembro o ese rol ya no existen.";

/** 404 al quitar un rol que el miembro no tenia: nada que deshacer. */
export const MEMBER_ROLE_NOT_ASSIGNED = "Ese miembro no tiene ese rol.";

/**
 * Un 403 sobre un servidor que existe: te expulsaron o te fuiste desde otro
 * dispositivo. Se distingue de `SERVER_NOT_FOUND` porque el servidor sigue ahi.
 */
export const NOT_A_MEMBER = "Ya no sos miembro de este servidor.";

/**
 * Punto de entrada unico del paquete. Todo lo que consumen web-client y
 * app-mobile se re-exporta desde aca.
 *
 * REGLA: este paquete no importa react, react-dom, react-native, next, axios
 * ni expo. Solo TypeScript puro, para que corra igual en Node, en el navegador
 * y en Hermes (el motor de React Native).
 *
 * El tsconfig lo hace cumplir: `lib` es ["ES2020"] sin "dom", asi que usar
 * `window`, `document` o `localStorage` rompe el build.
 */

/** Sirve para verificar que la integracion del paquete funciona end-to-end. */
export const SHARED_VERSION = "0.1.0";

// --- Dominio ---
export * from "./domain/errors";
export * from "./domain/auth";
export * from "./domain/user";
export * from "./domain/role";
export * from "./domain/member";
export * from "./domain/category";
export * from "./domain/channel";
export * from "./domain/server";
export * from "./domain/invite";
export * from "./domain/ownership-transfer";

// --- Constantes ---
export * from "./constants/app";
export * from "./constants/limits";
export * from "./constants/roles";
export * from "./constants/activity-status";

// --- Formatters ---
export * from "./format/date";
export * from "./format/color";
export * from "./format/image";

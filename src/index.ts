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
export const SHARED_VERSION = "0.15.0";

// --- Dominio ---
export * from "./domain/errors";
export * from "./domain/api-result";
export * from "./domain/auth";
export * from "./domain/two-factor";
export * from "./domain/user";
export * from "./domain/role";
export * from "./domain/member";
export * from "./domain/category";
export * from "./domain/channel";
export * from "./domain/server";
export * from "./domain/invite";
export * from "./domain/ownership-transfer";
export * from "./domain/ban";
export * from "./domain/collect-pages";
export * from "./domain/message";
export * from "./domain/conversation";
export * from "./domain/block";

// --- Constantes ---
export * from "./constants/app";
export * from "./constants/limits";
export * from "./constants/roles";
export * from "./constants/activity-status";
export * from "./constants/server-banner-presets";
export * from "./constants/reactions";
export * from "./constants/demo-authors";

// --- Validacion ---
export * from "./validation/auth";
export * from "./validation/two-factor";
export * from "./validation/server";
export * from "./validation/channel";
export * from "./validation/role";
export * from "./validation/invite";
export * from "./validation/ban";
export * from "./validation/image";
export * from "./validation/user";
export * from "./validation/message";

// --- Mensajes ---
export * from "./messages/errors";
export * from "./messages/message-for";
export * from "./messages/reasons";
export * from "./messages/actions";
export * from "./messages/chat";
export * from "./messages/blocks";
export * from "./messages/auth";
export * from "./messages/two-factor";
export * from "./messages/permissions";
export * from "./messages/ban-failures";
export * from "./messages/not-found";
export * from "./messages/ui";

// --- Formatters ---
export * from "./format/date";
export * from "./format/color";
export * from "./format/image";
export * from "./format/invite-link";
export * from "./format/list";
export * from "./format/pagination";
export * from "./format/search";
export * from "./format/profile";
export * from "./format/user-list";
export * from "./format/ban-list";
export * from "./format/message-content";
export * from "./format/message-time";
export * from "./format/message-author";
export * from "./format/message-mentions";

// --- Chat ---
export * from "./chat/channel-chat";

// --- Socket ---
export * from "./socket/socket-manager";

// --- Theme ---
export * from "./theme/tokens";

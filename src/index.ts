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

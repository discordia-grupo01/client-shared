/**
 * Mensajes de registro, login, recuperacion de contraseña y login con Google.
 *
 * Van aparte de `actions.ts` porque no salen de un `details.reason`: los dos
 * repos los eligen mirando el status HTTP que devuelve `identify-service`.
 */
import { PASSWORD_RULE_MESSAGE } from "../validation/auth";

/** 409 en `POST /v1/users`. */
export const EMAIL_ALREADY_REGISTERED =
  "Ya existe una cuenta con ese correo electrónico.";

/**
 * 401 en `POST /v1/login`. Es el unico endpoint donde un 401 NO significa
 * sesion vencida, por eso no se usa `SESSION_EXPIRED_MESSAGE`.
 *
 * No distingue cual de los dos datos esta mal a proposito: decir "ese correo
 * no existe" le confirma a un atacante que direcciones estan registradas.
 */
export const INVALID_CREDENTIALS =
  "El correo electrónico o la contraseña son incorrectos.";

/** 403 en `POST /v1/login` y `POST /v1/pin/login`. */
export const EMAIL_NOT_VERIFIED =
  "Tu cuenta ya está registrada, pero debes confirmar tu correo electrónico antes de iniciar sesión.";

/** 400 en `POST /v1/password-recovery`. */
export const INVALID_EMAIL_MESSAGE = "Ingresá un correo electrónico válido.";

/** 429 en `POST /v1/password-recovery`. */
export const RATE_LIMITED_MESSAGE =
  "Alcanzaste el límite de solicitudes. Intentá de nuevo más tarde.";

/** El token del mail de recuperacion vencio o ya se uso. */
export const RESET_LINK_INVALID =
  "El enlace de recuperación no es válido o expiró.";

/**
 * El back rechazo la contraseña. Dice exactamente lo mismo que el error del
 * formulario: antes el BFF la explicaba con otras palabras y otro formato, asi
 * que la misma regla se leia de dos maneras en la misma pantalla.
 */
export const PASSWORD_TOO_WEAK = `${PASSWORD_RULE_MESSAGE}.`;

// --- El servicio no responde (5xx, timeout, red caida) ---
export const LOGIN_UNAVAILABLE =
  "No pudimos iniciar sesión en este momento. Intentá de nuevo más tarde.";
export const REGISTER_UNAVAILABLE =
  "No pudimos crear tu cuenta en este momento. Intentá de nuevo más tarde.";
export const PASSWORD_UPDATE_UNAVAILABLE =
  "No pudimos actualizar tu contraseña en este momento. Intentá de nuevo más tarde.";
export const RECOVERY_UNAVAILABLE =
  "No pudimos procesar la solicitud. Intentá de nuevo más tarde.";

/**
 * Los tres mensajes de Google ofrecen la alternativa de email y contraseña
 * (CA3): si el login federado no anda, el usuario no queda sin forma de entrar.
 */
const FALL_BACK_TO_PASSWORD = "Iniciá sesión con tu correo y contraseña.";

/** 503: Google no contesta. Se distingue del 401 porque no es culpa del usuario. */
export const GOOGLE_UNAVAILABLE = `Google no está disponible en este momento. ${FALL_BACK_TO_PASSWORD}`;

/** 401: el backend recibio el id_token pero Google no lo valido. */
export const GOOGLE_VERIFY_FAILED = `No pudimos verificar tu cuenta de Google. ${FALL_BACK_TO_PASSWORD}`;

/**
 * Falla del lado del cliente: el SDK de Google nunca llego a darnos un token,
 * asi que no hubo request al backend. Por eso no comparte texto con el 401.
 */
export const GOOGLE_CONNECT_FAILED = `No pudimos conectar con Google. ${FALL_BACK_TO_PASSWORD}`;

/**
 * 401 en `POST /v1/pin/login` (historia "Registro con PIN"). Igual que
 * `INVALID_CREDENTIALS`, no distingue "PIN incorrecto" de "este dispositivo
 * no tiene un PIN configurado"
 */
export const PIN_LOGIN_FAILED =
  "El PIN no es correcto, o este dispositivo no tiene un PIN activado.";

/**
 * Limites que valida el backend. La regla es replicar lo que valida el back,
 * ni mas ni menos: inventar limites mas estrictos en el front produce
 * inconsistencias entre pantallas.
 */

/** Servidor, canal, categoria y rol: los cuatro cortan en 100. */
export const MAX_NAME = 100;

/** Nombre de usuario. La columna es VARCHAR(100) y el perfil valida 100 runas. */
export const MAX_USER_NAME = 100;

export const MAX_DESCRIPTION = 500;

/** `status_text`, en runas. */
export const MAX_CUSTOM_STATUS = 64;

/** `status_emoji`, en bytes (no en caracteres). Hoy ningun front lo valida. */
export const MAX_STATUS_EMOJI_BYTES = 32;

/** Foto de perfil. */
export const MAX_AVATAR_FILE_MB = 5;

/**
 * Icono y banner de servidor.
 *
 * TODO: confirmar el valor real de produccion. `ICON_MAX_BYTES` no esta
 * seteado en infrastructure/deploy/docker-compose.yml, asi que prod cae al
 * default del codigo (5 MB), pero el compose local lo fija en 2 MB. Los dos
 * entornos tendrian que coincidir; mientras tanto usamos el de prod.
 *
 * Las dos apps validan 20 MB hoy, que esta mal en cualquiera de los dos casos.
 */
export const MAX_ICON_FILE_MB = 5;

/** Lado maximo de una imagen de perfil, en px. Hoy ningun front lo valida. */
export const MAX_IMAGE_SIDE_PX = 4096;

/** Un servidor necesita al menos 2 caracteres; un canal, 1. */
export const MIN_SERVER_NAME = 2;
export const MIN_CHANNEL_NAME = 1;

/**
 * Cuantos miembros pide el front por pagina. Es el tope que acepta
 * `GET /v1/servers/:id/members` (el default del back es 20).
 *
 * Estaba escrito a mano en cuatro lugares: tres call sites de `app-mobile` y
 * dentro de la URL de `web-client`. Si alguien cambiaba uno, las dos apps
 * mostraban listas de distinto largo y nada lo marcaba.
 */
export const MEMBER_PAGE_LIMIT = 100;

/**
 * Los dos backends aceptan formatos DISTINTOS, no es un descuido de este
 * archivo:
 *   identify-service (avatar) -> jpeg, png, gif   (profileimage/storage.go:33)
 *   servers (icono/banner)    -> png, jpeg, webp  (iconstore/iconstore.go:12)
 */
export const ALLOWED_AVATAR_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
] as const;

export const ALLOWED_SERVER_ICON_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

/**
 * PIN de acceso rápido (historia "Registro con PIN", solo app-mobile). CA1
 * pide "al menos 6 dígitos"; el tope de 8 para que siga siendo rápido de tipear
 */
export const PIN_MIN_LENGTH = 6;
export const PIN_MAX_LENGTH = 8;

/**
 * Segundo factor (TOTP). Los tres valores replican lo que hace
 * identify-service (`internal/utils/twofactor`): 6 dígitos es el estándar de
 * RFC 6238 que asumen todas las apps autenticadoras, y los códigos de
 * recuperación son 10 caracteres entregados de a 10.
 */
export const TOTP_CODE_LENGTH = 6;
export const RECOVERY_CODE_LENGTH = 10;
export const RECOVERY_CODE_COUNT = 10;

/**
 * Alfabeto de los códigos de recuperación: Crockford base32 sin I, L, O ni U,
 * que se confunden con 1, 0 y V al copiarlos a mano.
 *
 * Siempre tiene letras, y eso no es cosmético: es lo que permite que el mismo
 * campo acepte un TOTP de 6 dígitos y un código de recuperación sin
 * preguntarle al usuario cuál está ingresando.
 */
export const RECOVERY_CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

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

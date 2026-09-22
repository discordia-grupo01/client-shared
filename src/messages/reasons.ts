/**
 * `details.reason` del backend -> texto para el usuario, agrupado por entidad.
 *
 * Van por entidad y no en un catalogo unico porque la misma clave significa
 * cosas distintas segun el endpoint: `name_required` es "el servidor", "el
 * canal", "el rol" o "la categoria". Un catalogo plano seria incorrecto.
 *
 * Cada catalogo es la union de lo que manejaban `web-client` y `app-mobile`:
 * que sobre una clave que ese endpoint no devuelve no molesta.
 */
import {
  ALLOWED_SERVER_ICON_TYPES,
  MAX_ICON_FILE_MB,
} from "../constants/limits";
import { formatImageTypes } from "../format/image";

import type { ReasonCatalog } from "./message-for";
import { NOT_A_MEMBER, SERVER_NOT_FOUND } from "./not-found";

export const SERVER_REASONS: ReasonCatalog = {
  name_required: "Ingresá un nombre para el servidor.",
  name_too_short: "El nombre debe tener entre 2 y 100 caracteres.",
  name_too_long: "El nombre debe tener entre 2 y 100 caracteres.",
  name_invalid_chars: "El nombre contiene caracteres no permitidos.",
  name_taken: "Ya tenés un servidor con ese nombre.",
  // TODO: revisar el limite real. `infrastructure` usa 5 MB en produccion y
  // 2 MB en local; hasta que se unifiquen, este texto dice el de produccion.
  icon_too_large: `El archivo no puede pesar más de ${MAX_ICON_FILE_MB} MB.`,
  icon_unsupported_type: `La imagen debe ser ${formatImageTypes(ALLOWED_SERVER_ICON_TYPES)}.`,
  icon_unreadable: "No pudimos leer esa imagen. Probá con otra.",
  banner_too_large: `El archivo no puede pesar más de ${MAX_ICON_FILE_MB} MB.`,
  banner_unsupported_type: `La imagen debe ser ${formatImageTypes(ALLOWED_SERVER_ICON_TYPES)}.`,
  banner_unreadable: "No pudimos leer esa imagen. Probá con otra.",
};

export const CHANNEL_REASONS: ReasonCatalog = {
  name_required: "Ingresá un nombre para el canal.",
  name_too_long: "El nombre es demasiado largo.",
  name_invalid_chars: "El nombre tiene caracteres inválidos.",
  name_taken: "Ya existe un canal con ese nombre en esa categoría.",
  kind_invalid: "El tipo de canal debe ser texto o voz.",
  category_server_mismatch: "Esa categoría no pertenece a este servidor.",
  channel_set_mismatch:
    "La lista de canales cambió mientras reordenabas. Recargá e intentá de nuevo.",
};

export const CATEGORY_REASONS: ReasonCatalog = {
  name_required: "Ingresá un nombre para la categoría.",
  name_too_long: "El nombre es demasiado largo.",
  name_invalid_chars: "El nombre tiene caracteres inválidos.",
};

export const ROLE_REASONS: ReasonCatalog = {
  name_required: "Ingresá un nombre para el rol.",
  name_too_long: "El nombre es demasiado largo.",
  color_invalid_format: "Elegí un color válido para el rol.",
};

export const INVITE_REASONS: ReasonCatalog = {
  // Mismo texto que `validateMaxUses`, para que el chequeo del front y el del
  // back no le digan cosas distintas al usuario por el mismo motivo.
  max_uses_invalid: "El límite de usos debe ser un número entero mayor a 0.",
  invite_permission_denied:
    "Tenés que ser miembro de este servidor para invitar gente.",
  server_not_found: SERVER_NOT_FOUND,
  invitation_invalid: "Este enlace de invitación no es válido o expiró.",
  user_banned: "No podés unirte a este servidor.",
};

export const TRANSFER_REASONS: ReasonCatalog = {
  /**
   * Generico a proposito: `web-client` tiene un selector de miembros y
   * `app-mobile` te hace tipear un ID. Un texto que nombre una de las dos
   * interfaces le miente al usuario de la otra.
   */
  required: "Elegí a quién le transferís la propiedad.",
  not_a_member: "Ese usuario no es miembro de este servidor.",
  already_owner: "Esa persona ya es la propietaria del servidor.",
  transfer_already_pending:
    "Ya hay una transferencia pendiente para este servidor.",
  transfer_not_pending: "Esta transferencia ya no está pendiente.",
};

export const MEMBER_REASONS: ReasonCatalog = {
  forbidden_not_member: NOT_A_MEMBER,
};

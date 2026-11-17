import {
  ALLOWED_EMOJI_TYPES,
  EMOJI_NAME_MAX,
  EMOJI_NAME_MIN,
  MAX_EMOJI_FILE_MB,
} from "../constants/limits";
import type { ApiFailure } from "../domain/api-result";
import {
  type BoostLevel,
  BOOST_PERK_LEVEL,
  hasBoostPerk,
} from "../domain/boost";
import { type ApiErrorDetails, fieldOf, reasonOf } from "../domain/errors";
import { formatDayAndMonth } from "../format/date";
import { formatImageTypes } from "../format/image";

import {
  EMOJI_DELETE_FAILED,
  EMOJI_UPLOAD_FAILED,
  EMOJIS_LOAD_FAILED,
} from "./actions";
import { NETWORK_ERROR_MESSAGE, SESSION_EXPIRED_MESSAGE } from "./errors";
import { messageFor, type ReasonCatalog } from "./message-for";
import { NO_PERMISSION_EMOJIS } from "./permissions";

export const EMOJIS_SECTION_TITLE = "Emojis personalizados";
export const EMOJIS_SECTION_SUBTITLE = "Emojis para el chat";

export function emojisSectionTitleFor(serverName: string): string {
  return `Emojis personalizados de ${serverName}`;
}

export const EMOJIS_SECTION_DESCRIPTION =
  "Los miembros los usan en mensajes y reacciones. Los animados (GIF) los puede usar quien tiene Premium.";

export function emojiLabel(name: string): string {
  return `:${name}:`;
}

export const EMOJI_ANIMATED_BADGE = "GIF";

export const EMOJI_PREMIUM_REQUIRED_LABEL = "Para usarlo necesitás Premium";

export const CUSTOM_EMOJI_PICKER_COPY = {
  note: "Usá GIF y emojis de todos tus servidores.",
  cta: "Ver Premium",
  categoryTag: "Premium",
  animated: "animado",
  locked: "Necesitás Premium para usarlo",
} as const;

function customEmojiHead(name: string, animated: boolean): string {
  return animated
    ? `${emojiLabel(name)} · ${CUSTOM_EMOJI_PICKER_COPY.animated}`
    : emojiLabel(name);
}

export function customEmojiTooltip(
  name: string,
  { animated, locked }: { animated: boolean; locked: boolean },
): string {
  const head = customEmojiHead(name, animated);
  return locked ? `${head}\n${CUSTOM_EMOJI_PICKER_COPY.locked}` : head;
}

export const CUSTOM_EMOJI_PREMIUM_OFFER_COPY = {
  title: "Los emojis animados son de Premium",
  detail:
    "Con Premium usás los emojis animados y los de todos tus servidores, también en mensajes directos.",
  cta: "Conocé Plan Premium",
} as const;

export const CUSTOM_EMOJI_REACTION_OFFER_COPY = {
  title: "Sumarte a esta reacción es de Premium",
  detail:
    "Las reacciones con emojis animados (GIF) las puede usar quien tiene Premium. La ves igual que todos.",
  cta: CUSTOM_EMOJI_PICKER_COPY.cta,
  locked: "Sumarte es de Premium",
} as const;

export function customEmojiReactionTooltip(
  name: string,
  { animated, locked }: { animated: boolean; locked: boolean },
): string {
  const head = customEmojiHead(name, animated);
  return locked ? `${head}\n${CUSTOM_EMOJI_REACTION_OFFER_COPY.locked}` : head;
}

export function emojiCapacityTitleFor(serverName: string): string {
  return `Capacidad de ${serverName}`;
}

export function emojiSlotsTotalLabel(max: number): string {
  return `/ ${max} lugares usados`;
}

export function emojiSlotsHint(level: BoostLevel): string {
  return hasBoostPerk(level, "extra_emoji_slots")
    ? "Incluye 20 lugares por los boosts del servidor."
    : `El nivel ${BOOST_PERK_LEVEL.extra_emoji_slots} suma 20 lugares.`;
}

export const EMOJI_SLOTS_FULL_COPY = {
  title: "No quedan lugares para emojis en este servidor.",
  detail:
    "Borrá alguno para subir otro. Si el servidor baja de nivel, los emojis que ya están se quedan.",
} as const;

export const EMOJIS_READ_ONLY_NOTICE =
  "Solo quienes gestionan el servidor pueden subir o borrar emojis. Vos podés usarlos en el chat.";

export const EMOJIS_EMPTY_NOTICE =
  "Este servidor todavía no tiene emojis propios.";

export function emojiAuthorName(name: string | null): string {
  return name ?? "un exmiembro";
}

export function emojiAuthorLabel(
  name: string | null,
  createdAt: string,
): string {
  const date = formatDayAndMonth(createdAt);
  const author = `Subido por ${emojiAuthorName(name)}`;
  return date === "" ? author : `${author} · ${date}`;
}

export function emojiAuthorShortLabel(
  name: string | null,
  createdAt: string,
): string {
  const date = formatDayAndMonth(createdAt);
  const author = name ?? "Exmiembro";
  return date === "" ? author : `${author} · ${date}`;
}

export const EMOJI_UPLOAD_COPY = {
  title: "Subir emoji",
  description: `${formatImageTypes(ALLOWED_EMOJI_TYPES)} de hasta ${MAX_EMOJI_FILE_MB} MB. Los GIF quedan animados.`,
  imageLabel: "Imagen",
  pickImage: "Elegir imagen",
  changeImage: "Cambiar",
  nameLabel: "Nombre",
  nameHelp: `Entre ${EMOJI_NAME_MIN} y ${EMOJI_NAME_MAX} letras, números o guiones bajos.`,
  previewLabel: "Así se ve en el chat",
  submit: "Subir emoji",
  cancel: "Cancelar",
} as const;

export function emojiFileDetail(
  size: string,
  mimeType: string,
  animated: boolean,
): string {
  const type = formatImageTypes([mimeType]);
  return `${size} · ${type} · ${animated ? "animado" : "estático"}`;
}

export function emojiDeleteTitle(name: string): string {
  return `¿Eliminar ${emojiLabel(name)}?`;
}

export const EMOJI_DELETE_COPY = {
  detail:
    "Deja de estar disponible para mensajes y reacciones nuevos y se libera un lugar. Donde ya se usó, se sigue viendo.",
  confirm: "Eliminar emoji",
  cancel: "Cancelar",
} as const;

export const EMOJI_NAME_INVALID = `Usá entre ${EMOJI_NAME_MIN} y ${EMOJI_NAME_MAX} letras, números o guiones bajos.`;
export const EMOJI_NAME_TAKEN =
  "Ya hay un emoji con ese nombre en este servidor.";
export const EMOJI_IMAGE_REQUIRED = "Elegí una imagen.";
export const EMOJI_IMAGE_TOO_LARGE = `La imagen pesa más de ${MAX_EMOJI_FILE_MB} MB.`;
export const EMOJI_IMAGE_UNSUPPORTED = `Solo se aceptan ${formatImageTypes(ALLOWED_EMOJI_TYPES)}.`;
export const EMOJI_LIMIT_REACHED = EMOJI_SLOTS_FULL_COPY.title;
export const EMOJI_NOT_FOUND = "Ese emoji ya no existe.";

export const EMOJI_REASONS: ReasonCatalog = {
  emoji_name_invalid: EMOJI_NAME_INVALID,
  emoji_name_taken: EMOJI_NAME_TAKEN,
  emoji_image_required: EMOJI_IMAGE_REQUIRED,
  emoji_image_too_large: EMOJI_IMAGE_TOO_LARGE,
  emoji_image_unsupported: EMOJI_IMAGE_UNSUPPORTED,
  emoji_limit_reached: EMOJI_LIMIT_REACHED,
  emoji_not_found: EMOJI_NOT_FOUND,
  missing_permission: NO_PERMISSION_EMOJIS,
};

export type EmojiUploadErrorField = "name" | "image" | "form";

export interface EmojiUploadError {
  field: EmojiUploadErrorField;
  message: string;
}

function emojiErrorField(
  details: ApiErrorDetails | undefined,
): EmojiUploadErrorField {
  const field = fieldOf(details);
  if (field === "name" || field === "image") return field;

  const reason = reasonOf(details) ?? "";
  if (reason.startsWith("emoji_name_")) return "name";
  if (reason.startsWith("emoji_image_")) return "image";
  return "form";
}

function emojiUploadFallback(status: number): string {
  if (status === 0) return NETWORK_ERROR_MESSAGE;
  if (status === 401) return SESSION_EXPIRED_MESSAGE;
  if (status === 403) return NO_PERMISSION_EMOJIS;
  if (status === 404) return EMOJI_NOT_FOUND;
  return EMOJI_UPLOAD_FAILED;
}

export function emojiUploadErrorFor(
  details: ApiErrorDetails | undefined,
  status: number,
): EmojiUploadError {
  const reason = reasonOf(details);
  const message =
    (reason && EMOJI_REASONS[reason]) || emojiUploadFallback(status);
  return { field: emojiErrorField(details), message };
}

export function listEmojisFailureMessage(failure: ApiFailure): string {
  if (failure.status === 401) return SESSION_EXPIRED_MESSAGE;
  return messageFor(failure, EMOJI_REASONS, EMOJIS_LOAD_FAILED);
}

export function deleteEmojiFailureMessage(failure: ApiFailure): string {
  if (failure.status === 401) return SESSION_EXPIRED_MESSAGE;
  return messageFor(
    failure,
    EMOJI_REASONS,
    failure.status === 403 ? NO_PERMISSION_EMOJIS : EMOJI_DELETE_FAILED,
  );
}

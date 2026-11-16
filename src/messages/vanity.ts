import type { ApiFailure } from "../domain/api-result";
import { BOOST_MAX_COUNT, BOOST_PERK_LEVEL } from "../domain/boost";

import { boostLevelRequiredMessage } from "./boost";
import { SESSION_EXPIRED_MESSAGE } from "./errors";
import { messageFor, type ReasonCatalog } from "./message-for";

export const VANITY_URL_COPY = {
  title: "URL de invitación personalizada",
  help: "Entre 3 y 32 caracteres: minúsculas, números y guiones. No puede empezar ni terminar con guion.",
  savedNote:
    "Cualquiera que tenga el link puede entrar al servidor. Si el servidor baja del nivel 3, deja de funcionar pero nadie más la puede tomar.",
  save: "Guardar",
  copy: "Copiar",
  copied: "Copiado",
  change: "Cambiar",
  remove: "Quitar",
  locked: `Un link corto que no vence, para invitar a quien quieras. Se activa en el nivel ${BOOST_PERK_LEVEL.vanity_url}.`,
} as const;

export const VANITY_REMOVE_COPY = {
  title: "¿Quitar la URL personalizada?",
  cancel: "Cancelar",
  confirm: "Quitar URL",
} as const;
export function vanityRemoveImpact(link: string): string {
  return `${link} deja de funcionar y otro servidor la puede tomar.`;
}

export function vanityPausedTitle(link: string): string {
  return `${link} está en pausa`;
}

export const VANITY_PAUSED_DETAIL = `El servidor bajó al nivel ${BOOST_PERK_LEVEL.vanity_url - 1}. La URL sigue siendo tuya y vuelve a funcionar sola al llegar otra vez a ${BOOST_MAX_COUNT} boosts.`;

export const VANITY_INVITE_COPY = {
  title: "Link del servidor",
  note: "No vence y no tiene límite de usos.",
  divider: "o una invitación temporal",
  copy: "Copiar",
  copied: "Copiado",
} as const;

export const VANITY_CODE_TAKEN =
  "Ese link ya lo usa otro servidor. Probá con otro.";

export const VANITY_REASONS: ReasonCatalog = {
  vanity_code_invalid: "Usá solo minúsculas, números y guiones.",
  vanity_code_taken: VANITY_CODE_TAKEN,
  boost_level_required: boostLevelRequiredMessage(BOOST_PERK_LEVEL.vanity_url),
};

export const VANITY_SAVE_FAILED =
  "No pudimos guardar la URL personalizada. Intentá de nuevo.";

export const NO_PERMISSION_VANITY =
  "No tenés permiso para cambiar la URL personalizada.";

export function saveVanityFailureMessage(failure: ApiFailure): string {
  if (failure.status === 401) return SESSION_EXPIRED_MESSAGE;
  return messageFor(
    failure,
    VANITY_REASONS,
    failure.status === 403 ? NO_PERMISSION_VANITY : VANITY_SAVE_FAILED,
  );
}

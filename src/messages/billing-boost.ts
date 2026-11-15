import { BOOST_COST_POINTS, type BoostSectionTab } from "../constants/boost";
import type { Boost, BoostStatus } from "../domain/billing-boost";
import {
  balanceAfterBoost,
  levelChangeIfBoosted,
  lostPerksIfRemoved,
  pointsMissingForBoost,
} from "../domain/billing-boost";
import type { BoostOutcome } from "../domain/billing-boost-status";
import {
  type BoostLevel,
  boostPerksAddedAt,
  boostsRequiredFor,
} from "../domain/boost";
import { formatPoints, formatPointsDelta } from "../format/billing";
import { boostCountLabel, boostPerksSentence } from "./boost";

const COST = formatPoints(BOOST_COST_POINTS);

export const BOOST_SECTION_TAB_LABELS: Readonly<
  Record<BoostSectionTab, string>
> = {
  boost: "Boostear",
  benefits: "Beneficios",
};

export const BOOST_ACTION_COPY = {
  title: "Boostear este servidor",
  description: `Cada boost cuesta ${COST}, no vence y suma para todos los miembros.`,
  costLabel: "Costo",
  balanceLabel: "Saldo actual",
  cta: `Boostear por ${COST}`,
  moreBoosts: "¿Querés boostear más veces?",
  buyPoints: "Ir a comprar puntos",
} as const;

export function boostPointsMissingLabel(balance: number): string {
  return `Te faltan ${formatPoints(pointsMissingForBoost(balance))}.`;
}

export const BOOST_LIST_COPY = {
  title: "Tus boosts en este servidor",
  footnote: "Los boosts no vencen. Si retirás uno, no se devuelven los puntos.",
  empty: "Todavía no boosteaste este servidor.",
  remove: "Retirar",
} as const;

export function activeBoostsLabel(count: number): string {
  return count === 1 ? "1 activo" : `${count} activos`;
}

export const BOOST_STATUS_LABELS: Readonly<Record<BoostStatus, string>> = {
  pending: "Aplicando…",
  active: "Activo",
  failed: "No se aplicó",
  removed: "Retirado",
};

export function boostRefundNote(boost: Pick<Boost, "points">): string {
  return `Te devolvimos los ${formatPoints(boost.points)}.`;
}

export const BOOST_REJECTED_DEFAULT = "No pudimos aplicar el boost.";

const BOOST_REJECTION_REASONS: Readonly<Record<string, string>> = {
  not_a_member: "No sos miembro de este servidor.",
  server_suspended: "El servidor está suspendido.",
  server_not_found: "El servidor ya no existe.",
  no_response: "El servidor no respondió a tiempo.",
};

export function boostRejectionReason(statusDetail: string): string {
  return BOOST_REJECTION_REASONS[statusDetail] ?? BOOST_REJECTED_DEFAULT;
}

export function boostLevelUpNotice(boostCount: number): string | undefined {
  const change = levelChangeIfBoosted(boostCount);
  if (change.to === change.from) return undefined;
  return `Con este boost el servidor llega al nivel ${change.to}: ${boostPerksSentence(change.gained)}.`;
}

export const BOOST_CONFIRM_COPY = {
  title: "Confirmar boost",
  description:
    "Este boost es una unidad permanente y se suma inmediatamente al servidor.",
  costLabel: "Costo",
  balanceLabel: "Saldo actual",
  remainingLabel: "Saldo restante",
  cancel: "Cancelar",
  confirm: "Confirmar boost",
} as const;

export function boostRemainingBalanceLabel(balance: number): string {
  return `Te quedan ${formatPoints(balanceAfterBoost(balance))}.`;
}

export interface BoostOutcomeCopy {
  title: string;
  description: string;
}

export interface BoostOutcomeContext {
  serverName: string;
  boostCount: number;
  balance?: number;
  statusDetail?: string;
}

function appliedCopy(context: BoostOutcomeContext): BoostOutcomeCopy {
  const change = levelChangeIfBoosted(context.boostCount);
  if (change.to !== change.from) {
    return {
      title: "Boost aplicado",
      description: `${context.serverName} llegó al nivel ${change.to}. Todos los miembros ahora tienen ${boostPerksSentence(change.gained)}.`,
    };
  }
  return {
    title: "Boost aplicado",
    description: `${context.serverName} ahora tiene ${boostCountLabel(context.boostCount + 1)}.`,
  };
}

export function boostOutcomeCopy(
  outcome: BoostOutcome,
  context: BoostOutcomeContext,
): BoostOutcomeCopy {
  switch (outcome) {
    case "applying":
      return {
        title: "Aplicando boost…",
        description: `Descontamos ${COST}. En unos segundos el boost queda activo.`,
      };
    case "applied":
      return appliedCopy(context);
    case "rejected":
      return {
        title: "No pudimos aplicar el boost",
        description: `${boostRejectionReason(context.statusDetail ?? "")} Te devolvimos los puntos.`,
      };
    case "still_pending":
      return {
        title: "Tu boost quedó en proceso",
        description:
          "Lo vas a ver activo en unos minutos. Si no se puede aplicar, te devolvemos los puntos.",
      };
    case "removed":
      return {
        title: "El boost ya no está activo",
        description: "El servidor ya no existe.",
      };
    case "not_found":
      return {
        title: "No encontramos el boost",
        description: "Revisá tus boosts en Facturación.",
      };
  }
}

export const BOOST_OUTCOME_ACTIONS = {
  done: "Listo",
  understood: "Entendido",
  close: "Cerrar",
  refundRow: "Reembolso de boost",
} as const;

/** "+100" para la fila del reembolso. */
export function boostRefundDelta(boost: Pick<Boost, "points">): string {
  return formatPointsDelta(boost.points);
}

export const BOOST_REMOVE_COPY = {
  cancel: "Cancelar",
  confirm: "Retirar boost",
} as const;

export function boostRemoveTitle(serverName: string): string {
  return `¿Retirar tu boost de ${serverName}?`;
}

export function boostRemoveNoRefund(boost: Pick<Boost, "points">): string {
  return `No se devuelven los ${formatPoints(boost.points)} que gastaste.`;
}

export function boostRemoveImpact(boostCount: number): string {
  const change = lostPerksIfRemoved(boostCount);
  if (change.to !== change.from) {
    return `El servidor baja al nivel ${change.to}. Pierde para todos: ${boostPerksSentence(change.lost)}.`;
  }
  return `El servidor queda con ${boostCountLabel(Math.max(0, boostCount - 1))} y sigue en el nivel ${change.to}.`;
}

export interface BoostTierSummary {
  level: Exclude<BoostLevel, 0>;
  label: string;
  perks: string;
}

const TIERS: readonly Exclude<BoostLevel, 0>[] = [1, 2, 3];

export const BOOST_TIER_SUMMARIES: readonly BoostTierSummary[] = TIERS.map(
  (level) => ({
    level,
    label: `Nivel ${level} · ${boostCountLabel(boostsRequiredFor(level))}`,
    perks: boostPerksSentence(boostPerksAddedAt(level)),
  }),
);

export const BILLING_BOOSTS_COPY = {
  title: "Boosts de servidor",
  subtitle: "Tus boosts y cómo funcionan.",
  howTitle: "Cómo funcionan los boosts",
  howDescription: `Cada boost cuesta ${COST}, no vence y suma una unidad al servidor. Al llegar a cada umbral, el servidor sube de nivel y todos sus miembros reciben más beneficios.`,
  yourBoostsTitle: "Servidores que boosteaste",
  empty: "Todavía no boosteaste ningún servidor.",
  manage: "Gestionar",
  unknownServer: "Servidor que ya no está en tu lista",
} as const;

export const BOOST_POINTS_PROMO_COPY = {
  title: "Usá puntos para boostear servidores",
  description: `Cada boost cuesta ${COST} y ayuda a desbloquear beneficios.`,
  cta: "Ver boosts",
} as const;

export function ownBoostsLabel(count: number): string {
  return count === 1 ? "1 boost tuyo" : `${count} boosts tuyos`;
}

/** "Nivel 1 · 5 en total · 2 tuyos" */
export function serverBoostsSummaryLabel(
  level: BoostLevel,
  boostCount: number,
  ownCount: number,
): string {
  return `Nivel ${level} · ${boostCount} en total · ${ownCount} ${ownCount === 1 ? "tuyo" : "tuyos"}`;
}

export const BOOSTS_LIST_LOAD_ERROR = "No pudimos cargar tus boosts.";
export const BOOST_REQUEST_FAILED =
  "No pudimos boostear el servidor. Intentá de nuevo.";
export const BOOST_REMOVE_FAILED =
  "No pudimos retirar el boost. Intentá de nuevo.";
export const BOOST_STATUS_FAILED = "No pudimos consultar el estado del boost.";

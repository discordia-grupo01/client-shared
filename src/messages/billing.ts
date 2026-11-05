import { POINTS_PURCHASE_EXPIRY_HOURS } from "../constants/billing";
import {
  type BillingErrorCode,
  isLiveSubscription,
  type LedgerReason,
  type PaymentOutcome,
  type PremiumView,
  type PurchaseStatus,
} from "../domain/billing";
import { formatPoints } from "../format/billing";
import { formatMemberSince } from "../format/date";
import { INVALID_DATA_MESSAGE, UNEXPECTED_ERROR_MESSAGE } from "./errors";

export const PREMIUM_BENEFITS: readonly string[] = [
  "Adjuntos de hasta 50 MB por archivo",
  "Emojis animados (GIF) en mensajes y reacciones",
  "Emojis personalizados de todos tus servidores",
  "Insignia Premium visible en tu perfil",
];

export const PREMIUM_RENEWAL_NOTICE =
  "Se renueva automáticamente cada mes. Podés cancelar cuando quieras.";

export const CHECKOUT_LEAVING_NOTICE =
  "Vas a salir a Mercado Pago para pagar y después volvés a Discordia.";

export const BILLING_LOAD_FAILED =
  "No pudimos cargar tu información de Premium y puntos.";

export const CHECKOUT_START_FAILED =
  "No pudimos preparar el pago. Intentá de nuevo.";

export const PREMIUM_CANCEL_FAILED =
  "No pudimos cancelar la suscripción. Intentá de nuevo.";

export const PAYMENT_STATUS_FAILED =
  "No pudimos consultar el estado del pago. Intentá de nuevo.";

export const PAYMENT_REJECTED_DEFAULT = "Mercado Pago rechazó el pago.";

export const BILLING_ERROR_MESSAGES: Readonly<
  Record<BillingErrorCode, string>
> = {
  INVALID_REQUEST: INVALID_DATA_MESSAGE,
  UNKNOWN_PACKAGE: "Ese paquete de puntos ya no está disponible. Elegí otro.",
  PAYER_EMAIL_REQUIRED: "Falta el email del pagador. Ingresalo para seguir.",
  ALREADY_SUBSCRIBED: "Ya tenés una suscripción a Premium activa.",
  NO_LIVE_SUBSCRIPTION: "No tenés una suscripción a Premium para cancelar.",
  PURCHASE_NOT_FOUND: "La compra no existe o no es de tu cuenta.",
  INTERNAL_ERROR:
    "No pudimos completar la operación. Probá de nuevo en unos minutos.",
};

export function billingErrorMessage(code: string | number): string {
  return (
    BILLING_ERROR_MESSAGES[code as BillingErrorCode] ?? UNEXPECTED_ERROR_MESSAGE
  );
}

export const PURCHASE_STATUS_LABELS: Readonly<Record<PurchaseStatus, string>> =
  {
    pending: "Pendiente",
    paid: "Pagada",
    failed: "Fallida",
    expired: "Vencida",
    refunded: "Reembolsada",
    charged_back: "Contracargo",
  };

export const PURCHASE_STATUS_DESCRIPTIONS: Readonly<
  Record<PurchaseStatus, string>
> = {
  pending: "Esperando la confirmación del pago.",
  paid: "Pago confirmado y puntos acreditados.",
  failed: "Pago rechazado. Puede pasar a pagada si se abona con otra tarjeta.",
  expired: `Nadie la pagó dentro de las ${POINTS_PURCHASE_EXPIRY_HOURS} horas.`,
  refunded: "El dinero fue devuelto y los puntos se descontaron.",
  charged_back: "El pago se desconoció y los puntos se descontaron.",
};

export const LEDGER_REASON_LABELS: Readonly<Record<LedgerReason, string>> = {
  purchase: "Compra de puntos",
  refund: "Reembolso",
  chargeback: "Contracargo",
};

const REJECTION_REASONS: Readonly<Record<string, string>> = {
  insufficient_amount: "Fondos insuficientes.",
  rejected_by_issuer: "El banco rechazó el pago.",
  card_disabled: "La tarjeta está deshabilitada.",
  bad_filled_card_data: "Algún dato de la tarjeta es incorrecto.",
  high_risk: "Mercado Pago rechazó el pago por seguridad.",
  required_call_for_authorize: "Tu banco pide que autorices el pago.",
  max_attempts_exceeded: "Superaste la cantidad de intentos con esa tarjeta.",
  amount_limit_exceeded: "El monto supera el límite de la tarjeta.",
};

export function paymentRejectionReason(statusDetail: string): string {
  return REJECTION_REASONS[statusDetail] ?? PAYMENT_REJECTED_DEFAULT;
}

export function unrecoveredPointsNote(points: number): string {
  return `${formatPoints(points)} ya se habían gastado y no se pudieron descontar.`;
}

export interface PremiumStatusCopy {
  label: string;
  detail: string;
}

export function premiumStatusCopy(
  view: Pick<PremiumView, "state" | "mp_status" | "premium_until">,
): PremiumStatusCopy {
  const until = view.premium_until ? formatMemberSince(view.premium_until) : "";
  switch (view.state) {
    case "processing_first_payment":
      return {
        label: "Procesando el primer pago",
        detail:
          "Mercado Pago está confirmando el primer cobro. Puede tardar hasta una hora. Los beneficios todavía no están activos.",
      };
    case "active":
      return {
        label: "Premium activo",
        detail: `Próxima renovación automática: ${until}.`,
      };
    case "active_canceled":
      return {
        label: "Activo sin renovación",
        detail: `Conservás los beneficios hasta el ${until}. No se realizará otro cobro.`,
      };
    case "expired":
      return isLiveSubscription(view.mp_status)
        ? {
            label: "Vencido · Mercado Pago reintentando",
            detail:
              "Los beneficios están desactivados. Mercado Pago puede reintentar el cobro hasta 4 veces durante unos 10 días.",
          }
        : {
            label: "Premium vencido",
            detail:
              "Los beneficios están desactivados y la suscripción ya no está activa en Mercado Pago.",
          };
    case "none":
      return {
        label: "Sin Premium",
        detail: "Todavía no tenés Premium. Podés suscribirte cuando quieras.",
      };
  }
}

export function premiumCancelConfirmation(premiumUntil: string | null): string {
  if (!premiumUntil) {
    return "No se te va a cobrar nada más y la suscripción se cancela.";
  }
  return `No se te va a cobrar el próximo mes. Conservás los beneficios hasta el ${formatMemberSince(premiumUntil)}.`;
}

export interface PaymentOutcomeContext {
  points?: number;
  balance?: number;
  statusDetail?: string;
  premiumUntil?: string | null;
  abandoned?: boolean;
}

export interface PaymentOutcomeCopy {
  title: string;
  description: string;
}

export function paymentOutcomeCopy(
  outcome: PaymentOutcome,
  context: PaymentOutcomeContext = {},
): PaymentOutcomeCopy {
  switch (outcome) {
    case "verifying":
      return {
        title: "Verificando el pago…",
        description: "Estamos consultando el estado actualizado del pago.",
      };
    case "points_accredited": {
      const added =
        context.points === undefined
          ? "Los puntos ya están en tu saldo."
          : `Sumamos ${formatPoints(context.points)}.`;
      const balance =
        context.balance === undefined
          ? ""
          : ` Tu saldo es de ${formatPoints(context.balance)}.`;
      return { title: "Puntos acreditados", description: added + balance };
    }
    case "points_rejected":
      return {
        title: "Pago rechazado",
        description: `${paymentRejectionReason(context.statusDetail ?? "")} Podés volver a intentar con otra tarjeta.`,
      };
    case "points_pending":
      return context.abandoned
        ? {
            title: "Pago sin terminar",
            description: `La compra queda pendiente y vence a las ${POINTS_PURCHASE_EXPIRY_HOURS} horas si no se paga.`,
          }
        : {
            title: "Pago pendiente",
            description:
              "El pago sigue en proceso. Los puntos se acreditan cuando se confirme y el resultado aparece en el historial.",
          };
    case "points_expired":
      return {
        title: "Compra vencida",
        description: `Nadie pagó esta compra dentro de las ${POINTS_PURCHASE_EXPIRY_HOURS} horas. Podés iniciar una compra nueva.`,
      };
    case "points_reversed":
      return {
        title: "Compra revertida",
        description: "Se devolvió el dinero y los puntos se descontaron.",
      };
    case "points_not_found":
      return {
        title: "Compra no encontrada",
        description: "La compra no existe o no es de tu cuenta.",
      };
    case "premium_active":
      return {
        title: "Premium está activo",
        description: context.premiumUntil
          ? `Los beneficios ya están habilitados hasta el ${formatMemberSince(context.premiumUntil)}.`
          : "Los beneficios ya están habilitados.",
      };
    case "premium_processing":
      return {
        title: "Procesando el primer pago",
        description:
          "La autorización se completó, pero el primer cobro todavía no se confirmó. Puede tardar hasta una hora.",
      };
    case "premium_not_activated":
      return {
        title: "Premium no se activó",
        description: context.abandoned
          ? "No terminaste de autorizar la suscripción. Podés intentar de nuevo cuando quieras."
          : "Mercado Pago rechazó el pago o canceló la suscripción. Podés intentar de nuevo.",
      };
  }
}

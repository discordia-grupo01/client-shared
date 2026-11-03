import type {
  PrivateCallEndReason,
  PrivateCallRole,
} from "../domain/private-call";

export const PRIVATE_CALL_FORBIDDEN = "No podés llamar a este usuario.";
export const PRIVATE_CALL_ALREADY_EXISTS =
  "Ya hay una llamada en curso con este usuario.";
export const PRIVATE_CALL_NOT_FOUND = "La llamada ya no está disponible.";
export const PRIVATE_CALL_INVALID_STATE =
  "La llamada ya fue atendida o terminó.";
export const PRIVATE_CALL_START_FAILED =
  "No pudimos iniciar la llamada. Intentá de nuevo.";
export const PRIVATE_CALL_ACCEPT_FAILED =
  "No pudimos atender la llamada. Intentá de nuevo.";
export const PRIVATE_CALL_END_FAILED =
  "No pudimos avisar que cortaste. Ya no se te escucha.";

export interface PrivateCallEndContext {
  reason: PrivateCallEndReason;
  role: PrivateCallRole;
  partnerName: string;
  endedByPartner: boolean;
}

export function privateCallEndNotice({
  reason,
  role,
  partnerName,
  endedByPartner,
}: PrivateCallEndContext): string | null {
  switch (reason) {
    case "declined":
      return role === "caller" ? `${partnerName} rechazó la llamada.` : null;
    case "cancelled":
      return role === "recipient" ? `Llamada perdida de ${partnerName}.` : null;
    case "missed":
      return role === "caller"
        ? `${partnerName} no respondió.`
        : `Llamada perdida de ${partnerName}.`;
    case "hangup":
      return endedByPartner ? `${partnerName} finalizó la llamada.` : null;
    case "disconnected":
      return `Se perdió la conexión con ${partnerName}.`;
  }
}

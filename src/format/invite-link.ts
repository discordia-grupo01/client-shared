/**
 * El backend devuelve un campo `url` en la invitacion, pero no puede saber en
 * que host corre el front: produccion, un preview de Vercel, `localhost:3000`
 * o la IP de la PC cuando el celular levanta la app. Por eso el link lo arma
 * el cliente.
 *
 * TODO: chequear con backend que valor trae hoy `Invitation.url` y decidir si
 * conviene usarlo (haria falta que el back sepa la base del front).
 */
import type { Invitation } from "../domain/invite";

export const INVITE_PATH = "/invite";

/**
 * `baseUrl` es obligatorio -- pasar `null` deja el link relativo
 * (`/invite/abc123`), que no sirve para compartir fuera de la app. Se pide
 * explicito justamente para que quede a la vista en el llamador.
 */
export function buildInviteLink(code: string, baseUrl: string | null): string {
  const path = `${INVITE_PATH}/${code}`;
  if (!baseUrl) return path;
  return `${baseUrl.replace(/\/+$/, "")}${path}`;
}

/**
 * Acepta tanto un link completo (`https://.../invite/xY7z2Q`) como el codigo
 * pelado: agarra el ultimo segmento que parezca un codigo.
 *
 * Si no matchea devuelve lo que entro (recortado) para que el backend sea el
 * que rechace: el front no conoce el formato exacto que genera `servers`.
 */
export function normalizeInviteCode(raw: string): string {
  const match = raw.trim().match(/([A-Za-z0-9_-]{4,20})$/);
  return match ? match[1] : raw.trim();
}

/**
 * En que estado esta una invitacion.
 *
 * Lo calcula el front porque el backend no lo manda: `GET
 * /v1/servers/:id/invites` devuelve TODAS las invitaciones sin filtrar ni
 * marcar cuales siguen sirviendo.
 */
export type InviteStatus = "active" | "revoked" | "expired" | "exhausted";

/**
 * El orden importa: una invitacion revocada que ademas vencio se muestra como
 * revocada, porque es la razon que decidio una persona.
 */
export function inviteStatus(invitation: Invitation): InviteStatus {
  if (invitation.revoked_at) return "revoked";
  if (
    invitation.expires_at &&
    new Date(invitation.expires_at).getTime() <= Date.now()
  ) {
    return "expired";
  }
  if (invitation.max_uses !== null && invitation.uses >= invitation.max_uses) {
    return "exhausted";
  }
  return "active";
}

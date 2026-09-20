/**
 * El backend devuelve un campo `url` en la invitacion, pero no puede saber en
 * que host corre el front: produccion, un preview de Vercel, `localhost:3000`
 * o la IP de la PC cuando el celular levanta la app. Por eso el link lo arma
 * el cliente.
 *
 * TODO: chequear con backend que valor trae hoy `Invitation.url` y decidir si
 * conviene usarlo (haria falta que el back sepa la base del front).
 */
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

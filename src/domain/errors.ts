/**
 * Son DOS tipos y los dos estan bien: `servers` tipa `code` como int (el HTTP
 * status repetido) e `identify-service` como string (un codigo simbolico tipo
 * `EMAIL_ALREADY_EXISTS`). Unificarlos romperia uno de los dos.
 */

export interface ServersApiErrorResponse {
  error: {
    code: number;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface IdentityApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

import type { ApiFailure } from "./api-result";

export const ACCOUNT_SUSPENDED_CODE = "ACCOUNT_SUSPENDED";

/**
 * El staff suspendió la cuenta. Cada backend lo manda distinto:
 * `identify-service` y `messaging` en `error.code`, y `servers` (que tiene
 * `code` numérico) en `details.error_code`.
 */
export function isAccountSuspended(failure: ApiFailure): boolean {
  if (failure.status !== 403) return false;
  return (
    failure.code === ACCOUNT_SUSPENDED_CODE ||
    failure.details?.error_code === ACCOUNT_SUSPENDED_CODE
  );
}

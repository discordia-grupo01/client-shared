export type OwnershipTransferStatus =
  "pending" | "accepted" | "rejected" | "cancelled";

export interface OwnershipTransfer {
  id: string;
  server_id: string;
  from_user_id: string;
  to_user_id: string;
  status: OwnershipTransferStatus;
  created_at: string;
  resolved_at: string | null;
}

/** Las claves espejan el `details.field` del backend, por eso snake_case. */
export interface TransferOwnershipFieldErrors {
  to_user_id?: string;
}

export type InitiateTransferResult =
  | { ok: true; transfer: OwnershipTransfer }
  | {
      ok: false;
      message: string;
      fieldErrors?: TransferOwnershipFieldErrors;
      reason?: "transfer_already_pending";
    };

/**
 * `transfer` es null cuando no hay ninguna pendiente: el back responde 404 en
 * ese caso y eso no es un error, se normaliza.
 */
export type GetPendingTransferResult =
  | { ok: true; transfer: OwnershipTransfer | null }
  | { ok: false; message: string };

/** Aceptar, rechazar o cancelar. */
export type RespondTransferResult =
  { ok: true; transfer: OwnershipTransfer } | { ok: false; message: string };

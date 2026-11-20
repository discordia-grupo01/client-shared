/** `server_deleted`: el staff eliminó un servidor del que el usuario era dueño. */
export type StaffNoticeKind = "server_deleted";

/** Aviso de la plataforma que el usuario ve una vez (`GET /v1/notifications/notices`). */
export interface StaffNotice {
  id: string;
  kind: StaffNoticeKind;
  server_id: string;
  /** Nombre que tenía el servidor cuando se pidió el borrado; ya no existe en otro lado. */
  server_name: string;
  occurred_at: string;
}

export type ListStaffNoticesResult =
  { ok: true; notices: StaffNotice[] } | { ok: false; message: string };

export type MarkStaffNoticeSeenResult =
  { ok: true } | { ok: false; message: string };

/** Respuesta de `GET /v1/notifications/notices`. */
export interface StaffNoticesResponse {
  items: StaffNotice[];
}

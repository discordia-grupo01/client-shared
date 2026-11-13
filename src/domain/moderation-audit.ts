import type { MemberProfile } from "./member";

/**
 * Registro de auditoria de moderacion (`GET /servers/:id/moderation-audit`).
 * Solo lo ven los moderadores: los tres permisos de `MODERATOR_PERMISSIONS`.
 */
export type ModerationAuditAction =
  "ban" | "unban" | "kick" | "mute" | "unmute";

export interface ModerationAuditEntry {
  id: string;
  server_id: string;
  action: ModerationAuditAction;
  actor_user_id: string;
  target_user_id: string;
  occurred_at: string;
  /** `null` hasta que identify replica el perfil en servers. */
  actor_profile: MemberProfile | null;
  target_profile: MemberProfile | null;
}

export interface ModerationAuditPage {
  entries: ModerationAuditEntry[];
  total: number;
  limit: number;
  offset: number;
}

export type ListModerationAuditResult =
  | { ok: true; entries: ModerationAuditEntry[]; total: number }
  | { ok: false; message: string };

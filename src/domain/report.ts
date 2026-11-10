import type { ApiResult } from "./api-result";
import type { MemberProfile } from "./member";
import {
  hasPermission,
  type PermissionContext,
  type RolePermission,
} from "./role";

/**
 * Reportes de mensajes y usuarios (`/v1/servers/:id/reports`, #62). Cualquier
 * miembro reporta; los revisan los moderadores del servidor.
 */
export type ReportKind = "message" | "user";

export type ReportStatus = "pending" | "resolved" | "dismissed";

export type ClosedReportStatus = Exclude<ReportStatus, "pending">;

export interface Report {
  id: string;
  server_id: string;
  kind: ReportKind;
  reporter_id: string;
  channel_id: string | null;
  message_id: string | null;
  reported_user_id: string | null;
  reason: string;
  status: ReportStatus;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  /** Que sancion anoto el moderador al resolver; `null` si no anoto ninguna. */
  resolution_action: ReportResolutionAction | null;
  reporter_profile: MemberProfile | null;
  reported_profile: MemberProfile | null;
}

export interface ReportListResponse {
  reports: Report[];
  total: number;
  limit: number;
  offset: number;
}

export type CreateReportInput =
  | { kind: "message"; channelId: string; messageId: string; reason: string }
  | { kind: "user"; userId: string; reason: string };

export type CreateReportBody =
  | { kind: "message"; channel_id: string; message_id: string; reason: string }
  | { kind: "user"; user_id: string; reason: string };

export function createReportBody(input: CreateReportInput): CreateReportBody {
  if (input.kind === "message") {
    return {
      kind: "message",
      channel_id: input.channelId,
      message_id: input.messageId,
      reason: input.reason,
    };
  }
  return { kind: "user", user_id: input.userId, reason: input.reason };
}

export type CreateReportResult =
  { ok: true; report: Report } | { ok: false; message: string };

export type ListReportsResult =
  | { ok: true; reports: Report[]; total: number }
  | { ok: false; message: string };

export type CloseReportResult =
  | { ok: true; report: Report }
  | { ok: false; message: string; isGone: boolean };

export interface PendingReportsCount {
  total: number | null;
}

export const MODERATOR_PERMISSIONS = [
  "MANAGE_MESSAGES",
  "KICK_MEMBERS",
  "BAN_MEMBERS",
] as const satisfies readonly RolePermission[];

export function isModerator(permissions: readonly string[]): boolean {
  if (permissions.includes("ADMINISTRATOR")) return true;
  return MODERATOR_PERMISSIONS.every((permission) =>
    permissions.includes(permission),
  );
}

export function hasModeratorPermissions(ctx: PermissionContext): boolean {
  return MODERATOR_PERMISSIONS.every((permission) =>
    hasPermission(ctx, permission),
  );
}

export function canReportMessage(message: {
  authorId: string;
  currentUserId: string | null;
  delivery?: string;
}): boolean {
  return (
    message.currentUserId !== null &&
    message.authorId !== message.currentUserId &&
    !message.delivery
  );
}

export function canReportUser(
  targetUserId: string,
  currentUserId: string | null,
): boolean {
  return currentUserId !== null && targetUserId !== currentUserId;
}

export type ReportSanction = "delete" | "mute" | "kick" | "ban";

/**
 * Como guarda el back la sancion al cerrar un reporte (`action` en el PATCH,
 * `resolution_action` en la respuesta). `delete_message` solo vale para
 * reportes de mensaje.
 */
export type ReportResolutionAction = "delete_message" | "mute" | "kick" | "ban";

const RESOLUTION_ACTION_BY_SANCTION: Record<
  ReportSanction,
  ReportResolutionAction
> = {
  delete: "delete_message",
  mute: "mute",
  kick: "kick",
  ban: "ban",
};

export function resolutionActionFor(
  sanction: ReportSanction,
): ReportResolutionAction {
  return RESOLUTION_ACTION_BY_SANCTION[sanction];
}

/**
 * A quien se puede sancionar desde un reporte: el reportado, o el autor del
 * mensaje (que el reporte no trae; sale de `GET /v1/messages?ids=`). Nunca el
 * dueño ni uno mismo, igual que desde el perfil. `null` si no hay a quien.
 */
export function reportSanctionTarget(
  report: Pick<Report, "kind" | "reported_user_id">,
  messageAuthorId: string | null,
  viewer: { currentUserId: string | null; ownerId: string },
): string | null {
  const target =
    report.kind === "user" ? report.reported_user_id : messageAuthorId;
  if (!target) return null;
  if (target === viewer.ownerId || target === viewer.currentUserId) return null;
  return target;
}

export function reportsQuery({
  status,
  limit,
  offset = 0,
}: {
  status: ReportStatus;
  limit: number;
  offset?: number;
}): string {
  return `status=${status}&limit=${limit}&offset=${offset}`;
}

export const PENDING_REPORTS_COUNT_QUERY = reportsQuery({
  status: "pending",
  limit: 1,
});

export function pendingReportsTotalFrom(
  result: ApiResult<ReportListResponse>,
): number | null {
  if (result.ok) return result.data.total;
  if (result.status === 403) return 0;
  return null;
}

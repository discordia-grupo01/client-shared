export const CHANGE_SOCKET_EVENTS = {
  changed: "changed",
} as const;

export const CHANGE_RESOURCES = [
  "servers",
  "server",
  "channels",
  "roles",
  "members",
  "profile",
  "moderation",
  "reports",
  "emojis",
  "notifications",
  "metrics",
  "points",
  "boosts",
  "purchases",
  "premium",
  "backoffice",
] as const;

export type ChangeResource = (typeof CHANGE_RESOURCES)[number];

export const BACKOFFICE_CHANGE_KINDS = [
  "users",
  "servers",
  "reports",
  "staff",
  "dossier",
  "metrics",
  "recovery_requests",
] as const;

export type BackofficeChangeKind = (typeof BACKOFFICE_CHANGE_KINDS)[number];

export interface ResourceChangedPayload {
  resource: ChangeResource;
  server_id?: string | null;
  user_id?: string | null;
  kind?: BackofficeChangeKind | null;
}

export interface ChangeFilter {
  resources: readonly ChangeResource[];
  serverId?: string | null;
  userId?: string | null;
  kinds?: readonly BackofficeChangeKind[];
}

export const CHANGE_POLL_INTERVAL_MS = 30_000;
export const CHANGE_COALESCE_MS = 250;
export const PROFILE_REPLICATION_DELAY_MS = 2_000;

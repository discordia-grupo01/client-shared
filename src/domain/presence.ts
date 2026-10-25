import type {
  ActivityStatus,
  ActivityStatusChoice,
} from "../constants/activity-status";

export interface PresenceEntry {
  user_id: string;
  status: ActivityStatus;
  version: number;
}

export interface PresenceListResponse {
  presences: PresenceEntry[];
}

export interface UserChannelJoinReply {
  status?: ActivityStatusChoice;
  idle_after_ms?: number;
}

export interface OwnStatusPayload {
  status: ActivityStatusChoice;
  version: number;
}

export type ListPresenceResult =
  { ok: true; presences: PresenceEntry[] } | { ok: false; message: string };

export type PresenceMap = Readonly<
  Record<string, { status: ActivityStatus; version: number }>
>;

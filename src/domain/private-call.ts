export type PrivateCallStatus = "ringing" | "active" | "rejected" | "ended";

export const PRIVATE_CALL_END_REASONS = [
  "declined",
  "cancelled",
  "missed",
  "hangup",
  "disconnected",
] as const;

/**
 * Por que termino la llamada:
 * - `declined`: quien recibe la rechazo.
 * - `cancelled`: quien llama corto antes de que atiendan.
 * - `missed`: nadie atendio en 30 s.
 * - `hangup`: alguien corto la llamada en curso.
 * - `disconnected`: alguien se fue de la sala sin cortar (cerro la pestaña,
 *   perdio la conexion) y el back la cerro.
 */
export type PrivateCallEndReason = (typeof PRIVATE_CALL_END_REASONS)[number];

export interface PrivateCall {
  call_id: string;
  conversation_id: string;
  caller_id: string;
  recipient_id: string;
  room_name: string;
  status: PrivateCallStatus;
}

export interface PrivateCallCredentials {
  token: string;
  url: string;
}

export type AcceptedPrivateCall = PrivateCall & PrivateCallCredentials;

export interface EndedPrivateCall extends PrivateCall {
  reason: PrivateCallEndReason;
  ended_by: string | null;
}

export const PRIVATE_CALL_EVENTS = {
  incoming: "private_call_incoming",
  accepted: "private_call_accepted",
  answered: "private_call_answered",
  rejected: "private_call_rejected",
  missed: "private_call_missed",
  ended: "private_call_ended",
} as const;

export type PrivateCallEvent =
  (typeof PRIVATE_CALL_EVENTS)[keyof typeof PRIVATE_CALL_EVENTS];

export type PrivateCallRole = "caller" | "recipient";

export function privateCallTopic(userId: string): string {
  return `voice_user:${userId}`;
}

export function privateCallRoleOf(
  call: PrivateCall,
  userId: string,
): PrivateCallRole | null {
  if (call.caller_id === userId) return "caller";
  if (call.recipient_id === userId) return "recipient";
  return null;
}

export function privateCallPartnerIdOf(
  call: PrivateCall,
  userId: string,
): string {
  return call.caller_id === userId ? call.recipient_id : call.caller_id;
}

const STATUSES: readonly PrivateCallStatus[] = [
  "ringing",
  "active",
  "rejected",
  "ended",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFilledString(value: unknown): value is string {
  return typeof value === "string" && value !== "";
}

function isStatus(value: unknown): value is PrivateCallStatus {
  return (STATUSES as readonly unknown[]).includes(value);
}

function isEndReason(value: unknown): value is PrivateCallEndReason {
  return (PRIVATE_CALL_END_REASONS as readonly unknown[]).includes(value);
}

export function parsePrivateCall(payload: unknown): PrivateCall | null {
  if (!isRecord(payload)) return null;
  const {
    call_id,
    conversation_id,
    caller_id,
    recipient_id,
    room_name,
    status,
  } = payload;
  if (
    !isFilledString(call_id) ||
    !isFilledString(conversation_id) ||
    !isFilledString(caller_id) ||
    !isFilledString(recipient_id) ||
    !isFilledString(room_name) ||
    !isStatus(status)
  ) {
    return null;
  }
  return {
    call_id,
    conversation_id,
    caller_id,
    recipient_id,
    room_name,
    status,
  };
}

export function parseAcceptedPrivateCall(
  payload: unknown,
): AcceptedPrivateCall | null {
  const call = parsePrivateCall(payload);
  if (!call || !isRecord(payload)) return null;
  const { token, url } = payload;
  if (!isFilledString(token) || !isFilledString(url)) return null;
  return { ...call, token, url };
}

export function parseEndedPrivateCall(
  payload: unknown,
): EndedPrivateCall | null {
  const call = parsePrivateCall(payload);
  if (!call || !isRecord(payload)) return null;
  const { reason, ended_by } = payload;
  if (!isEndReason(reason)) return null;
  if (ended_by !== null && !isFilledString(ended_by)) return null;
  return { ...call, reason, ended_by };
}

export type StartPrivateCallResult =
  { ok: true; call: PrivateCall } | { ok: false; message: string };

export type AcceptPrivateCallResult =
  { ok: true; call: AcceptedPrivateCall } | { ok: false; message: string };

export type PrivateCallActionResult =
  { ok: true } | { ok: false; message: string };

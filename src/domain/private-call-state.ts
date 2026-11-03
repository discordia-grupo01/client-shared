import { privateCallEndNotice } from "../messages/private-call";

import type {
  AcceptedPrivateCall,
  EndedPrivateCall,
  PrivateCall,
  PrivateCallCredentials,
  PrivateCallRole,
} from "./private-call";

export type PrivateCallPhase =
  "idle" | "outgoing" | "incoming" | "connecting" | "in_call";

export interface PrivateCallPartner {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface PrivateCallState {
  phase: PrivateCallPhase;
  call: PrivateCall | null;
  role: PrivateCallRole | null;
  partner: PrivateCallPartner | null;
  credentials: PrivateCallCredentials | null;
  notice: string | null;
}

export type PrivateCallAction =
  | { type: "start_requested"; partner: PrivateCallPartner }
  | { type: "started"; call: PrivateCall }
  | { type: "incoming"; call: PrivateCall; partner: PrivateCallPartner }
  | { type: "accept_requested" }
  | { type: "accepted"; call: AcceptedPrivateCall }
  | { type: "connected" }
  | { type: "answered_elsewhere"; callId: string }
  | { type: "ended"; call: EndedPrivateCall }
  | { type: "closed" }
  | { type: "failed"; message: string }
  | { type: "dismiss_notice" };

export const initialPrivateCallState: PrivateCallState = {
  phase: "idle",
  call: null,
  role: null,
  partner: null,
  credentials: null,
  notice: null,
};

function idleWith(notice: string | null): PrivateCallState {
  return { ...initialPrivateCallState, notice };
}

function isCurrentCall(state: PrivateCallState, callId: string): boolean {
  return state.call?.call_id === callId;
}

export function privateCallReducer(
  state: PrivateCallState,
  action: PrivateCallAction,
): PrivateCallState {
  switch (action.type) {
    case "start_requested":
      if (state.phase !== "idle") return state;
      return {
        ...initialPrivateCallState,
        phase: "outgoing",
        role: "caller",
        partner: action.partner,
      };
    case "started":
      if (state.phase !== "outgoing" || state.call) return state;
      return { ...state, call: action.call };
    case "incoming":
      if (state.phase !== "idle") return state;
      return {
        ...initialPrivateCallState,
        phase: "incoming",
        call: action.call,
        role: "recipient",
        partner: action.partner,
      };
    case "accept_requested":
      return state.phase === "incoming"
        ? { ...state, phase: "connecting" }
        : state;
    case "accepted": {
      const { token, url, ...call } = action.call;
      const waiting =
        (state.phase === "outgoing" && state.role === "caller") ||
        (state.phase === "connecting" && state.role === "recipient");
      if (!waiting || !isCurrentCall(state, call.call_id)) return state;
      return {
        ...state,
        phase: "connecting",
        call,
        credentials: { token, url },
      };
    }
    case "connected":
      return state.phase === "connecting"
        ? { ...state, phase: "in_call" }
        : state;
    case "answered_elsewhere":
      return state.phase === "incoming" && isCurrentCall(state, action.callId)
        ? idleWith(null)
        : state;
    case "ended": {
      const { call } = action;
      if (!isCurrentCall(state, call.call_id) || !state.role || !state.partner)
        return state;
      return idleWith(
        privateCallEndNotice({
          reason: call.reason,
          role: state.role,
          partnerName: state.partner.name,
          endedByPartner: call.ended_by === state.partner.id,
        }),
      );
    }
    case "closed":
      return idleWith(null);
    case "failed":
      return idleWith(action.message);
    case "dismiss_notice":
      return { ...state, notice: null };
  }
}

export function isPrivateCallBusy(state: PrivateCallState): boolean {
  return state.phase !== "idle";
}

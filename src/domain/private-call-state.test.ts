import { describe, expect, it } from "vitest";

import type {
  AcceptedPrivateCall,
  EndedPrivateCall,
  PrivateCall,
  PrivateCallEndReason,
} from "./private-call";
import {
  initialPrivateCallState,
  isPrivateCallBusy,
  type PrivateCallAction,
  type PrivateCallPartner,
  privateCallReducer,
  type PrivateCallState,
} from "./private-call-state";

const ana: PrivateCallPartner = { id: "ana", name: "Ana", avatarUrl: null };
const beto: PrivateCallPartner = { id: "beto", name: "Beto", avatarUrl: null };

const ringing: PrivateCall = {
  call_id: "call-1",
  conversation_id: "conv-1",
  caller_id: "ana",
  recipient_id: "beto",
  room_name: "private-call:call-1",
  status: "ringing",
};

const accepted: AcceptedPrivateCall = {
  ...ringing,
  status: "active",
  token: "jwt",
  url: "wss://livekit",
};

function ended(
  reason: PrivateCallEndReason,
  endedBy: string | null,
  callId = ringing.call_id,
): EndedPrivateCall {
  return {
    ...ringing,
    call_id: callId,
    status: "ended",
    reason,
    ended_by: endedBy,
  };
}

function run(...actions: PrivateCallAction[]): PrivateCallState {
  return actions.reduce(privateCallReducer, initialPrivateCallState);
}

const calling = run(
  { type: "start_requested", partner: beto },
  { type: "started", call: ringing },
);

const ringingForBeto = run({ type: "incoming", call: ringing, partner: ana });

describe("quien llama", () => {
  it("queda llamando mientras espera la respuesta del back", () => {
    const state = run({ type: "start_requested", partner: beto });
    expect(state).toMatchObject({
      phase: "outgoing",
      role: "caller",
      partner: beto,
      call: null,
    });
    expect(isPrivateCallBusy(state)).toBe(true);
  });

  it("guarda la llamada cuando responde el back", () => {
    expect(calling).toMatchObject({ phase: "outgoing", call: ringing });
  });

  it("se conecta con sus credenciales cuando atienden", () => {
    const state = privateCallReducer(calling, {
      type: "accepted",
      call: accepted,
    });
    expect(state).toMatchObject({
      phase: "connecting",
      credentials: { token: "jwt", url: "wss://livekit" },
    });
    expect(state.call).toEqual({ ...ringing, status: "active" });
  });

  it("queda en llamada cuando la sesion de voz conecta", () => {
    const state = run(
      { type: "start_requested", partner: beto },
      { type: "started", call: ringing },
      { type: "accepted", call: accepted },
      { type: "connected" },
    );
    expect(state.phase).toBe("in_call");
  });

  it("no puede iniciar otra llamada mientras tanto", () => {
    expect(
      privateCallReducer(calling, { type: "start_requested", partner: ana }),
    ).toBe(calling);
  });
});

describe("quien recibe", () => {
  it("ve la llamada entrante", () => {
    expect(ringingForBeto).toMatchObject({
      phase: "incoming",
      role: "recipient",
      partner: ana,
      call: ringing,
    });
  });

  it("pasa a conectarse al atender y despues recibe sus credenciales", () => {
    const state = run(
      { type: "incoming", call: ringing, partner: ana },
      { type: "accept_requested" },
      { type: "accepted", call: accepted },
    );
    expect(state).toMatchObject({
      phase: "connecting",
      credentials: { token: "jwt", url: "wss://livekit" },
    });
  });

  it("deja de sonar si atendio en otra sesion", () => {
    const state = privateCallReducer(ringingForBeto, {
      type: "answered_elsewhere",
      callId: ringing.call_id,
    });
    expect(state).toEqual(initialPrivateCallState);
  });

  it("no corta la sesion que atendio cuando llega su propio aviso", () => {
    const answering = privateCallReducer(ringingForBeto, {
      type: "accept_requested",
    });
    expect(
      privateCallReducer(answering, {
        type: "answered_elsewhere",
        callId: ringing.call_id,
      }),
    ).toBe(answering);
  });

  it("no pisa una llamada en curso con otra entrante", () => {
    const other = { ...ringing, call_id: "call-2", caller_id: "carla" };
    expect(
      privateCallReducer(calling, {
        type: "incoming",
        call: other,
        partner: ana,
      }),
    ).toBe(calling);
  });
});

describe("fin de la llamada", () => {
  it("avisa a quien llama que lo rechazaron", () => {
    const state = privateCallReducer(calling, {
      type: "ended",
      call: ended("declined", "beto"),
    });
    expect(state).toEqual({
      ...initialPrivateCallState,
      notice: "Beto rechazó la llamada.",
    });
  });

  it("avisa a quien recibe que se perdio la llamada", () => {
    expect(
      privateCallReducer(ringingForBeto, {
        type: "ended",
        call: ended("missed", null),
      }).notice,
    ).toBe("Llamada perdida de Ana.");
  });

  it("avisa cuando el otro corta", () => {
    const inCall = run(
      { type: "start_requested", partner: beto },
      { type: "started", call: ringing },
      { type: "accepted", call: accepted },
      { type: "connected" },
    );
    expect(
      privateCallReducer(inCall, {
        type: "ended",
        call: ended("hangup", "beto"),
      }).notice,
    ).toBe("Beto finalizó la llamada.");
  });

  it("ignora eventos de otra llamada", () => {
    expect(
      privateCallReducer(calling, {
        type: "ended",
        call: ended("hangup", "beto", "call-viejo"),
      }),
    ).toBe(calling);
  });

  it("cierra sin aviso cuando la terminaste vos", () => {
    expect(privateCallReducer(calling, { type: "closed" })).toEqual(
      initialPrivateCallState,
    );
  });

  it("muestra el error si algo falla y se puede descartar el aviso", () => {
    const failed = privateCallReducer(calling, {
      type: "failed",
      message: "No podés llamar a este usuario.",
    });
    expect(failed).toMatchObject({
      phase: "idle",
      notice: "No podés llamar a este usuario.",
    });
    expect(privateCallReducer(failed, { type: "dismiss_notice" })).toEqual(
      initialPrivateCallState,
    );
  });
});

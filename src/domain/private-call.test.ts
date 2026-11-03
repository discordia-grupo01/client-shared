import { describe, expect, it } from "vitest";

import {
  parseAcceptedPrivateCall,
  parseEndedPrivateCall,
  parsePrivateCall,
  type PrivateCall,
  privateCallPartnerIdOf,
  privateCallRoleOf,
  privateCallTopic,
} from "./private-call";

const call: PrivateCall = {
  call_id: "call-1",
  conversation_id: "conv-1",
  caller_id: "ana",
  recipient_id: "beto",
  room_name: "private-call:call-1",
  status: "ringing",
};

describe("parsePrivateCall", () => {
  it("acepta el payload del back", () => {
    expect(parsePrivateCall({ ...call, extra: true })).toEqual(call);
  });

  it.each([
    ["no es un objeto", null],
    ["falta call_id", { ...call, call_id: undefined }],
    ["call_id vacio", { ...call, call_id: "" }],
    ["status desconocido", { ...call, status: "paused" }],
  ])("rechaza cuando %s", (_caso, payload) => {
    expect(parsePrivateCall(payload)).toBeNull();
  });
});

describe("parseAcceptedPrivateCall", () => {
  const accepted = { ...call, status: "active", token: "jwt", url: "wss://lk" };

  it("devuelve la llamada con sus credenciales", () => {
    expect(parseAcceptedPrivateCall(accepted)).toEqual(accepted);
  });

  it("sin token o sin url no sirve para conectarse", () => {
    expect(parseAcceptedPrivateCall({ ...accepted, token: "" })).toBeNull();
    expect(
      parseAcceptedPrivateCall({ ...accepted, url: undefined }),
    ).toBeNull();
  });
});

describe("parseEndedPrivateCall", () => {
  it("devuelve el motivo y quien la termino", () => {
    expect(
      parseEndedPrivateCall({
        ...call,
        status: "rejected",
        reason: "declined",
        ended_by: "beto",
      }),
    ).toMatchObject({ reason: "declined", ended_by: "beto" });
  });

  it("acepta ended_by null cuando expiro", () => {
    expect(
      parseEndedPrivateCall({
        ...call,
        status: "ended",
        reason: "missed",
        ended_by: null,
      }),
    ).toMatchObject({ reason: "missed", ended_by: null });
  });

  it("rechaza un motivo desconocido o un ended_by invalido", () => {
    expect(
      parseEndedPrivateCall({ ...call, reason: "boom", ended_by: null }),
    ).toBeNull();
    expect(
      parseEndedPrivateCall({ ...call, reason: "hangup", ended_by: 7 }),
    ).toBeNull();
  });
});

describe("roles", () => {
  it("dice quien llama y quien recibe", () => {
    expect(privateCallRoleOf(call, "ana")).toBe("caller");
    expect(privateCallRoleOf(call, "beto")).toBe("recipient");
    expect(privateCallRoleOf(call, "carla")).toBeNull();
  });

  it("devuelve al otro participante", () => {
    expect(privateCallPartnerIdOf(call, "ana")).toBe("beto");
    expect(privateCallPartnerIdOf(call, "beto")).toBe("ana");
  });

  it("arma el topic personal del socket de voz", () => {
    expect(privateCallTopic("ana")).toBe("voice_user:ana");
  });
});

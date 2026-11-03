import { describe, expect, it } from "vitest";

import type { PrivateCallEndReason } from "../domain/private-call";

import {
  PRIVATE_CALL_ALREADY_EXISTS,
  PRIVATE_CALL_FORBIDDEN,
  PRIVATE_CALL_INVALID_STATE,
  PRIVATE_CALL_NOT_FOUND,
  privateCallEndNotice,
} from "./private-call";
import { privateCallDialogLabel, privateCallTitle } from "./ui";
import { voiceErrorMessage } from "./voice";

function notice(
  reason: PrivateCallEndReason,
  role: "caller" | "recipient",
  endedByPartner = true,
) {
  return privateCallEndNotice({
    reason,
    role,
    partnerName: "Beto",
    endedByPartner,
  });
}

describe("privateCallEndNotice", () => {
  it.each([
    ["declined", "caller", "Beto rechazó la llamada."],
    ["declined", "recipient", null],
    ["cancelled", "caller", null],
    ["cancelled", "recipient", "Llamada perdida de Beto."],
    ["missed", "caller", "Beto no respondió."],
    ["missed", "recipient", "Llamada perdida de Beto."],
    ["hangup", "caller", "Beto finalizó la llamada."],
    ["hangup", "recipient", "Beto finalizó la llamada."],
    ["disconnected", "caller", "Se perdió la conexión con Beto."],
    ["disconnected", "recipient", "Se perdió la conexión con Beto."],
  ] as const)("%s visto por %s", (reason, role, expected) => {
    expect(notice(reason, role)).toBe(expected);
  });

  it("no avisa a quien corto la llamada, aunque haya sido desde otra pestaña", () => {
    expect(notice("hangup", "caller", false)).toBeNull();
  });
});

describe("errores de la llamada privada", () => {
  it.each([
    ["voice_call_forbidden", PRIVATE_CALL_FORBIDDEN],
    ["call_not_found", PRIVATE_CALL_NOT_FOUND],
    ["call_already_exists", PRIVATE_CALL_ALREADY_EXISTS],
    ["invalid_call_state", PRIVATE_CALL_INVALID_STATE],
  ] as const)("%s tiene su propio mensaje", (code, expected) => {
    expect(voiceErrorMessage(code)).toBe(expected);
  });
});

describe("textos de pantalla", () => {
  it("nombra al otro participante", () => {
    expect(privateCallTitle("Beto")).toBe("Llamada con Beto");
    expect(privateCallDialogLabel("Beto")).toBe("Llamada privada con Beto");
  });
});

import { describe, expect, it } from "vitest";

import { VOICE_ERROR_CODES } from "../domain/voice";

import { UNEXPECTED_ERROR_MESSAGE } from "./errors";
import { VOICE_CONNECT_FORBIDDEN } from "./permissions";
import {
  voiceConnectedCount,
  voiceConnectedLocation,
  voicePresenceCount,
} from "./ui";
import {
  VOICE_REMOVED,
  VOICE_UNAVAILABLE,
  voiceDisconnectMessage,
  voiceErrorMessage,
  voiceMediaErrorMessage,
} from "./voice";

describe("voiceErrorMessage", () => {
  it("tiene un mensaje para cada codigo de signaling", () => {
    for (const code of VOICE_ERROR_CODES) {
      expect(voiceErrorMessage(code)).not.toBe(UNEXPECTED_ERROR_MESSAGE);
    }
  });

  it("sin permiso de conexion usa el mismo texto que el resto de los permisos", () => {
    expect(voiceErrorMessage("voice_forbidden")).toBe(VOICE_CONNECT_FORBIDDEN);
  });

  it("muestra lo mismo si la voz no esta configurada o no responde", () => {
    expect(voiceErrorMessage("voice_not_configured")).toBe(VOICE_UNAVAILABLE);
    expect(voiceErrorMessage("voice_unavailable")).toBe(VOICE_UNAVAILABLE);
  });

  it("sin codigo cae al fallback", () => {
    expect(voiceErrorMessage(undefined)).toBe(UNEXPECTED_ERROR_MESSAGE);
    expect(voiceErrorMessage(undefined, "Otro.")).toBe("Otro.");
  });
});

describe("voiceMediaErrorMessage", () => {
  it("explica que hace falta el microfono", () => {
    expect(voiceMediaErrorMessage("mic_denied")).toMatch(/micrófono/);
  });
});

describe("voiceDisconnectMessage", () => {
  it("no avisa nada si la cortaste vos", () => {
    expect(voiceDisconnectMessage("client")).toBeNull();
  });

  it("avisa cuando te sacaron de la sala", () => {
    expect(voiceDisconnectMessage("removed")).toBe(VOICE_REMOVED);
  });

  it("tiene un aviso para cada corte que no elegiste", () => {
    for (const reason of ["removed", "room_closed", "error"] as const) {
      expect(voiceDisconnectMessage(reason)).toMatch(/\.$/);
    }
  });
});

describe("copy del canal de voz", () => {
  it("usa singular con una sola persona", () => {
    expect(voiceConnectedCount(1)).toBe("1 conectado");
    expect(voiceConnectedCount(4)).toBe("4 conectados");
    expect(voiceConnectedCount(0)).toBe("0 conectados");
  });

  it("cuenta quien esta en el canal antes de entrar", () => {
    expect(voicePresenceCount(1)).toBe("Hay 1 persona en el canal.");
    expect(voicePresenceCount(3)).toBe("Hay 3 personas en el canal.");
  });

  it("arma la ubicacion como en el prototipo", () => {
    expect(voiceConnectedLocation("General", "Discordia HQ")).toBe(
      "General • Discordia HQ",
    );
  });
});

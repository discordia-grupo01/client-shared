import { describe, expect, it } from "vitest";

import {
  parsePending,
  serializePending,
  withChatPending,
} from "./pending-store";
import {
  PENDING_TTL_MS,
  SEND_MAX_ATTEMPTS,
  type PendingMessage,
} from "./send-queue";

const NOW = Date.parse("2026-10-02T12:00:00.000Z");

const entry = (
  clientId: string,
  createdAt = "2026-10-02T11:00:00.000Z",
): PendingMessage => ({
  clientId,
  content: `texto ${clientId}`,
  status: "sending",
  attempts: 1,
  error: null,
  createdAt,
  acked: false,
  slow: false,
});

describe("parsePending", () => {
  it("lo guardado vuelve como fallido para que el usuario decida", () => {
    const raw = serializePending({ c1: [entry("a")] });

    expect(parsePending(raw, NOW)).toEqual({
      c1: [
        {
          clientId: "a",
          content: "texto a",
          status: "failed",
          attempts: SEND_MAX_ATTEMPTS,
          error: null,
          createdAt: "2026-10-02T11:00:00.000Z",
          acked: false,
          slow: false,
        },
      ],
    });
  });

  it("descarta lo de mas de 2 h y los chats que quedan vacios", () => {
    const old = new Date(NOW - PENDING_TTL_MS - 1).toISOString();
    const raw = serializePending({ c1: [entry("a", old)], c2: [entry("b")] });

    expect(Object.keys(parsePending(raw, NOW))).toEqual(["c2"]);
  });

  it("lo que justo cumple 2 h ya se descarta", () => {
    const exact = new Date(NOW - PENDING_TTL_MS).toISOString();

    expect(
      parsePending(serializePending({ c1: [entry("a", exact)] }), NOW),
    ).toEqual({});
  });

  it("ignora texto roto o con otra forma", () => {
    expect(parsePending(null, NOW)).toEqual({});
    expect(parsePending("no es json", NOW)).toEqual({});
    expect(parsePending("[1,2]", NOW)).toEqual({});
    expect(parsePending('{"c1":[{"clientId":1}],"c2":"x"}', NOW)).toEqual({});
  });
});

describe("withChatPending", () => {
  it("reemplaza los de un chat y deja los demas", () => {
    const next = withChatPending({ c1: [entry("a")], c2: [entry("b")] }, "c1", [
      entry("c"),
    ]);

    expect(next.c1.map((e) => e.clientId)).toEqual(["c"]);
    expect(next.c2.map((e) => e.clientId)).toEqual(["b"]);
  });

  it("quita el chat si no quedan mensajes", () => {
    expect(withChatPending({ c1: [entry("a")] }, "c1", [])).toEqual({});
  });
});

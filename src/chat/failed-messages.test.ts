import { describe, expect, it } from "vitest";

import type { Message } from "../domain/message";
import { addFailed, withFailedMessages } from "./failed-messages";

function msg(id: string, userId = "ana"): Message {
  return {
    id,
    channel_id: "c1",
    server_id: "",
    user_id: userId,
    content: id,
    inserted_at: "2026-10-01T12:00:00.000Z",
  };
}

const entry = (tempId: string, afterMessageId: string | null) => ({
  tempId,
  content: `fallido ${tempId}`,
  error: "No se pudo",
  afterMessageId,
});

describe("withFailedMessages", () => {
  it("sin fallidos devuelve los mensajes tal cual", () => {
    const history = [msg("m1")];
    expect(withFailedMessages(history, [], "me", "c1")).toEqual(history);
  });

  it("el fallido queda marcado, con su motivo y como mensaje propio", () => {
    const failed = addFailed([], entry("t1", "m1"));

    const shown = withFailedMessages([msg("m1")], failed, "me", "c1");

    expect(shown[1]).toMatchObject({
      id: "failed:t1",
      user_id: "me",
      content: "fallido t1",
      delivery: "failed",
      delivery_error: "No se pudo",
    });
  });

  it("queda justo despues del mensaje que habia al enviar, y lo que llego despues va debajo", () => {
    const failed = addFailed([], entry("t1", "m1"));

    const shown = withFailedMessages(
      [msg("m1"), msg("m2"), msg("m3")],
      failed,
      "me",
      "c1",
    );

    expect(shown.map((m) => m.id)).toEqual(["m1", "failed:t1", "m2", "m3"]);
  });

  it("en un chat que estaba vacio va primero", () => {
    const failed = addFailed([], entry("t1", null));

    const shown = withFailedMessages([msg("m1")], failed, "me", "c1");

    expect(shown.map((m) => m.id)).toEqual(["failed:t1", "m1"]);
  });

  it("si el mensaje anterior ya no esta, va al final", () => {
    const failed = addFailed([], entry("t1", "borrado"));

    const shown = withFailedMessages([msg("m1")], failed, "me", "c1");

    expect(shown.map((m) => m.id)).toEqual(["m1", "failed:t1"]);
  });

  it("varios fallidos tras el mismo mensaje se mantienen en orden de envio", () => {
    let failed = addFailed([], entry("t1", "m1"));
    failed = addFailed(failed, entry("t2", "m1"));

    const shown = withFailedMessages([msg("m1")], failed, "me", "c1");

    expect(shown.map((m) => m.id)).toEqual(["m1", "failed:t1", "failed:t2"]);
  });
});

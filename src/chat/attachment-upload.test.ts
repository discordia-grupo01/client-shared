import { describe, expect, it } from "vitest";

import { ATTACHMENT_UPLOAD_FAILED } from "../messages/chat";

import { toUploadAttachmentResult } from "./attachment-upload";
import { attachmentUploadQuery } from "../domain/attachment";
import { withAttachmentIds } from "./channel-chat";

const attachment = {
  id: "a1",
  url: "https://x/a1.png",
  name: "a1.png",
  content_type: "image/png",
  size: 10,
};

describe("toUploadAttachmentResult", () => {
  it("devuelve el adjunto cuando salio bien", () => {
    expect(
      toUploadAttachmentResult({ ok: true, status: 201, data: attachment }),
    ).toEqual({ ok: true, attachment });
  });

  it("usa el texto del codigo conocido del back", () => {
    const result = toUploadAttachmentResult({
      ok: false,
      status: 413,
      code: "FILE_TOO_LARGE",
      message: "x",
    });
    expect(result).toMatchObject({ ok: false });
    expect(result.ok === false && result.message).toContain("10 MB");
  });

  it("cae al generico con un codigo desconocido", () => {
    expect(
      toUploadAttachmentResult({
        ok: false,
        status: 0,
        code: "NETWORK_ERROR",
        message: "x",
      }),
    ).toEqual({ ok: false, message: ATTACHMENT_UPLOAD_FAILED });
  });
});

describe("withAttachmentIds", () => {
  it("no agrega attachment_ids sin adjuntos", () => {
    expect(withAttachmentIds({ content: "hola" })).toEqual({ content: "hola" });
    expect(withAttachmentIds({ content: "hola" }, [])).toEqual({
      content: "hola",
    });
  });

  it("agrega attachment_ids con adjuntos", () => {
    expect(withAttachmentIds({ content: "" }, ["a1"])).toEqual({
      content: "",
      attachment_ids: ["a1"],
    });
  });
});

describe("attachmentUploadQuery", () => {
  it("arma la query de un canal y de un DM", () => {
    expect(attachmentUploadQuery({ channelId: "c1" }, "a b.png")).toBe(
      "channel_id=c1&filename=a%20b.png",
    );
    expect(attachmentUploadQuery({ to: "u1" })).toBe("to=u1");
  });
});

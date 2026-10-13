import type {
  MessageAttachment,
  UploadAttachmentResult,
} from "../domain/attachment";
import type { ApiResult } from "../domain/api-result";
import { ATTACHMENT_UPLOAD_FAILED, messageErrorFor } from "../messages/chat";

/**
 * Traduce la respuesta de `POST /v1/attachments`. Un error del back (formato,
 * tamano, permisos) trae `code`: se muestra su texto; sin codigo conocido cae
 * al mensaje generico.
 */
export function toUploadAttachmentResult(
  result: ApiResult<MessageAttachment>,
): UploadAttachmentResult {
  if (result.ok) return { ok: true, attachment: result.data };
  return {
    ok: false,
    message: messageErrorFor(result.code, ATTACHMENT_UPLOAD_FAILED),
  };
}

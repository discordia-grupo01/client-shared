/**
 * Archivo adjunto a un mensaje. Espeja lo que devuelve `messaging`
 * (`Attachment.to_api`/`embed` en el back), con los mismos nombres.
 */
export interface MessageAttachment {
  id: string;
  /** URL publica del archivo (Cloudinary); se puede usar directo en `<img>`. */
  url: string;
  name: string;
  content_type: string;
  size: number;
}

export type UploadAttachmentResult =
  { ok: true; attachment: MessageAttachment } | { ok: false; message: string };

/** `true` si el adjunto se muestra como imagen; el resto (PDF) como tarjeta de archivo. */
export function isImageAttachment(
  attachment: Pick<MessageAttachment, "content_type">,
): boolean {
  return attachment.content_type.startsWith("image/");
}

/** Donde se va a enviar el mensaje: un canal de un servidor o el usuario de un DM. */
export type AttachmentTarget = { channelId: string } | { to: string };

/** Query de `POST /v1/attachments` para un destino (sin el `?`). */
export function attachmentUploadQuery(
  target: AttachmentTarget,
  filename?: string,
): string {
  const parts = [
    "channelId" in target
      ? `channel_id=${encodeURIComponent(target.channelId)}`
      : `to=${encodeURIComponent(target.to)}`,
  ];
  if (filename) parts.push(`filename=${encodeURIComponent(filename)}`);
  return parts.join("&");
}

export interface Channel {
  id: string;
  name: string;
  kind: "text" | "voice";
  position: number;
  category_id: string | null;
  topic: string | null;
}

export interface CreateChannelFieldErrors {
  name?: string;
  kind?: string;
  category_id?: string;
}

export type CreateChannelResult =
  | { ok: true; channel: Channel }
  | { ok: false; message: string; fieldErrors?: CreateChannelFieldErrors };

export interface UpdateChannelFieldErrors {
  name?: string;
}

export type UpdateChannelResult =
  | { ok: true; channel: Channel }
  | { ok: false; message: string; fieldErrors?: UpdateChannelFieldErrors };

export type DeleteChannelResult = { ok: true } | { ok: false; message: string };

export type MoveChannelResult =
  { ok: true; channel: Channel } | { ok: false; message: string };

/**
 * El back exige que `channel_ids` sea exactamente el set de canales que ya
 * esta en esa categoria (o en "sin categoria" si es null), ni mas ni menos.
 */
export type ReorderChannelsResult =
  { ok: true } | { ok: false; message: string };

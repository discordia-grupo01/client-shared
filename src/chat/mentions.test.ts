import { describe, expect, it } from "vitest";

import type { MentionEventPayload, UserMention } from "../domain/mention";
import type { Message } from "../domain/message";
import {
  addUnreadMention,
  clearChannelMentions,
  mergeUnreadMentions,
  NO_UNREAD_MENTIONS,
  unreadByChannel,
  unreadByServer,
} from "./mentions";

const stored = (
  messageId: string,
  channelId: string,
  serverId: string,
): UserMention => ({
  id: `${messageId}:me`,
  message_id: messageId,
  channel_id: channelId,
  server_id: serverId,
  author_id: "otro",
  inserted_at: "2026-10-09T12:00:00.000Z",
  message: null,
});

const live = (
  messageId: string,
  channelId: string,
  serverId: string,
): MentionEventPayload => ({
  server_id: serverId,
  channel_id: channelId,
  message: { id: messageId } as Message,
});

describe("menciones sin leer", () => {
  it("arma el estado desde GET /v1/mentions", () => {
    const state = mergeUnreadMentions(NO_UNREAD_MENTIONS, [
      stored("m1", "c1", "s1"),
      stored("m2", "c1", "s1"),
      stored("m3", "c2", "s2"),
    ]);
    expect(unreadByChannel(state)).toEqual({ c1: 2, c2: 1 });
    expect(unreadByServer(state)).toEqual({ s1: 2, s2: 1 });
  });

  it("la misma mencion por el socket y por REST cuenta una sola vez", () => {
    const afterLive = addUnreadMention(
      NO_UNREAD_MENTIONS,
      live("m1", "c1", "s1"),
    );
    const afterRest = mergeUnreadMentions(afterLive, [
      stored("m1", "c1", "s1"),
    ]);
    expect(unreadByChannel(afterRest)).toEqual({ c1: 1 });
    expect(afterRest).toBe(afterLive);
  });

  it("un evento repetido devuelve el mismo estado", () => {
    const once = addUnreadMention(NO_UNREAD_MENTIONS, live("m1", "c1", "s1"));
    expect(addUnreadMention(once, live("m1", "c1", "s1"))).toBe(once);
  });

  it("limpiar un canal saca solo sus menciones", () => {
    const state = mergeUnreadMentions(NO_UNREAD_MENTIONS, [
      stored("m1", "c1", "s1"),
      stored("m2", "c2", "s1"),
    ]);
    const cleared = clearChannelMentions(state, "c1");
    expect(unreadByChannel(cleared)).toEqual({ c2: 1 });
    expect(unreadByServer(cleared)).toEqual({ s1: 1 });
  });

  it("limpiar un canal sin menciones devuelve el mismo estado", () => {
    const state = mergeUnreadMentions(NO_UNREAD_MENTIONS, [
      stored("m1", "c1", "s1"),
    ]);
    expect(clearChannelMentions(state, "otro")).toBe(state);
  });

  it("no muta el estado anterior", () => {
    const state = mergeUnreadMentions(NO_UNREAD_MENTIONS, [
      stored("m1", "c1", "s1"),
    ]);
    addUnreadMention(state, live("m2", "c1", "s1"));
    expect(Object.keys(state)).toEqual(["m1"]);
  });
});

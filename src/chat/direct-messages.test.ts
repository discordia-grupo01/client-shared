import { describe, expect, it, vi } from "vitest";

import type {
  DirectConversation,
  NewDmPayload,
} from "../domain/direct-message";
import type { Member } from "../domain/member";
import type { Message } from "../domain/message";
import type { RealtimeChannel } from "./channel-chat";
import {
  activeConversationSummary,
  applyNewDm,
  conversationSummaries,
  dmCandidatesFrom,
  joinUserChannel,
  conversationReadKey,
  partnerIdsMissingProfile,
  withLocalReads,
  sendDirectMessage,
  unknownAuthor,
  upsertConversation,
} from "./direct-messages";

function message(id: string, userId: string): Message {
  return {
    id,
    channel_id: "c1",
    server_id: "",
    user_id: userId,
    content: id,
    inserted_at: "2026-10-01T12:00:00.000Z",
  };
}

function conversation(
  id: string,
  partnerId: string,
  extra: Partial<DirectConversation> = {},
): DirectConversation {
  return {
    id,
    partner_id: partnerId,
    unread: false,
    blocked_by_me: false,
    last_message_at: null,
    last_message: null,
    ...extra,
  };
}

const dm = (id: string, partnerId: string, userId: string): NewDmPayload => ({
  conversation_id: id,
  partner_id: partnerId,
  message: message("m1", userId),
});

describe("lista de conversaciones", () => {
  it("upsertConversation pone la conversacion primera y no la duplica", () => {
    const list = [conversation("a", "pa"), conversation("b", "pb")];
    const result = upsertConversation(
      list,
      conversation("b", "pb", { unread: true }),
    );
    expect(result.map((c) => c.id)).toEqual(["b", "a"]);
    expect(result[0].unread).toBe(true);
  });

  it("un new_dm del otro deja la conversacion sin leer", () => {
    const result = applyNewDm([], dm("a", "pa", "pa"), "me");
    expect(result[0]).toMatchObject({
      id: "a",
      partner_id: "pa",
      unread: true,
    });
    expect(result[0].last_message?.id).toBe("m1");
  });

  it("un new_dm propio no la deja sin leer, y conserva lo que ya estaba", () => {
    const list = [conversation("a", "pa", { unread: false })];
    expect(applyNewDm(list, dm("a", "pa", "me"), "me")[0].unread).toBe(false);

    const unread = [conversation("a", "pa", { unread: true })];
    expect(applyNewDm(unread, dm("a", "pa", "me"), "me")[0].unread).toBe(true);
  });

  it("withLocalReads marca leido lo ya leido, hasta que llega otro mensaje", () => {
    const summaries = conversationSummaries(
      [
        conversation("a", "pa", {
          unread: true,
          last_message: message("m1", "pa"),
        }),
        conversation("b", "pb", {
          unread: true,
          last_message: message("m2", "pb"),
        }),
      ],
      {},
      new Set(),
    );
    const read = new Set([
      conversationReadKey("a", "m1"),
      conversationReadKey("b", "otro"),
    ]);
    expect(withLocalReads(summaries, read).map((s) => s.isUnread)).toEqual([
      false,
      true,
    ]);
  });

  it("partnerIdsMissingProfile no repite ni pide lo ya conocido o pedido", () => {
    const list = [
      conversation("a", "pa"),
      conversation("b", "pb"),
      conversation("c", "pc"),
      conversation("d", "pa"),
    ];
    const known = { pb: unknownAuthor("pb") };
    expect(partnerIdsMissingProfile(list, known, new Set(["pc"]))).toEqual([
      "pa",
    ]);
  });
});

describe("resumenes", () => {
  const partners = { pa: { ...unknownAuthor("pa"), name: "Ana" } };

  it("arma el resumen con el perfil conocido y el bloqueo del usuario", () => {
    const [summary] = conversationSummaries(
      [conversation("a", "pa", { unread: true, blocked_by_me: false })],
      partners,
      new Set(["pa"]),
    );
    expect(summary).toMatchObject({
      conversationId: "a",
      isUnread: true,
      blockedByMe: true,
    });
    expect(summary.partner.name).toBe("Ana");
  });

  it("sin perfil conocido muestra 'Usuario desconocido'", () => {
    const [summary] = conversationSummaries(
      [conversation("a", "px")],
      {},
      new Set(),
    );
    expect(summary.partner.name).toBe("Usuario desconocido");
  });

  it("activeConversationSummary devuelve un borrador si nunca hablaron", () => {
    const draft = activeConversationSummary(
      "pa",
      [],
      partners,
      new Set(["pa"]),
    );
    expect(draft).toMatchObject({
      conversationId: null,
      lastMessage: null,
      isUnread: false,
      blockedByMe: true,
    });
    expect(draft.partner.name).toBe("Ana");
  });

  it("activeConversationSummary devuelve la conversacion existente", () => {
    const summaries = conversationSummaries(
      [conversation("a", "pa")],
      partners,
      new Set(),
    );
    expect(
      activeConversationSummary("pa", summaries, partners, new Set())
        .conversationId,
    ).toBe("a");
  });
});

describe("dmCandidatesFrom", () => {
  const member = (id: string, name?: string): Member => ({
    user_id: id,
    is_owner: false,
    joined_at: "",
    profile: name ? ({ name } as Member["profile"]) : null,
  });

  it("saca repetidos y al propio usuario, y ordena por nombre", () => {
    const result = dmCandidatesFrom(
      [
        member("me", "Yo"),
        member("b", "Beto"),
        member("a", "Ana"),
        member("b", "Beto"),
      ],
      "me",
      (m) => `url/${m.user_id}`,
    );
    expect(result.map((a) => a.name)).toEqual(["Ana", "Beto"]);
    expect(result[0].avatarUrl).toBe("url/a");
  });
});

class FakePush {
  hooks: Record<string, (response?: unknown) => void> = {};
  receive(status: string, callback: (response?: unknown) => void) {
    this.hooks[status] = callback;
    return this;
  }
}

function createRoom() {
  const events: Record<string, (payload: unknown) => void> = {};
  const closers: (() => void)[] = [];
  const joinPush = new FakePush();
  const pushes: { event: string; payload: object; push: FakePush }[] = [];
  return {
    events,
    closers,
    joinPush,
    pushes,
    on: vi.fn((event: string, cb: (payload: unknown) => void) => {
      events[event] = cb;
    }),
    onError: vi.fn((cb: () => void) => closers.push(cb)),
    onClose: vi.fn((cb: () => void) => closers.push(cb)),
    join: vi.fn(() => joinPush),
    push: vi.fn((event: string, payload: object) => {
      const push = new FakePush();
      pushes.push({ event, payload, push });
      return push;
    }),
  };
}

describe("joinUserChannel", () => {
  it("delega new_dm, los cortes y los joins (el primero se distingue)", () => {
    const room = createRoom();
    const handlers = {
      newDm: vi.fn(),
      connectionLost: vi.fn(),
      joined: vi.fn(),
    };
    joinUserChannel(room as unknown as RealtimeChannel, handlers);

    const payload = dm("a", "pa", "pa");
    room.events.new_dm(payload);
    room.closers.forEach((close) => close());
    room.joinPush.hooks.ok();
    room.joinPush.hooks.ok();

    expect(handlers.newDm).toHaveBeenCalledWith(payload);
    expect(handlers.connectionLost).toHaveBeenCalledTimes(2);
    expect(handlers.joined.mock.calls).toEqual([[true], [false]]);
  });
});

describe("sendDirectMessage", () => {
  it("valida el contenido sin tocar el canal", async () => {
    const room = createRoom();
    const result = await sendDirectMessage(
      room as unknown as RealtimeChannel,
      true,
      "pa",
      "   ",
      vi.fn(),
    );
    expect(result.ok).toBe(false);
    expect(room.push).not.toHaveBeenCalled();
  });

  it("manda send_dm y entrega la respuesta a onSent", async () => {
    const room = createRoom();
    const onSent = vi.fn();
    const result = sendDirectMessage(
      room as unknown as RealtimeChannel,
      true,
      "pa",
      "hola",
      onSent,
    );
    expect(room.pushes[0]).toMatchObject({
      event: "send_dm",
      payload: { to: "pa", content: "hola" },
    });
    const sent = { conversation_id: "a", message: message("m1", "me") };
    room.pushes[0].push.hooks.ok(sent);

    expect(await result).toEqual({ ok: true });
    expect(onSent).toHaveBeenCalledWith(sent);
  });

  it("DM_NOT_DELIVERED no revela que el otro te bloqueo", async () => {
    const room = createRoom();
    const result = sendDirectMessage(
      room as unknown as RealtimeChannel,
      true,
      "pa",
      "hola",
      vi.fn(),
    );
    room.pushes[0].push.hooks.error({ error: { code: "DM_NOT_DELIVERED" } });

    const resolved = await result;
    expect(resolved).toEqual({
      ok: false,
      message: "No se pudo entregar el mensaje.",
    });
  });

  it("sin sala unida falla sin mandar nada", async () => {
    const room = createRoom();
    const result = await sendDirectMessage(
      room as unknown as RealtimeChannel,
      false,
      "pa",
      "hola",
      vi.fn(),
    );
    expect(result.ok).toBe(false);
    expect(room.push).not.toHaveBeenCalled();
  });
});

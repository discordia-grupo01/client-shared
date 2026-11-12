import { describe, expect, it } from "vitest";

import type { NotificationHistoryItem } from "../domain/notification-history";
import {
  appendNotificationHistory,
  canRespondToTransfer,
  chunkNotificationIds,
  countUnreadNotifications,
  describeNotification,
  describeTransferNotification,
  filterNotificationHistory,
  groupNotificationHistory,
  isNotificationUnread,
  isNotificationVisible,
  isTransferNotification,
  markAllNotificationsRead,
  markNotificationGroupRead,
  NOTIFICATION_ALL_READ_KEY,
  NOTIFICATION_PREVIEW_MAX_LENGTH,
  notificationGroupKey,
  notificationPlace,
  notificationPreview,
  notificationUserIds,
} from "./notification-history";

const item = (
  messageId: string,
  overrides: Partial<NotificationHistoryItem> = {},
): NotificationHistoryItem => ({
  kind: "mention",
  message_id: messageId,
  author_id: "author",
  occurred_at: "2026-11-02T12:00:00Z",
  server_id: "s1",
  channel_id: "c1",
  conversation_id: null,
  ...overrides,
});

const directMessage = (messageId: string): NotificationHistoryItem =>
  item(messageId, {
    kind: "direct_message",
    server_id: null,
    channel_id: null,
    conversation_id: "conv-1",
  });

const servers = [
  { id: "s1", name: "Grupo 1", channels: [{ id: "c1", name: "general" }] },
];

describe("appendNotificationHistory", () => {
  it("agrega la pagina nueva al final, sin tocar lo anterior", () => {
    const result = appendNotificationHistory(
      [item("m3"), item("m2")],
      [item("m1")],
    );

    expect(result.map((entry) => entry.message_id)).toEqual(["m3", "m2", "m1"]);
  });

  it("no repite una entrada que llega en dos paginas", () => {
    const result = appendNotificationHistory(
      [item("m3"), item("m2")],
      [item("m2"), item("m1")],
    );

    expect(result.map((entry) => entry.message_id)).toEqual(["m3", "m2", "m1"]);
  });

  it("una pagina vacia deja todo igual", () => {
    const current = [item("m1")];

    expect(appendNotificationHistory(current, [])).toEqual(current);
  });

  it("no modifica los arrays que recibe", () => {
    const current = [item("m2")];
    const incoming = [item("m1")];

    appendNotificationHistory(current, incoming);

    expect(current).toHaveLength(1);
    expect(incoming).toHaveLength(1);
  });
});

describe("notificationPlace", () => {
  it("resuelve el nombre del servidor y del canal", () => {
    expect(notificationPlace(item("m1"), servers)).toEqual({
      serverName: "Grupo 1",
      channelName: "general",
    });
  });

  it("si el canal ya no esta, deja solo el servidor", () => {
    expect(
      notificationPlace(item("m1", { channel_id: "c9" }), servers),
    ).toEqual({ serverName: "Grupo 1", channelName: null });
  });

  it("si el servidor ya no esta, no inventa nombres", () => {
    expect(notificationPlace(item("m1", { server_id: "s9" }), servers)).toEqual(
      { serverName: null, channelName: null },
    );
  });

  it("un mensaje directo no tiene lugar", () => {
    expect(notificationPlace(directMessage("m1"), servers)).toEqual({
      serverName: null,
      channelName: null,
    });
  });
});

describe("describeNotification", () => {
  it("una mencion dice que te mencionaron", () => {
    expect(describeNotification(item("m1"))).toBe("te mencionó");
  });

  it("un mensaje directo dice que te enviaron un mensaje", () => {
    expect(describeNotification(directMessage("m1"))).toBe(
      "te envió un mensaje",
    );
  });
});

describe("filterNotificationHistory", () => {
  const items = [item("m3"), directMessage("m2"), item("m1")];

  it("todas devuelve todo en el mismo orden", () => {
    expect(
      filterNotificationHistory(items, "all").map((entry) => entry.message_id),
    ).toEqual(["m3", "m2", "m1"]);
  });

  it("menciones deja solo las menciones", () => {
    expect(
      filterNotificationHistory(items, "mentions").map(
        (entry) => entry.message_id,
      ),
    ).toEqual(["m3", "m1"]);
  });

  it("mensajes directos deja solo los directos", () => {
    expect(
      filterNotificationHistory(items, "direct_messages").map(
        (entry) => entry.message_id,
      ),
    ).toEqual(["m2"]);
  });

  it("sin entradas devuelve una lista vacia", () => {
    expect(filterNotificationHistory([], "mentions")).toEqual([]);
  });

  it("no leidos deja solo lo que no esta leido", () => {
    expect(
      filterNotificationHistory(
        items,
        "unread",
        (entry) => entry.kind === "direct_message",
      ).map((entry) => entry.message_id),
    ).toEqual(["m2"]);
  });

  it("sin informacion de lectura todo esta sin leer", () => {
    expect(filterNotificationHistory(items, "unread")).toHaveLength(3);
  });
});

describe("lo leido caduca a los 7 dias y lo no leido no", () => {
  const NOW = Date.parse("2026-11-10T12:00:00Z");
  const old = item("viejo", { occurred_at: "2026-11-03T11:59:59Z" });
  const edge = item("limite", { occurred_at: "2026-11-03T12:00:00Z" });
  const fresh = item("nuevo", { occurred_at: "2026-11-09T12:00:00Z" });
  const allRead = () => false;

  it("una leida de hace mas de 7 dias deja de verse", () => {
    expect(isNotificationVisible(old, allRead, NOW)).toBe(false);
  });

  it("justo a los 7 dias todavia se ve", () => {
    expect(isNotificationVisible(edge, allRead, NOW)).toBe(true);
  });

  it("una leida reciente se ve", () => {
    expect(isNotificationVisible(fresh, allRead, NOW)).toBe(true);
  });

  it("una sin leer se ve aunque sea vieja", () => {
    expect(isNotificationVisible(old, () => true, NOW)).toBe(true);
  });

  it("las pestañas de todas, menciones y directos esconden lo leido y viejo", () => {
    const entries = [
      fresh,
      old,
      { ...directMessage("dm-viejo"), occurred_at: old.occurred_at },
    ];

    expect(
      filterNotificationHistory(entries, "all", allRead, NOW).map(
        (e) => e.message_id,
      ),
    ).toEqual(["nuevo"]);
    expect(
      filterNotificationHistory(entries, "mentions", allRead, NOW),
    ).toHaveLength(1);
    expect(
      filterNotificationHistory(entries, "direct_messages", allRead, NOW),
    ).toHaveLength(0);
  });

  it("la pestaña de no leidos no depende de la fecha", () => {
    expect(
      filterNotificationHistory([old], "unread", () => true, NOW),
    ).toHaveLength(1);
  });

  it("lo viejo pero sin leer sigue en todas", () => {
    expect(
      filterNotificationHistory([old, fresh], "all", (e) => e === old, NOW).map(
        (e) => e.message_id,
      ),
    ).toEqual(["viejo", "nuevo"]);
  });
});

describe("groupNotificationHistory", () => {
  it("junta las menciones de un mismo canal y respeta el orden de llegada", () => {
    const groups = groupNotificationHistory([
      item("m4", { channel_id: "c1" }),
      item("m3", { channel_id: "c2" }),
      item("m2", { channel_id: "c1" }),
      item("m1", { channel_id: "c2" }),
    ]);

    expect(groups.map((group) => group.key)).toEqual([
      "channel:c1",
      "channel:c2",
    ]);
    expect(groups[0].items.map((entry) => entry.message_id)).toEqual([
      "m4",
      "m2",
    ]);
    expect(groups[1].items.map((entry) => entry.message_id)).toEqual([
      "m3",
      "m1",
    ]);
  });

  it("una mencion guarda el servidor y el canal del grupo", () => {
    const [group] = groupNotificationHistory([item("m1")]);

    expect(group).toMatchObject({
      kind: "mention",
      serverId: "s1",
      channelId: "c1",
      conversationId: null,
      partnerId: null,
    });
  });

  it("los mensajes directos se agrupan por conversacion y el otro es el autor", () => {
    const groups = groupNotificationHistory([
      { ...directMessage("m3"), author_id: "caro" },
      { ...directMessage("m2"), author_id: "beto", conversation_id: "conv-2" },
      { ...directMessage("m1"), author_id: "caro" },
    ]);

    expect(groups.map((group) => group.key)).toEqual([
      "dm:conv-1",
      "dm:conv-2",
    ]);
    expect(groups[0].items).toHaveLength(2);
    expect(groups[0]).toMatchObject({
      kind: "direct_message",
      partnerId: "caro",
      conversationId: "conv-1",
      serverId: null,
      channelId: null,
    });
  });

  it("un canal y una conversacion con el mismo id no se mezclan", () => {
    const groups = groupNotificationHistory([
      item("m2", { channel_id: "x" }),
      directMessage("m1"),
    ]);

    expect(groups).toHaveLength(2);
  });

  it("sin entradas no hay grupos", () => {
    expect(groupNotificationHistory([])).toEqual([]);
  });

  it("no modifica las entradas que recibe", () => {
    const entries = [item("m2"), item("m1")];

    groupNotificationHistory(entries);

    expect(entries).toHaveLength(2);
  });
});

describe("notificationGroupKey", () => {
  it("una mencion se identifica por su canal", () => {
    expect(notificationGroupKey(item("m1"))).toBe("channel:c1");
  });

  it("un mensaje directo se identifica por su conversacion", () => {
    expect(notificationGroupKey(directMessage("m1"))).toBe("dm:conv-1");
  });
});

describe("isNotificationUnread", () => {
  const entry = item("m1", { occurred_at: "2026-11-02T12:00:05Z" });

  it("sin marca todo esta sin leer", () => {
    expect(isNotificationUnread(entry, {})).toBe(true);
  });

  it("lo anterior a la marca de su canal esta leido", () => {
    expect(
      isNotificationUnread(entry, { "channel:c1": "2026-11-02T12:00:05Z" }),
    ).toBe(false);
    expect(
      isNotificationUnread(entry, { "channel:c1": "2026-11-02T13:00:00Z" }),
    ).toBe(false);
  });

  it("lo posterior a la marca sigue sin leer", () => {
    expect(
      isNotificationUnread(entry, { "channel:c1": "2026-11-02T12:00:04Z" }),
    ).toBe(true);
  });

  it("la marca de otro canal o de una conversacion no lo afecta", () => {
    expect(
      isNotificationUnread(entry, {
        "channel:c2": "2026-11-03T00:00:00Z",
        "dm:conv-1": "2026-11-03T00:00:00Z",
      }),
    ).toBe(true);
  });

  it("compara como fecha y no como texto", () => {
    expect(
      isNotificationUnread(
        item("m1", { occurred_at: "2026-11-02T12:00:00.500Z" }),
        { "channel:c1": "2026-11-02T12:00:00.123456Z" },
      ),
    ).toBe(true);
  });

  it("la marca global lo deja leido aunque su canal no tenga marca", () => {
    expect(
      isNotificationUnread(entry, {
        [NOTIFICATION_ALL_READ_KEY]: "2026-11-02T12:00:05Z",
      }),
    ).toBe(false);
  });

  it("alcanza con que una de las dos marcas lo cubra", () => {
    expect(
      isNotificationUnread(entry, {
        "channel:c1": "2026-11-02T12:00:00Z",
        [NOTIFICATION_ALL_READ_KEY]: "2026-11-02T12:00:09Z",
      }),
    ).toBe(false);
  });

  it("si ninguna lo cubre sigue sin leer", () => {
    expect(
      isNotificationUnread(entry, {
        "channel:c1": "2026-11-02T12:00:00Z",
        [NOTIFICATION_ALL_READ_KEY]: "2026-11-02T12:00:01Z",
      }),
    ).toBe(true);
  });
});

describe("countUnreadNotifications", () => {
  const items = [
    item("m3", { occurred_at: "2026-11-02T12:00:03Z" }),
    directMessage("m2"),
    item("m1", { occurred_at: "2026-11-02T12:00:01Z" }),
  ];

  it("cuenta lo que no esta leido", () => {
    expect(countUnreadNotifications(items, () => true)).toBe(3);
    expect(
      countUnreadNotifications(items, (entry) =>
        isNotificationUnread(entry, { "channel:c1": "2026-11-02T12:00:02Z" }),
      ),
    ).toBe(2);
  });

  it("sin entradas es cero", () => {
    expect(countUnreadNotifications([], () => true)).toBe(0);
  });
});

describe("markNotificationGroupRead", () => {
  it("agrega la marca sin tocar las otras", () => {
    const marks = { "dm:conv-1": "2026-11-02T10:00:00Z" };

    expect(
      markNotificationGroupRead(marks, "channel:c1", "2026-11-02T12:00:00Z"),
    ).toEqual({
      "dm:conv-1": "2026-11-02T10:00:00Z",
      "channel:c1": "2026-11-02T12:00:00Z",
    });
    expect(marks).toEqual({ "dm:conv-1": "2026-11-02T10:00:00Z" });
  });

  it("nunca retrocede una marca", () => {
    const marks = { "channel:c1": "2026-11-02T12:00:00Z" };

    expect(
      markNotificationGroupRead(marks, "channel:c1", "2026-11-02T11:00:00Z"),
    ).toBe(marks);
  });

  it("avanza una marca vieja", () => {
    expect(
      markNotificationGroupRead(
        { "channel:c1": "2026-11-02T10:00:00Z" },
        "channel:c1",
        "2026-11-02T12:00:00Z",
      ),
    ).toEqual({ "channel:c1": "2026-11-02T12:00:00Z" });
  });
});

describe("markAllNotificationsRead", () => {
  const now = "2026-11-02T12:00:10Z";

  it("deja todo leido, canales y conversaciones, con una sola marca", () => {
    const items = [item("m2"), directMessage("m1")];

    const marks = markAllNotificationsRead({}, items, now);

    expect(
      countUnreadNotifications(items, (entry) =>
        isNotificationUnread(entry, marks),
      ),
    ).toBe(0);
    expect(Object.keys(marks)).toEqual([NOTIFICATION_ALL_READ_KEY]);
  });

  it("tambien deja leido lo que todavia no se cargo si ocurrio antes", () => {
    const marks = markAllNotificationsRead({}, [], now);

    expect(
      isNotificationUnread(
        item("viejo", { occurred_at: "2026-11-01T08:00:00Z" }),
        marks,
      ),
    ).toBe(false);
  });

  it("reemplaza las marcas por canal, que ya no hacen falta", () => {
    const marks = markAllNotificationsRead(
      { "channel:c1": "2026-11-02T11:00:00Z" },
      [item("m1")],
      now,
    );

    expect(Object.keys(marks)).toEqual([NOTIFICATION_ALL_READ_KEY]);
  });

  it("si una entrada es posterior al reloj del cliente igual queda leida", () => {
    const future = item("m1", { occurred_at: "2026-11-02T12:05:00Z" });

    const marks = markAllNotificationsRead({}, [future], now);

    expect(isNotificationUnread(future, marks)).toBe(false);
  });

  it("lo que llega despues sigue sin leer", () => {
    const marks = markAllNotificationsRead({}, [item("m1")], now);

    expect(
      isNotificationUnread(
        item("m2", { occurred_at: "2026-11-02T12:00:11Z" }),
        marks,
      ),
    ).toBe(true);
  });

  it("no retrocede una marca global mas nueva", () => {
    const marks = { [NOTIFICATION_ALL_READ_KEY]: "2026-11-02T13:00:00Z" };

    expect(markAllNotificationsRead(marks, [item("m1")], now)).toBe(marks);
  });
});

describe("notificationPreview", () => {
  const nameOf = (kind: "user" | "role", id: string) =>
    kind === "user" && id === "ana" ? "Ana" : null;

  it("devuelve el texto del mensaje", () => {
    expect(notificationPreview({ content: "hola a todos" }, nameOf)).toBe(
      "hola a todos",
    );
  });

  it("deja los simbolos de formato tal cual", () => {
    expect(
      notificationPreview({ content: "**hola** <@ana> ~~chau~~" }, nameOf),
    ).toBe("**hola** @Ana ~~chau~~");
  });

  it("reemplaza la mencion por el nombre cuando se conoce", () => {
    expect(
      notificationPreview({ content: "hola <@ana> mirá esto" }, nameOf),
    ).toBe("hola @Ana mirá esto");
  });

  it("una mencion desconocida no deja el id a la vista", () => {
    expect(notificationPreview({ content: "hola <@zzz>" }, nameOf)).toBe(
      "hola @usuario",
    );
    expect(
      notificationPreview(
        { content: "<@&0a1b2c3d-0000-4000-8000-000000000000> reunion" },
        nameOf,
      ),
    ).toBe("@rol reunion");
  });

  it("junta saltos de linea y espacios repetidos", () => {
    expect(
      notificationPreview({ content: "  uno\n\n  dos   tres \n" }, nameOf),
    ).toBe("uno dos tres");
  });

  it("recorta un texto largo y agrega puntos suspensivos", () => {
    const preview = notificationPreview(
      { content: "a".repeat(NOTIFICATION_PREVIEW_MAX_LENGTH + 50) },
      nameOf,
    );

    expect(preview).toBe(`${"a".repeat(NOTIFICATION_PREVIEW_MAX_LENGTH)}…`);
  });

  it("un texto justo en el limite no se recorta", () => {
    const content = "b".repeat(NOTIFICATION_PREVIEW_MAX_LENGTH);

    expect(notificationPreview({ content }, nameOf)).toBe(content);
  });

  it("sin texto pero con adjuntos lo dice", () => {
    expect(
      notificationPreview(
        {
          content: "   ",
          attachments: [
            {
              id: "a",
              url: "u",
              name: "f.png",
              content_type: "image/png",
              size: 1,
            },
          ],
        },
        nameOf,
      ),
    ).toBe("Archivo adjunto");
  });

  it("sin texto ni adjuntos no hay vista previa", () => {
    expect(notificationPreview({ content: "" }, nameOf)).toBeNull();
  });

  it("sin mensaje no hay vista previa", () => {
    expect(notificationPreview(undefined, nameOf)).toBeNull();
    expect(notificationPreview(null, nameOf)).toBeNull();
  });
});

describe("chunkNotificationIds", () => {
  it("parte la lista en tandas del tamano pedido", () => {
    expect(chunkNotificationIds(["a", "b", "c", "d", "e"], 2)).toEqual([
      ["a", "b"],
      ["c", "d"],
      ["e"],
    ]);
  });

  it("por defecto usa el maximo que acepta el back", () => {
    const ids = Array.from({ length: 51 }, (_, i) => `m${i}`);

    expect(chunkNotificationIds(ids).map((chunk) => chunk.length)).toEqual([
      50, 1,
    ]);
  });

  it("sin ids no hay tandas", () => {
    expect(chunkNotificationIds([])).toEqual([]);
  });
});

const transfer = (
  transferId: string,
  overrides: Partial<NotificationHistoryItem> = {},
): NotificationHistoryItem =>
  item(transferId, {
    kind: "ownership_transfer",
    author_id: "owner",
    to_user_id: "member",
    transfer_status: "pending",
    channel_id: null,
    ...overrides,
  });

const nameOf = (id: string): string | null =>
  ({ owner: "Ana", member: "Beto" })[id] ?? null;

describe("transferencia de propiedad", () => {
  it("se reconoce por su tipo", () => {
    expect(isTransferNotification(transfer("t1"))).toBe(true);
    expect(isTransferNotification(item("m1"))).toBe(false);
    expect(isTransferNotification(directMessage("m1"))).toBe(false);
  });

  it("cada transferencia es su propio grupo y no se mezcla con un canal", () => {
    expect(notificationGroupKey(transfer("t1"))).toBe("transfer:t1");
    expect(notificationGroupKey(transfer("t2"))).toBe("transfer:t2");

    const groups = groupNotificationHistory([
      transfer("t1"),
      item("m1", { channel_id: "t1" }),
    ]);

    expect(groups.map((group) => group.key)).toEqual([
      "transfer:t1",
      "channel:t1",
    ]);
    expect(groups[0]).toMatchObject({
      kind: "ownership_transfer",
      channelId: null,
      conversationId: null,
      partnerId: null,
    });
  });

  it("aparece en no leidas y en todas, pero no en menciones ni en directos", () => {
    const items = [transfer("t1"), item("m1"), directMessage("m2")];

    expect(
      filterNotificationHistory(items, "all").map((entry) => entry.message_id),
    ).toEqual(["t1", "m1", "m2"]);
    expect(
      filterNotificationHistory(items, "unread").map(
        (entry) => entry.message_id,
      ),
    ).toEqual(["t1", "m1", "m2"]);
    expect(
      filterNotificationHistory(items, "mentions").map(
        (entry) => entry.message_id,
      ),
    ).toEqual(["m1"]);
    expect(
      filterNotificationHistory(items, "direct_messages").map(
        (entry) => entry.message_id,
      ),
    ).toEqual(["m2"]);
  });

  it("se lee con una marca propia y no con la de un canal", () => {
    const entry = transfer("t1");

    expect(isNotificationUnread(entry, {})).toBe(true);
    expect(
      isNotificationUnread(entry, { "channel:t1": "2026-11-03T00:00:00Z" }),
    ).toBe(true);
    expect(
      isNotificationUnread(entry, { "transfer:t1": "2026-11-03T00:00:00Z" }),
    ).toBe(false);
  });

  it("pide los nombres del dueño y del receptor, sin repetir", () => {
    expect(notificationUserIds(transfer("t1"))).toEqual(["owner", "member"]);
    expect(notificationUserIds(item("m1"))).toEqual(["author"]);
    expect(
      notificationUserIds(transfer("t1", { to_user_id: "owner" })),
    ).toEqual(["owner"]);
  });

  describe("canRespondToTransfer", () => {
    it("solo el receptor puede responder y solo mientras esta pendiente", () => {
      expect(canRespondToTransfer(transfer("t1"), "member")).toBe(true);
      expect(canRespondToTransfer(transfer("t1"), "owner")).toBe(false);
      expect(canRespondToTransfer(transfer("t1"), null)).toBe(false);
      expect(canRespondToTransfer(transfer("t1"), undefined)).toBe(false);

      for (const status of [
        "accepted",
        "rejected",
        "cancelled",
        "expired",
      ] as const) {
        expect(
          canRespondToTransfer(
            transfer("t1", { transfer_status: status }),
            "member",
          ),
        ).toBe(false);
      }
    });

    it("una mencion o un directo nunca se responden", () => {
      expect(canRespondToTransfer(item("m1"), "member")).toBe(false);
      expect(canRespondToTransfer(directMessage("m1"), "member")).toBe(false);
    });
  });

  describe("describeTransferNotification", () => {
    const text = (
      status: NotificationHistoryItem["transfer_status"],
      meId: string,
      server: string | null = "Grupo 1",
    ) =>
      describeTransferNotification(
        transfer("t1", { transfer_status: status }),
        meId,
        nameOf,
        server,
      );

    it("al receptor le dice que le ofrecieron la propiedad", () => {
      expect(text("pending", "member")).toBe(
        "Ana te ofreció la propiedad de Grupo 1",
      );
    });

    it("al receptor le deja dicho como terminó", () => {
      expect(text("accepted", "member")).toBe(
        "Aceptaste ser el nuevo dueño de Grupo 1",
      );
      expect(text("rejected", "member")).toBe(
        "Rechazaste ser el nuevo dueño de Grupo 1",
      );
      expect(text("cancelled", "member")).toBe(
        "Ana canceló el ofrecimiento de Grupo 1",
      );
      expect(text("expired", "member")).toBe(
        "El ofrecimiento de Grupo 1 venció",
      );
    });

    it("al dueño le cuenta la respuesta", () => {
      expect(text("accepted", "owner")).toBe(
        "Beto aceptó ser el nuevo dueño de Grupo 1",
      );
      expect(text("rejected", "owner")).toBe(
        "Beto rechazó ser el nuevo dueño de Grupo 1",
      );
      expect(text("expired", "owner")).toBe(
        "Beto no respondió: el ofrecimiento de Grupo 1 venció",
      );
    });

    it("sin nombres no inventa ninguno", () => {
      expect(
        describeTransferNotification(
          transfer("t1"),
          "member",
          () => null,
          null,
        ),
      ).toBe("Alguien te ofreció la propiedad de un servidor");
    });
  });
});

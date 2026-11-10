import { describe, expect, it } from "vitest";

import type { ApiResult } from "./api-result";
import {
  canReportMessage,
  canReportUser,
  createReportBody,
  hasModeratorPermissions,
  isModerator,
  PENDING_REPORTS_COUNT_QUERY,
  pendingReportsTotalFrom,
  type ReportListResponse,
  reportsQuery,
} from "./report";

describe("isModerator", () => {
  it("exige los tres permisos juntos, como el back", () => {
    expect(
      isModerator(["MANAGE_MESSAGES", "KICK_MEMBERS", "BAN_MEMBERS"]),
    ).toBe(true);
    expect(isModerator(["MANAGE_MESSAGES", "KICK_MEMBERS"])).toBe(false);
    expect(isModerator(["BAN_MEMBERS"])).toBe(false);
    expect(isModerator([])).toBe(false);
  });

  it("un administrador lo es aunque llegue solo ese bit", () => {
    expect(isModerator(["ADMINISTRATOR"])).toBe(true);
  });
});

describe("hasModeratorPermissions", () => {
  it("vale la union de los roles propios", () => {
    expect(
      hasModeratorPermissions({
        isOwner: false,
        roles: [
          { permissions: ["MANAGE_MESSAGES"] },
          { permissions: ["KICK_MEMBERS", "BAN_MEMBERS"] },
        ],
      }),
    ).toBe(true);
  });

  it("el dueño siempre es moderador", () => {
    expect(hasModeratorPermissions({ isOwner: true, roles: [] })).toBe(true);
  });

  it("con dos de los tres no alcanza", () => {
    expect(
      hasModeratorPermissions({
        isOwner: false,
        roles: [{ permissions: ["MANAGE_MESSAGES", "KICK_MEMBERS"] }],
      }),
    ).toBe(false);
  });
});

describe("canReportMessage", () => {
  it("solo mensajes ya enviados de otra persona", () => {
    expect(canReportMessage({ authorId: "beto", currentUserId: "ana" })).toBe(
      true,
    );
    expect(canReportMessage({ authorId: "ana", currentUserId: "ana" })).toBe(
      false,
    );
    expect(
      canReportMessage({
        authorId: "beto",
        currentUserId: "ana",
        delivery: "failed",
      }),
    ).toBe(false);
    expect(canReportMessage({ authorId: "beto", currentUserId: null })).toBe(
      false,
    );
  });
});

describe("canReportUser", () => {
  it("a cualquiera menos a uno mismo", () => {
    expect(canReportUser("beto", "ana")).toBe(true);
    expect(canReportUser("ana", "ana")).toBe(false);
    expect(canReportUser("beto", null)).toBe(false);
  });
});

describe("createReportBody", () => {
  it("arma el body en snake_case segun el tipo", () => {
    expect(
      createReportBody({
        kind: "message",
        channelId: "c1",
        messageId: "m1",
        reason: "Spam",
      }),
    ).toEqual({
      kind: "message",
      channel_id: "c1",
      message_id: "m1",
      reason: "Spam",
    });
    expect(
      createReportBody({ kind: "user", userId: "u1", reason: "Spam" }),
    ).toEqual({ kind: "user", user_id: "u1", reason: "Spam" });
  });
});

describe("reportsQuery", () => {
  it("pide por estado exacto y con offset", () => {
    expect(reportsQuery({ status: "resolved", limit: 20, offset: 40 })).toBe(
      "status=resolved&limit=20&offset=40",
    );
    expect(PENDING_REPORTS_COUNT_QUERY).toBe("status=pending&limit=1&offset=0");
  });
});

describe("pendingReportsTotalFrom", () => {
  const ok = (total: number): ApiResult<ReportListResponse> => ({
    ok: true,
    status: 200,
    data: { reports: [], total, limit: 1, offset: 0 },
  });
  const failure = (status: number): ApiResult<ReportListResponse> => ({
    ok: false,
    status,
    code: status,
    message: "",
  });

  it("devuelve el total del back", () => {
    expect(pendingReportsTotalFrom(ok(3))).toBe(3);
  });

  it("un 403 es no mostrar el puntito, no un error", () => {
    expect(pendingReportsTotalFrom(failure(403))).toBe(0);
  });

  it("cualquier otro fallo conserva el valor anterior", () => {
    expect(pendingReportsTotalFrom(failure(500))).toBeNull();
    expect(pendingReportsTotalFrom(failure(0))).toBeNull();
  });
});

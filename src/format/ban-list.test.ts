import { describe, expect, it } from "vitest";

import type { Ban } from "../domain/ban";
import type { Member } from "../domain/member";

import {
  banListItems,
  eligibleBanCandidates,
  memberListItems,
} from "./ban-list";
import { filterByDisplayName } from "./user-list";

const profileOf = (name: string) => ({
  name,
  avatar_url: "",
  description: "",
  status_text: "",
  status_emoji: "",
});

const member = (user_id: string, name?: string): Member => ({
  user_id,
  is_owner: false,
  joined_at: "",
  profile: name ? profileOf(name) : null,
});

describe("eligibleBanCandidates", () => {
  it("excluye al propietario y a uno mismo", () => {
    const members = [member("owner"), member("me"), member("other")];
    expect(
      eligibleBanCandidates(members, "owner", "me").map((m) => m.user_id),
    ).toEqual(["other"]);
  });
});

describe("banListItems", () => {
  const ban = (reason: string | null): Ban => ({
    server_id: "s",
    user_id: "u",
    reason,
    banned_by: null,
    banned_at: "",
    profile: profileOf("Nova"),
  });

  it("usa el motivo como detalle o un texto por defecto", () => {
    expect(banListItems([ban("spam")])[0].subtitle).toBe("spam");
    expect(banListItems([ban(null)])[0].subtitle).toBe("Sin motivo indicado");
  });
});

describe("filterByDisplayName", () => {
  it("busca por nombre sin tildes y mantiene a los que no tienen perfil fuera", () => {
    const items = memberListItems([member("a", "Andrés"), member("b")]);
    expect(filterByDisplayName(items, "andres").map((i) => i.userId)).toEqual([
      "a",
    ]);
    expect(filterByDisplayName(items, "")).toHaveLength(2);
  });
});

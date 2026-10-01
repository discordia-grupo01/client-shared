import { describe, expect, it } from "vitest";

import type { MemberProfile } from "../domain/member";
import type { PublicUser } from "../domain/user";

import {
  displayNameOf,
  memberProfileOf,
  userIdsMissingProfile,
  withFetchedProfiles,
} from "./profile";

const profile: MemberProfile = {
  name: "Nova",
  avatar_url: "",
  description: "",
  status_text: "",
  status_emoji: "",
};

describe("displayNameOf", () => {
  it("usa el nombre del perfil o cae a usuario desconocido", () => {
    expect(displayNameOf(profile)).toBe("Nova");
    expect(displayNameOf(null)).toBe("Usuario desconocido");
    expect(displayNameOf(undefined)).toBe("Usuario desconocido");
  });
});

describe("memberProfileOf", () => {
  it("se queda solo con los campos del perfil", () => {
    const user: PublicUser = {
      id: "u1",
      ...profile,
      mutual_server_ids: ["s1"],
    };
    expect(memberProfileOf(user)).toEqual(profile);
  });
});

describe("userIdsMissingProfile", () => {
  it("devuelve los ids sin perfil, sin repetir ni volver a pedir", () => {
    const users = [
      { user_id: "a", profile },
      { user_id: "b", profile: null },
      { user_id: "b" },
      { user_id: "c", profile: null },
    ];
    expect(userIdsMissingProfile(users, new Set(["c"]))).toEqual(["b"]);
  });
});

describe("withFetchedProfiles", () => {
  it("completa solo los perfiles que faltan", () => {
    const own = { ...profile, name: "Propio" };
    const users = [
      { user_id: "a", profile: own },
      { user_id: "b", profile: null },
      { user_id: "c", profile: null },
    ];
    const result = withFetchedProfiles(users, { a: profile, b: profile });
    expect(result[0].profile).toBe(own);
    expect(result[1].profile).toBe(profile);
    expect(result[2].profile).toBeNull();
  });
});

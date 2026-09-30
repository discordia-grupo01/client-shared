import { describe, expect, it } from "vitest";

import { BAN_REASON_MAX_LENGTH } from "../constants/limits";

import { validateBanReason } from "./ban";

describe("validateBanReason", () => {
  it("el motivo es opcional", () => {
    expect(validateBanReason("")).toBeUndefined();
  });

  it("acepta hasta el maximo", () => {
    expect(
      validateBanReason("a".repeat(BAN_REASON_MAX_LENGTH)),
    ).toBeUndefined();
  });

  it("rechaza pasarse del maximo", () => {
    expect(validateBanReason("a".repeat(BAN_REASON_MAX_LENGTH + 1))).toMatch(
      /512/,
    );
  });

  it("cuenta un emoji como un solo caracter", () => {
    expect(
      validateBanReason("😀".repeat(BAN_REASON_MAX_LENGTH)),
    ).toBeUndefined();
  });

  it("ignora los espacios de los extremos, como hace el back", () => {
    expect(
      validateBanReason(`  ${"a".repeat(BAN_REASON_MAX_LENGTH)}  `),
    ).toBeUndefined();
  });
});

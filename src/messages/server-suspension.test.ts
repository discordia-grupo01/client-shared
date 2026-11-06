import { describe, expect, it } from "vitest";

import { serverSuspendedLabel } from "./server-suspension";

describe("serverSuspendedLabel", () => {
  it("agrega que está suspendido al nombre", () => {
    expect(serverSuspendedLabel("Truchos SA")).toBe("Truchos SA, suspendido");
  });
});

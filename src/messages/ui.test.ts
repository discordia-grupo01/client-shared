import { describe, expect, it } from "vitest";

import { serverIconFormatsHint } from "./ui";

describe("formatos del ícono del servidor", () => {
  it("sin el nivel 1 no ofrece GIF", () => {
    expect(serverIconFormatsHint(0)).not.toContain("GIF");
    expect(serverIconFormatsHint()).toBe(serverIconFormatsHint(0));
  });

  it("desde el nivel 1 suma GIF", () => {
    expect(serverIconFormatsHint(1)).toMatch(/ o GIF · Máx\. 5 MB$/);
  });
});

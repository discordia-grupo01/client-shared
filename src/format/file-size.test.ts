import { describe, expect, it } from "vitest";

import { formatFileSize } from "./file-size";

describe("formatFileSize", () => {
  it("formatea cada unidad", () => {
    expect(formatFileSize(500)).toBe("500 B");
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(10 * 1024 * 1024)).toBe("10.0 MB");
  });
});

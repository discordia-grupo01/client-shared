import { describe, expect, it } from "vitest";

import { hexToRgba, isValidHex } from "./color";

describe("isValidHex", () => {
  it("acepta #RRGGBB en mayusculas y minusculas", () => {
    expect(isValidHex("#38A169")).toBe(true);
    expect(isValidHex("#e05252")).toBe(true);
  });

  it("rechaza el formato corto #RGB, que el back no acepta", () => {
    expect(isValidHex("#fff")).toBe(false);
  });

  it("rechaza lo que no es un hex", () => {
    expect(isValidHex("38A169")).toBe(false);
    expect(isValidHex("#38A16")).toBe(false);
    expect(isValidHex("#38A1699")).toBe(false);
    expect(isValidHex("#GGGGGG")).toBe(false);
    expect(isValidHex("")).toBe(false);
    expect(isValidHex("red")).toBe(false);
  });
});

describe("hexToRgba", () => {
  it("convierte a rgba", () => {
    expect(hexToRgba("#000000", 1)).toBe("rgba(0, 0, 0, 1)");
    expect(hexToRgba("#ffffff", 0.5)).toBe("rgba(255, 255, 255, 0.5)");
    expect(hexToRgba("#38A169", 0.2)).toBe("rgba(56, 161, 105, 0.2)");
  });
});

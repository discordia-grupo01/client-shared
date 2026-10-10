import { describe, expect, it } from "vitest";

import {
  LOGO_COLORS,
  LOGO_ISOTYPE,
  LOGO_TAGLINE_PATH,
  LOGO_WORD_PATHS,
} from "./logo";

describe("logo", () => {
  it("tiene un trazo por letra de 'discordia'", () => {
    expect(LOGO_WORD_PATHS).toHaveLength("discordia".length);
    for (const path of LOGO_WORD_PATHS) expect(path.startsWith("M")).toBe(true);
  });

  it("tiene el eslogan y los bloques que se animan", () => {
    expect(LOGO_TAGLINE_PATH.length).toBeGreaterThan(0);
    expect(LOGO_ISOTYPE.blocks).toHaveLength(3);
    expect(LOGO_ISOTYPE.cablePaths).toHaveLength(2);
  });

  it("define los mismos colores en los dos temas", () => {
    expect(Object.keys(LOGO_COLORS.light)).toEqual(
      Object.keys(LOGO_COLORS.dark),
    );
  });
});

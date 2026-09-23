import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { THEME_CSS_VARS } from "./tokens";

const css = readFileSync(join(__dirname, "../../theme.css"), "utf8");

describe("theme.css", () => {
  it("solo referencia variables que existen en los tokens", () => {
    const known = new Set<string>(Object.values(THEME_CSS_VARS));
    const used = [...css.matchAll(/var\((--[\w-]+)\)/g)].map((m) => m[1]);
    expect(used.length).toBeGreaterThan(0);
    expect(used.filter((name) => !known.has(name))).toEqual([]);
  });

  it("expone una clase para cada token", () => {
    const used = new Set(
      [...css.matchAll(/var\((--[\w-]+)\)/g)].map((m) => m[1]),
    );
    const missing = Object.values(THEME_CSS_VARS).filter(
      (name) => !used.has(name),
    );
    expect(missing).toEqual([]);
  });
});

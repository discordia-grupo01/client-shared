import { describe, expect, it } from "vitest";

import {
  DEFAULT_THEME,
  THEME_CSS_VARS,
  THEMES,
  themeToCss,
  themeVars,
} from "./tokens";

describe("design tokens", () => {
  it("todos los temas definen los mismos tokens", () => {
    const keys = Object.keys(THEMES.dark).sort();
    expect(Object.keys(THEMES.light).sort()).toEqual(keys);
    expect(Object.keys(THEME_CSS_VARS).sort()).toEqual(keys);
  });

  it("no repite nombres de variable CSS", () => {
    const names = Object.values(THEME_CSS_VARS);
    expect(new Set(names).size).toBe(names.length);
  });

  it("themeVars mapea cada token a su variable CSS", () => {
    const vars = themeVars("light");
    expect(vars["--accent"]).toBe(THEMES.light.accent);
    expect(vars["--text-2"]).toBe(THEMES.light.textMuted);
    expect(Object.keys(vars)).toHaveLength(Object.keys(THEME_CSS_VARS).length);
  });

  it("themeToCss vuelca el tema por defecto en :root y cada tema en su selector", () => {
    const css = themeToCss();
    expect(css).toContain(
      `:root {\n  --accent: ${THEMES[DEFAULT_THEME].accent};`,
    );
    expect(css).toContain(`[data-theme="light"] {`);
    expect(css).toContain(`--text-2: ${THEMES.light.textMuted};`);
  });
});

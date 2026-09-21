/**
 * Design tokens compartidos entre web-client y app-mobile. Portados del
 * prototipo de Figma; antes estaban duplicados en `globals.css` (web) y en
 * `theme/colors.ts` (mobile).
 *
 * Solo son valores: cada app decide como aplicarlos. Web los vuelca como
 * variables CSS (ver `themeToCss`) y Tailwind los consume desde ahi. Mobile
 * usa el objeto directo con StyleSheet.
 */

export type ThemeName = "dark" | "light";

export const THEME_NAMES: readonly ThemeName[] = ["dark", "light"];

export const DEFAULT_THEME: ThemeName = "dark";

export interface ThemeColors {
  accent: string;
  accentBright: string;
  accentGradientStart: string;
  accentGradientEnd: string;
  /** Texto e iconos sobre fondos `accent` o `danger`. */
  onAccent: string;
  highlight: string;
  sky: string;
  success: string;
  info: string;
  danger: string;
  dangerBright: string;

  bgServers: string;
  bgChannels: string;
  bgChat: string;
  bgHover: string;
  bgUserPanel: string;
  bgInput: string;
  bgCard: string;
  bgModal: string;

  text: string;
  textMuted: string;
  textSubtle: string;

  border: string;
  borderStrong: string;
}

const dark: ThemeColors = {
  accent: "#245c6b",
  accentBright: "#2d7a8c",
  accentGradientStart: "#245c6b",
  accentGradientEnd: "#1a4050",
  onAccent: "#ffffff",
  highlight: "#fce3a4",
  sky: "#a8c6df",
  success: "#38a169",
  info: "#6b95bd",
  danger: "#e05252",
  dangerBright: "#ff5c5c",

  bgServers: "#0f1922",
  bgChannels: "#1c293b",
  bgChat: "#1e2d42",
  bgHover: "#273d52",
  bgUserPanel: "#111e2c",
  bgInput: "rgba(168, 198, 223, 0.07)",
  bgCard: "#1a2e40",
  bgModal: "#162435",

  text: "#f5f2eb",
  textMuted: "#a8c6df",
  textSubtle: "rgba(168, 198, 223, 0.45)",

  border: "rgba(168, 198, 223, 0.08)",
  borderStrong: "rgba(168, 198, 223, 0.18)",
};

const light: ThemeColors = {
  accent: "#245c6b",
  accentBright: "#1d4e5a",
  accentGradientStart: "#245c6b",
  accentGradientEnd: "#1d4e5a",
  onAccent: "#ffffff",
  highlight: "#e8a800",
  sky: "#6b95bd",
  success: "#38a169",
  info: "#6b95bd",
  danger: "#c0392b",
  dangerBright: "#e05252",

  bgServers: "#245c6b",
  bgChannels: "#e8e4da",
  bgChat: "#f5f2eb",
  bgHover: "#ddd9cf",
  bgUserPanel: "#d5d1c6",
  bgInput: "rgba(36, 92, 107, 0.07)",
  bgCard: "#ffffff",
  bgModal: "#ffffff",

  text: "#18181b",
  textMuted: "#245c6b",
  textSubtle: "rgba(36, 92, 107, 0.5)",

  border: "rgba(36, 92, 107, 0.12)",
  borderStrong: "rgba(36, 92, 107, 0.22)",
};

export const THEMES: Record<ThemeName, ThemeColors> = { dark, light };

/**
 * Nombre de la variable CSS de cada token. Se respetan los nombres que ya
 * usaba web (`--text-2`, `--bg-chat`, ...) para no tocar el puente de Tailwind.
 */
export const THEME_CSS_VARS: Record<keyof ThemeColors, string> = {
  accent: "--accent",
  accentBright: "--accent-bright",
  accentGradientStart: "--accent-gradient-start",
  accentGradientEnd: "--accent-gradient-end",
  onAccent: "--on-accent",
  highlight: "--highlight",
  sky: "--sky",
  success: "--success",
  info: "--info",
  danger: "--danger",
  dangerBright: "--danger-bright",

  bgServers: "--bg-servers",
  bgChannels: "--bg-channels",
  bgChat: "--bg-chat",
  bgHover: "--bg-hover",
  bgUserPanel: "--bg-user-panel",
  bgInput: "--bg-input",
  bgCard: "--bg-card",
  bgModal: "--bg-modal",

  text: "--text",
  textMuted: "--text-2",
  textSubtle: "--text-3",

  border: "--border",
  borderStrong: "--border-strong",
};

/**
 * Las variables CSS de un tema como objeto: `{ "--accent": "#245c6b", ... }`.
 * Mobile se lo pasa a NativeWind (`VariableContextProvider`) para cambiar de
 * tema en runtime.
 */
export function themeVars(name: ThemeName): Record<string, string> {
  const colors = THEMES[name];
  const vars: Record<string, string> = {};
  for (const key of Object.keys(THEME_CSS_VARS) as (keyof ThemeColors)[]) {
    vars[THEME_CSS_VARS[key]] = colors[key];
  }
  return vars;
}

function declarations(name: ThemeName): string {
  return Object.entries(themeVars(name))
    .map(([cssVar, value]) => `  ${cssVar}: ${value};`)
    .join("\n");
}

/**
 * Hoja de estilos con las variables de todos los temas. `:root` lleva el tema
 * por defecto y cada tema se activa con `[data-theme="<nombre>"]` en un
 * ancestro (normalmente `<html>`).
 */
export function themeToCss(): string {
  const blocks = [`:root {\n${declarations(DEFAULT_THEME)}\n}`];
  for (const name of THEME_NAMES) {
    blocks.push(`[data-theme="${name}"] {\n${declarations(name)}\n}`);
  }
  return blocks.join("\n\n");
}

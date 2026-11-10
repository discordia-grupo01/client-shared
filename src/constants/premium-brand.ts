/**
 * Íconos de marca de Facturación (Premium, puntos e insignia), sacados del
 * manual de marca (`logos.png`). Acá viven los datos; cada app los dibuja con
 * su SVG (`<svg>` en web, `react-native-svg` en mobile).
 */

/**
 * Colores fijos en los dos temas, por eso no están en `THEMES`. El amarillo es
 * el acento de todo lo Premium: el `warning` del tema claro es más oscuro y el
 * botón se veía apagado.
 */
export const PREMIUM_BRAND_COLORS = {
  deep: "#1C293B",
  petrol: "#245C6B",
  sky: "#A8C6DF",
  steel: "#6B95BD",
  yellow: "#F0B232",
  paper: "#F5F2EB",
} as const;

export type PremiumBrandColor = keyof typeof PREMIUM_BRAND_COLORS;

export interface BrandViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BrandRect {
  x: number;
  y: number;
  width: number;
  height: number;
  rx: number;
  fill: PremiumBrandColor;
}

export interface BrandStroke {
  d: string;
  stroke: PremiumBrandColor;
  strokeWidth: number;
}

export interface BrandCircle {
  cx: number;
  cy: number;
  r: number;
  fill: PremiumBrandColor;
}

/** Tres bloques del logo y el conector. Se dibuja en este orden. */
export const PREMIUM_ICON = {
  viewBox: { x: 0, y: 0, width: 24, height: 24 },
  blocks: [
    { x: 5, y: 14, width: 7, height: 7, rx: 1.2, fill: "petrol" },
    { x: 5, y: 6, width: 7, height: 7, rx: 1.2, fill: "sky" },
    { x: 13, y: 3, width: 7, height: 7, rx: 1.2, fill: "yellow" },
  ] satisfies BrandRect[],
  /** Trazo con punta redondeada. */
  connector: { d: "M12 9.5h1", stroke: "deep", strokeWidth: 1.5 },
} as const satisfies {
  viewBox: BrandViewBox;
  blocks: BrandRect[];
  connector: BrandStroke;
};

/** Cable del logo terminando en una moneda. */
export const POINT_ICON = {
  viewBox: { x: 0, y: 0, width: 24, height: 24 },
  /** Sin relleno y con punta redondeada. */
  cable: { d: "M4 5v5c0 3 2 5 5 5h3", stroke: "sky", strokeWidth: 2 },
  coin: {
    cx: 16.5,
    cy: 15,
    r: 4.5,
    fill: "yellow",
    stroke: "petrol",
    strokeWidth: 1.5,
  },
  coinCenter: { cx: 16.5, cy: 15, r: 1.2, fill: "deep" },
} as const satisfies {
  viewBox: BrandViewBox;
  cable: BrandStroke;
  coin: BrandCircle & { stroke: PremiumBrandColor; strokeWidth: number };
  coinCenter: BrandCircle;
};

/**
 * La "D" del logo sobre una ficha amarilla (tarjeta del plan). Todo lo que no
 * es `tile` va dentro de un grupo con `transform`.
 */
export const PREMIUM_MARK = {
  viewBox: { x: 0, y: 0, width: 120, height: 120 },
  tile: { x: 4, y: 4, width: 112, height: 112, rx: 26, fill: "yellow" },
  transform: "translate(60 60) scale(0.84) translate(-68.75 -65)",
  /** Sin relleno. */
  arc: {
    d: "M62 26 h4 a34 34 0 0 1 0 68 h-4",
    stroke: "deep",
    strokeWidth: 15,
  },
  /** Columna de módulos, de arriba hacia abajo. */
  modules: [
    { x: 46, y: 19, width: 15, height: 14, rx: 1.5, fill: "deep" },
    { x: 46, y: 35, width: 15, height: 11, rx: 1.5, fill: "steel" },
    { x: 46, y: 48, width: 15, height: 11, rx: 1.5, fill: "sky" },
    { x: 46, y: 61, width: 15, height: 11, rx: 1.5, fill: "steel" },
    { x: 46, y: 74, width: 15, height: 10, rx: 1.5, fill: "sky" },
    { x: 46, y: 86, width: 15, height: 15, rx: 1.5, fill: "deep" },
  ] satisfies BrandRect[],
  /** Sin relleno y con punta redondeada. */
  cable: {
    d: "M39 53.5 h7 M34.5 58 V98 a8 8 0 0 0 8 8 H86",
    stroke: "deep",
    strokeWidth: 2.6,
  },
  connector: { x: 30, y: 49, width: 9, height: 9, rx: 1.2, fill: "petrol" },
  dot: { cx: 90, cy: 106, r: 5, fill: "deep" },
} as const satisfies {
  viewBox: BrandViewBox;
  tile: BrandRect;
  transform: string;
  arc: BrandStroke;
  modules: BrandRect[];
  cable: BrandStroke;
  connector: BrandRect;
  dot: BrandCircle;
};

/**
 * Insignia Premium: la D con su pieza amarilla dentro de un hexágono con borde
 * amarillo. Todo lo que no es el hexágono va dentro de un grupo con
 * `transform`; los módulos van solo si `showsPremiumBadgeModules(size)`.
 */
export const PREMIUM_BADGE = {
  viewBox: { x: -48, y: -54, width: 96, height: 108 },
  hexagon: {
    points: "0,-50 43.3,-25 43.3,25 0,50 -43.3,25 -43.3,-25",
    fill: "deep",
    stroke: "yellow",
  },
  transform: "scale(0.8) translate(-340 -100)",
  outerD: { d: "M326 68 H342 A32 32 0 0 1 342 132 H326 Z", fill: "paper" },
  innerD: { d: "M334 82 H342 A18 18 0 0 1 342 118 H334 Z", fill: "deep" },
  modules: [
    { x: 310, y: 70, width: 13, height: 12, rx: 2, fill: "sky" },
    { x: 310, y: 85, width: 13, height: 12, rx: 2, fill: "sky" },
    { x: 310, y: 118, width: 13, height: 12, rx: 2, fill: "sky" },
  ] satisfies BrandRect[],
  piece: { x: 306, y: 100, width: 17, height: 15, rx: 2, fill: "yellow" },
} as const satisfies {
  viewBox: BrandViewBox;
  hexagon: {
    points: string;
    fill: PremiumBrandColor;
    stroke: PremiumBrandColor;
  };
  transform: string;
  outerD: { d: string; fill: PremiumBrandColor };
  innerD: { d: string; fill: PremiumBrandColor };
  modules: BrandRect[];
  piece: BrandRect;
};

/** Por debajo de este tamaño (px) los módulos celestes se vuelven manchas. */
export const PREMIUM_BADGE_DETAIL_MIN_SIZE = 28;

export function showsPremiumBadgeModules(size: number): boolean {
  return size >= PREMIUM_BADGE_DETAIL_MIN_SIZE;
}

/** Ancho en px para un alto dado: la insignia no es cuadrada. */
export function premiumBadgeWidth(size: number): number {
  return (size * PREMIUM_BADGE.viewBox.width) / PREMIUM_BADGE.viewBox.height;
}

/**
 * Grosor del borde en unidades del viewBox: fino en grande y sin desaparecer en
 * chico (nunca menos de ~1 px en pantalla).
 */
export function premiumBadgeOutlineWidth(size: number): number {
  return Math.max(2, PREMIUM_BADGE.viewBox.height / size);
}

/** El `viewBox` como lo espera el atributo SVG. */
export function brandViewBox({ x, y, width, height }: BrandViewBox): string {
  return `${x} ${y} ${width} ${height}`;
}

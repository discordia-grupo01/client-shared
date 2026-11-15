import { describe, expect, it } from "vitest";

import {
  BOOSTED_BADGE,
  boostedBadgeStrokeWidth,
  BOOST_ACTION_ICON,
  BOOST_LEVEL_ICON,
  brandViewBox,
  POINT_ICON,
  PREMIUM_BADGE,
  PREMIUM_BADGE_DETAIL_MIN_SIZE,
  PREMIUM_BRAND_COLORS,
  PREMIUM_ICON,
  PREMIUM_MARK,
  premiumBadgeOutlineWidth,
  premiumBadgeWidth,
  showsPremiumBadgeModules,
} from "./premium-brand";

const HEX = /^#[0-9A-F]{6}$/;

describe("PREMIUM_BRAND_COLORS", () => {
  it("son hex de 6 dígitos", () => {
    for (const color of Object.values(PREMIUM_BRAND_COLORS)) {
      expect(color).toMatch(HEX);
    }
  });

  it("todos los íconos usan colores que existen", () => {
    const used = JSON.stringify([
      PREMIUM_ICON,
      POINT_ICON,
      PREMIUM_MARK,
      PREMIUM_BADGE,
      BOOST_LEVEL_ICON,
      BOOST_ACTION_ICON,
      BOOSTED_BADGE,
    ]).matchAll(/"(?:fill|stroke|filledStroke|emptyStroke)":"(\w+)"/g);
    for (const [, name] of used) {
      expect(Object.keys(PREMIUM_BRAND_COLORS)).toContain(name);
    }
  });
});

describe("insignia Premium", () => {
  it("muestra los módulos desde el tamaño mínimo", () => {
    expect(showsPremiumBadgeModules(PREMIUM_BADGE_DETAIL_MIN_SIZE)).toBe(true);
    expect(showsPremiumBadgeModules(PREMIUM_BADGE_DETAIL_MIN_SIZE - 1)).toBe(
      false,
    );
  });

  it("guarda la proporción del viewBox", () => {
    expect(premiumBadgeWidth(108)).toBe(96);
    expect(premiumBadgeWidth(40)).toBeCloseTo(35.56, 2);
  });

  it("el borde es fino en grande y nunca baja de 2", () => {
    expect(premiumBadgeOutlineWidth(14)).toBeCloseTo(7.71, 2);
    expect(premiumBadgeOutlineWidth(40)).toBe(2.7);
    expect(premiumBadgeOutlineWidth(120)).toBe(2);
  });
});

describe("brandViewBox", () => {
  it("arma el atributo viewBox", () => {
    expect(brandViewBox(PREMIUM_ICON.viewBox)).toBe("0 0 24 24");
    expect(brandViewBox(PREMIUM_BADGE.viewBox)).toBe("-48 -54 96 108");
  });
});

describe("BOOST_LEVEL_ICON", () => {
  it("el viewBox ajustado deja las barras con un margen parejo", () => {
    const { bars, tightViewBox } = BOOST_LEVEL_ICON;
    const left = Math.min(...bars.map((bar) => bar.x));
    const right = Math.max(...bars.map((bar) => bar.x + bar.width));
    const top = Math.min(...bars.map((bar) => bar.y));
    const bottom = Math.max(...bars.map((bar) => bar.y + bar.height));

    expect(tightViewBox.x).toBe(left - 1);
    expect(tightViewBox.width).toBe(right - left + 2);
    expect(tightViewBox.y).toBe(top - 1);
    expect(tightViewBox.height).toBe(bottom - top + 2);
  });
});

describe("BOOSTED_BADGE", () => {
  it("las barras y la pieza quedan dentro del hexágono", () => {
    const pieces = [...BOOSTED_BADGE.bars, BOOSTED_BADGE.piece];
    for (const piece of pieces) {
      expect(piece.x).toBeGreaterThanOrEqual(3.4);
      expect(piece.x + piece.width).toBeLessThanOrEqual(20.6);
    }
  });

  it("el borde afina con el tamaño", () => {
    expect(boostedBadgeStrokeWidth(16)).toBe(1.8);
    expect(boostedBadgeStrokeWidth(18)).toBe(1.6);
    expect(boostedBadgeStrokeWidth(26)).toBe(1.4);
    expect(boostedBadgeStrokeWidth(56)).toBe(1.2);
  });
});

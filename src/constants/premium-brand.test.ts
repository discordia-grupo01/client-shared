import { describe, expect, it } from "vitest";

import {
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
    ]).matchAll(/"(?:fill|stroke)":"(\w+)"/g);
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

import { describe, expect, it } from "vitest";

import {
  BANS_SECTION_SUBTITLE,
  BANS_SECTION_TITLE,
  emojiSlotsBadge,
  ROLES_SECTION_SUBTITLE,
  ROLES_SECTION_TITLE,
  SERVER_QUICK_ACTION_LABELS,
  SERVER_QUICK_ACTIONS,
  SERVER_SETTINGS_MENU_DESCRIPTION,
  serverSheetMetaLabel,
} from "./server-settings";

describe("fila de Configuración del servidor", () => {
  it("anticipa lo que hay adentro, ahora que roles y baneos son secciones", () => {
    expect(SERVER_SETTINGS_MENU_DESCRIPTION).toBe(
      "Emojis, roles, baneos y más",
    );
  });
});

describe("secciones nuevas", () => {
  it("se nombran con el sustantivo, como el resto", () => {
    expect(ROLES_SECTION_TITLE).toBe("Roles");
    expect(ROLES_SECTION_SUBTITLE).toBe("Permisos y jerarquía");
    expect(BANS_SECTION_TITLE).toBe("Baneos");
    expect(BANS_SECTION_SUBTITLE).toBe("Usuarios baneados");
  });
});

describe("accesos rápidos de la app", () => {
  it("los cuatro tienen etiqueta corta", () => {
    for (const action of SERVER_QUICK_ACTIONS) {
      expect(SERVER_QUICK_ACTION_LABELS[action].length).toBeGreaterThan(0);
      expect(SERVER_QUICK_ACTION_LABELS[action].length).toBeLessThanOrEqual(14);
    }
  });

  it("el de emojis muestra los lugares usados sobre el tope", () => {
    expect(emojiSlotsBadge(6, 70)).toBe("6/70");
    expect(emojiSlotsBadge(0, 50)).toBe("0/50");
  });
});

describe("serverSheetMetaLabel", () => {
  it("junta nivel, boosts y miembros", () => {
    expect(serverSheetMetaLabel(1, 7, 5)).toBe(
      "Nivel 1 · 7 boosts · 5 miembros",
    );
  });

  it("no pluraliza de más con uno solo", () => {
    expect(serverSheetMetaLabel(0, 1, 1)).toBe("Nivel 0 · 1 boost · 1 miembro");
  });
});

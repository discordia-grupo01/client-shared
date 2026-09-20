import { describe, expect, it } from "vitest";

import {
  ACTIVITY_STATUS_DESCRIPTION,
  ACTIVITY_STATUS_LABEL,
  ACTIVITY_STATUSES,
  type ActivityStatus,
} from "./activity-status";

describe("estado de actividad", () => {
  it("son tres, en el orden del selector", () => {
    expect(ACTIVITY_STATUSES).toEqual(["online", "dnd", "offline"]);
  });

  /**
   * Antes habia dos vocabularios para las mismas tres opciones ("Automático"
   * contra "En línea", "Invisible" contra "Desconectado") y un cuarto estado
   * `idle` que no producia nadie.
   */
  it("cada estado tiene exactamente un nombre y una explicacion", () => {
    for (const status of ACTIVITY_STATUSES) {
      expect(ACTIVITY_STATUS_LABEL[status]).toBeTruthy();
      expect(ACTIVITY_STATUS_DESCRIPTION[status]).toBeTruthy();
    }
    expect(Object.keys(ACTIVITY_STATUS_LABEL)).toHaveLength(
      ACTIVITY_STATUSES.length,
    );
    expect(Object.keys(ACTIVITY_STATUS_DESCRIPTION)).toHaveLength(
      ACTIVITY_STATUSES.length,
    );
  });

  it("no hay dos estados con el mismo nombre", () => {
    const nombres = Object.values(ACTIVITY_STATUS_LABEL);
    expect(new Set(nombres).size).toBe(nombres.length);
  });

  it("las explicaciones hablan de lo que ven los demas", () => {
    const status: ActivityStatus[] = [...ACTIVITY_STATUSES];
    for (const s of status) {
      expect(ACTIVITY_STATUS_DESCRIPTION[s]).toMatch(/\.$/);
    }
  });
});

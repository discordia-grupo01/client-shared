import { describe, expect, it } from "vitest";

import { serverDeletedNoticeDescription } from "./staff-notice";

describe("serverDeletedNoticeDescription", () => {
  it("nombra el servidor eliminado", () => {
    expect(serverDeletedNoticeDescription("Club de Lectura")).toBe(
      'El equipo de la plataforma eliminó el servidor "Club de Lectura". Esta acción no se puede deshacer.',
    );
  });
});

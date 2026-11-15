import { describe, expect, it } from "vitest";

import { BOOST_SECTION_TABS } from "../constants/boost";
import type { BoostStatus } from "../domain/billing-boost";
import {
  activeBoostsLabel,
  BOOST_ACTION_COPY,
  BOOST_POINTS_PROMO_COPY,
  BOOST_SECTION_TAB_LABELS,
  BOOST_STATUS_LABELS,
  BOOST_TIER_SUMMARIES,
  boostCapNote,
  boostLevelUpNotice,
  boostOutcomeCopy,
  boostPointsMissingLabel,
  boostRefundDelta,
  boostRefundNote,
  boostRejectionReason,
  BOOST_REJECTED_DEFAULT,
  boostRemainingBalanceLabel,
  boostRemoveImpact,
  boostRemoveNoRefund,
  boostRemoveTitle,
  boostRemoveVanityNote,
  boostRowMeta,
  boostedServerSummaryLabel,
  boostedServersCountLabel,
  BOOST_LIST_COPY,
  ownBoostsLabel,
  serverBoostsSummaryLabel,
} from "./billing-boost";

const STATUSES: BoostStatus[] = ["pending", "active", "failed", "removed"];

describe("textos para boostear", () => {
  it("cada pestaña y cada estado tienen nombre", () => {
    for (const tab of BOOST_SECTION_TABS) {
      expect(BOOST_SECTION_TAB_LABELS[tab]).not.toBe("");
    }
    for (const status of STATUSES) {
      expect(BOOST_STATUS_LABELS[status]).not.toBe("");
    }
  });

  it("la tarjeta usa el costo real", () => {
    expect(BOOST_ACTION_COPY.cta).toBe("Boostear por 100 puntos");
    expect(BOOST_ACTION_COPY.description).toContain("100 puntos");
  });

  it("en el tope explica cuándo se puede volver a boostear", () => {
    expect(BOOST_ACTION_COPY.capCta).toBe("Nivel máximo alcanzado");
    expect(boostCapNote("Club de Lectura")).toBe(
      "Club de Lectura ya tiene los 30 boosts del nivel 3. Vas a poder boostear de nuevo si alguien retira uno.",
    );
  });

  it("la tarjeta de Puntos usa el costo real", () => {
    expect(BOOST_POINTS_PROMO_COPY.description).toBe(
      "Cada boost cuesta 100 puntos y ayuda a desbloquear beneficios.",
    );
  });

  it("dice cuánto falta y cuánto queda", () => {
    expect(boostPointsMissingLabel(40)).toBe("Te faltan 60 puntos.");
    expect(boostRemainingBalanceLabel(550)).toBe("Te quedan 450 puntos.");
  });

  it("cuenta los boosts activos y los propios", () => {
    expect(activeBoostsLabel(1)).toBe("1 activo");
    expect(activeBoostsLabel(3)).toBe("3 activos");
    expect(ownBoostsLabel(1)).toBe("1 boost tuyo");
    expect(ownBoostsLabel(2)).toBe("2 boosts tuyos");
  });

  it("resume el servidor con nivel, total y propios", () => {
    expect(serverBoostsSummaryLabel(1, 5, 1)).toBe(
      "Nivel 1 · 5 en total · 1 tuyo",
    );
    expect(serverBoostsSummaryLabel(2, 16, 3)).toBe(
      "Nivel 2 · 16 en total · 3 tuyos",
    );
  });

  it("anticipa la subida de nivel solo si el boost cruza un umbral", () => {
    expect(boostLevelUpNotice(14)).toBe(
      "Con este boost el servidor llega al nivel 2: banner del servidor y adjuntos de 25 MB.",
    );
    expect(boostLevelUpNotice(7)).toBeUndefined();
    expect(boostLevelUpNotice(30)).toBeUndefined();
  });
});

describe("boostOutcomeCopy", () => {
  const context = { serverName: "Club de Lectura", boostCount: 14 };

  it("celebra el nivel nuevo", () => {
    expect(boostOutcomeCopy("applied", context)).toEqual({
      title: "Boost aplicado",
      description:
        "Club de Lectura llegó al nivel 2. Todos los miembros ahora tienen banner del servidor y adjuntos de 25 MB.",
    });
  });

  it("sin nivel nuevo alcanza con el contador", () => {
    expect(
      boostOutcomeCopy("applied", { ...context, boostCount: 7 }).description,
    ).toBe("Club de Lectura ahora tiene 8 boosts.");
  });

  it("explica el rechazo y el reembolso", () => {
    expect(
      boostOutcomeCopy("rejected", { ...context, statusDetail: "not_a_member" })
        .description,
    ).toBe("No sos miembro de este servidor. Te devolvimos los puntos.");
  });

  it("nombra al servidor si se rechazó por el tope", () => {
    expect(
      boostOutcomeCopy("rejected", {
        ...context,
        statusDetail: "max_level_reached",
      }).description,
    ).toBe(
      "Club de Lectura llegó al nivel máximo antes de que se aplicara tu boost. Te devolvimos los puntos.",
    );
  });

  it("tiene texto para cada resultado", () => {
    for (const outcome of [
      "applying",
      "still_pending",
      "removed",
      "not_found",
    ] as const) {
      expect(boostOutcomeCopy(outcome, context).title).not.toBe("");
    }
  });
});

describe("boostRejectionReason", () => {
  it("conoce los motivos de servers y billing", () => {
    expect(boostRejectionReason("server_suspended")).toBe(
      "El servidor está suspendido.",
    );
    expect(boostRejectionReason("no_response")).toBe(
      "El servidor no respondió a tiempo.",
    );
  });

  it("conoce el rechazo por tope", () => {
    expect(boostRejectionReason("max_level_reached")).toBe(
      "El servidor llegó al nivel máximo antes de que se aplicara tu boost.",
    );
  });

  it("usa el genérico para el resto", () => {
    expect(boostRejectionReason("cancelled")).toBe(BOOST_REJECTED_DEFAULT);
    expect(boostRejectionReason("")).toBe(BOOST_REJECTED_DEFAULT);
  });
});

describe("reembolso y retiro", () => {
  const spent = { points: 100 };

  it("muestra el reembolso", () => {
    expect(boostRefundNote(spent)).toBe("Te devolvimos los 100 puntos.");
    expect(boostRefundDelta(spent)).toBe("+100");
  });

  it("avisa que retirar no reembolsa", () => {
    expect(boostRemoveTitle("Club de Lectura")).toBe(
      "¿Retirar tu boost de Club de Lectura?",
    );
    expect(boostRemoveNoRefund(spent)).toBe(
      "No se devuelven los 100 puntos que gastaste.",
    );
  });

  it("dice qué pierde el servidor si baja de nivel", () => {
    expect(boostRemoveImpact(15)).toBe(
      "El servidor baja al nivel 1. Pierde para todos: banner del servidor y adjuntos de 25 MB.",
    );
  });

  it("en el tope avisa que la URL queda guardada", () => {
    expect(boostRemoveImpact(30)).toBe(
      "El servidor baja al nivel 2. Pierde para todos: URL personalizada e insignia Servidor Boosteado.",
    );
    expect(boostRemoveVanityNote(30)).toBe(
      "La URL queda guardada y vuelve a funcionar si llega otra vez a 30.",
    );
    expect(boostRemoveVanityNote(20)).toBeUndefined();
  });

  it("o en qué nivel sigue", () => {
    expect(boostRemoveImpact(20)).toBe(
      "El servidor queda con 19 boosts y sigue en el nivel 2.",
    );
  });
});

describe("BOOST_TIER_SUMMARIES", () => {
  it("resume los tres umbrales", () => {
    expect(BOOST_TIER_SUMMARIES).toEqual([
      {
        level: 1,
        label: "Nivel 1 · 5 boosts",
        perks: "más emojis e ícono animado",
      },
      {
        level: 2,
        label: "Nivel 2 · 15 boosts",
        perks: "banner del servidor y adjuntos de 25 MB",
      },
      {
        level: 3,
        label: "Nivel 3 · 30 boosts",
        perks: "URL personalizada e insignia Servidor Boosteado",
      },
    ]);
  });
});

describe("boostRowMeta", () => {
  const local = (month: number, day: number, hour = 12, minute = 0) =>
    new Date(2026, month - 1, day, hour, minute).toISOString();
  const row = {
    points: 100,
    status_detail: "",
    created_at: local(11, 12),
    updated_at: local(11, 12),
  };

  it("un activo dice desde cuándo", () => {
    expect(boostRowMeta({ ...row, status: "active" })).toBe(
      "Desde el 12 nov 2026, 12:00",
    );
  });

  it("un retirado muestra las dos fechas y que no hubo reembolso", () => {
    expect(
      boostRowMeta({
        ...row,
        status: "removed",
        created_at: local(11, 3, 10, 5),
        updated_at: local(11, 11, 18, 42),
      }),
    ).toBe(
      "Del 3 nov, 10:05 al 11 nov 2026, 18:42 · no se devolvieron los puntos",
    );
  });

  it("uno que no se aplicó dice el motivo y el reembolso", () => {
    expect(
      boostRowMeta({
        ...row,
        status: "failed",
        status_detail: "server_suspended",
        updated_at: local(11, 13),
      }),
    ).toBe(
      "13 nov 2026, 12:00 · el servidor está suspendido · te devolvimos los 100 puntos",
    );
  });

  it("uno pendiente espera al servidor", () => {
    expect(
      boostRowMeta(
        { ...row, status: "pending", created_at: local(11, 15, 18, 42) },
        new Date(2026, 10, 15, 18, 43),
      ),
    ).toBe("Hoy, 18:42 · esperando la confirmación del servidor");
  });

  it("el pie avisa que los retirados quedan en la lista", () => {
    expect(BOOST_LIST_COPY.footnote).toContain(
      "Los retirados quedan en esta lista.",
    );
  });
});

describe("Servidores que boosteaste", () => {
  it("resume nivel, total, activos y retirados", () => {
    expect(
      boostedServerSummaryLabel(
        { active: 1, removed: 1 },
        { level: 1, boostCount: 6 },
      ),
    ).toBe("Nivel 1 · 6 en total · 1 tuyo activo · 1 retirado");
    expect(
      boostedServerSummaryLabel(
        { active: 3, removed: 0 },
        { level: 2, boostCount: 18 },
      ),
    ).toBe("Nivel 2 · 18 en total · 3 tuyos activos");
  });

  it("en el nivel 3 dice Nivel máximo", () => {
    expect(
      boostedServerSummaryLabel(
        { active: 7, removed: 2 },
        { level: 3, boostCount: 30 },
      ),
    ).toBe("Nivel máximo · 30 en total · 7 tuyos activos · 2 retirados");
  });

  it("si todos están retirados no hay ninguno activo", () => {
    expect(
      boostedServerSummaryLabel(
        { active: 0, removed: 2 },
        { level: 1, boostCount: 9 },
      ),
    ).toBe("Nivel 1 · 9 en total · ningún activo · 2 retirados");
  });

  it("si ya no sos miembro no hay nivel", () => {
    expect(boostedServerSummaryLabel({ active: 1, removed: 0 }, null)).toBe(
      "Ya no sos miembro · 1 tuyo activo",
    );
  });

  it("cuenta los servidores", () => {
    expect(boostedServersCountLabel(1)).toBe("1 servidor");
    expect(boostedServersCountLabel(14)).toBe("14 servidores");
  });
});

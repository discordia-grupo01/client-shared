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

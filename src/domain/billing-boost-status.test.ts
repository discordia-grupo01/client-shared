import { describe, expect, it, vi } from "vitest";

import { BOOST_STATUS_TIMEOUT_MS } from "../constants/boost";
import { BOOST_STATUS_FAILED } from "../messages/billing-boost";
import type { Boost } from "./billing-boost";
import {
  applyBoostStep,
  boostRequestProgress,
  boostRequestStarted,
  checkBoostStep,
} from "./billing-boost-status";

const boost = (status: Boost["status"], statusDetail = ""): Boost => ({
  id: "b1",
  server_id: "club",
  points: 100,
  status,
  status_detail: statusDetail,
  created_at: "2026-11-14T12:00:00Z",
  updated_at: "2026-11-14T12:00:00Z",
});

describe("boostRequestProgress", () => {
  it("sigue aplicando mientras está pendiente y hay tiempo", () => {
    expect(boostRequestProgress(boost("pending"), 0)).toEqual({
      outcome: "applying",
      done: false,
    });
  });

  it("al agotarse el tiempo queda en proceso", () => {
    expect(
      boostRequestProgress(boost("pending"), BOOST_STATUS_TIMEOUT_MS),
    ).toEqual({ outcome: "still_pending", done: true });
  });

  it("termina cuando billing decide", () => {
    expect(boostRequestProgress(boost("active"), 0).outcome).toBe("applied");
    expect(boostRequestProgress(boost("failed"), 0).outcome).toBe("rejected");
    expect(boostRequestProgress(boost("removed"), 0).outcome).toBe("removed");
    expect(boostRequestProgress(null, 0).outcome).toBe("not_found");
  });
});

describe("checkBoostStep", () => {
  it("trae el boost actualizado", async () => {
    const getBoost = vi
      .fn()
      .mockResolvedValue({ ok: true, data: boost("active") });
    const step = await checkBoostStep("b1", 4_000, { getBoost });
    expect(getBoost).toHaveBeenCalledWith("b1");
    expect(step).toEqual({
      kind: "progress",
      state: {
        progress: { outcome: "applied", done: true },
        boost: boost("active"),
        error: null,
      },
    });
  });

  it("un 404 termina como no encontrado", async () => {
    const getBoost = vi.fn().mockResolvedValue({
      ok: false,
      code: "BOOST_NOT_FOUND",
      message: "",
    });
    const step = await checkBoostStep("b1", 0, { getBoost });
    expect(step.kind === "progress" && step.state.progress.outcome).toBe(
      "not_found",
    );
  });

  it("cualquier otro error es un fallo para reintentar", async () => {
    const getBoost = vi.fn().mockResolvedValue({
      ok: false,
      code: "NETWORK_ERROR",
      message: "",
    });
    expect(await checkBoostStep("b1", 0, { getBoost })).toEqual({
      kind: "failed",
    });
  });
});

describe("applyBoostStep", () => {
  const started = boostRequestStarted(boost("pending"));

  it("arranca aplicando", () => {
    expect(started.progress).toEqual({ outcome: "applying", done: false });
  });

  it("un fallo antes del límite conserva el estado y sigue", () => {
    expect(applyBoostStep(started, { kind: "failed" }, 4_000)).toEqual({
      state: started,
      finished: false,
    });
  });

  it("un fallo al agotarse el tiempo deja el boost en proceso con el error", () => {
    const applied = applyBoostStep(
      started,
      { kind: "failed" },
      BOOST_STATUS_TIMEOUT_MS,
    );
    expect(applied.finished).toBe(true);
    expect(applied.state.progress).toEqual({
      outcome: "still_pending",
      done: true,
    });
    expect(applied.state.error).toBe(BOOST_STATUS_FAILED);
    expect(applied.state.boost).toEqual(boost("pending"));
  });

  it("corta cuando el boost queda activo", () => {
    const state = {
      progress: { outcome: "applied" as const, done: true },
      boost: boost("active"),
      error: null,
    };
    expect(applyBoostStep(started, { kind: "progress", state }, 0)).toEqual({
      state,
      finished: true,
    });
  });
});

import { describe, expect, it } from "vitest";

import { REPORT_REASON_MAX_LENGTH } from "../constants/limits";

import {
  buildReportReason,
  isReportDetailRequired,
  parseReportReason,
  REPORT_MESSAGE_CATEGORIES,
  REPORT_USER_CATEGORIES,
  reportCategoriesFor,
  reportDetailMaxLength,
} from "./report-categories";

const spam = REPORT_MESSAGE_CATEGORIES.find((c) => c.id === "spam")!;
const other = REPORT_MESSAGE_CATEGORIES.find((c) => c.id === "other")!;
const fakeAccount = REPORT_USER_CATEGORIES.find((c) => c.id === "spam")!;

describe("categorias", () => {
  it("mensaje y usuario tienen sus propias listas, las dos terminan en Otro", () => {
    expect(reportCategoriesFor("message")).toBe(REPORT_MESSAGE_CATEGORIES);
    expect(reportCategoriesFor("user")).toBe(REPORT_USER_CATEGORIES);
    expect(REPORT_MESSAGE_CATEGORIES.at(-1)?.id).toBe("other");
    expect(REPORT_USER_CATEGORIES.at(-1)?.id).toBe("other");
  });

  it("no hay ids repetidos dentro de una lista", () => {
    for (const list of [REPORT_MESSAGE_CATEGORIES, REPORT_USER_CATEGORIES]) {
      const ids = list.map((c) => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("solo Otro exige detalle", () => {
    expect(isReportDetailRequired(other)).toBe(true);
    expect(isReportDetailRequired(spam)).toBe(false);
  });
});

describe("buildReportReason", () => {
  it("sin detalle manda solo la categoria", () => {
    expect(buildReportReason(spam, "   ")).toBe("Spam");
  });

  it("con detalle lo suma despues de dos puntos, recortado", () => {
    expect(buildReportReason(spam, "  links raros \n")).toBe(
      "Spam: links raros",
    );
  });
});

describe("reportDetailMaxLength", () => {
  it("es el maximo del back menos el prefijo", () => {
    expect(reportDetailMaxLength(spam)).toBe(
      REPORT_REASON_MAX_LENGTH - "Spam: ".length,
    );
  });

  it("el reason armado con el maximo de detalle entra justo", () => {
    const detail = "a".repeat(reportDetailMaxLength(other));
    expect([...buildReportReason(other, detail)].length).toBe(
      REPORT_REASON_MAX_LENGTH,
    );
  });
});

describe("parseReportReason", () => {
  it("separa categoria y detalle", () => {
    expect(parseReportReason("Acoso o insultos: le dice cosas")).toEqual({
      category: expect.objectContaining({ id: "harassment" }),
      detail: "le dice cosas",
    });
  });

  it("reconoce una categoria sola", () => {
    expect(parseReportReason("Spam")).toEqual({
      category: spam,
      detail: "",
    });
  });

  it("no confunde Spam con Spam o cuenta falsa", () => {
    expect(parseReportReason("Spam o cuenta falsa: bot")).toEqual({
      category: fakeAccount,
      detail: "bot",
    });
  });

  it("un motivo libre queda entero como detalle", () => {
    expect(parseReportReason("Insulta a todos")).toEqual({
      category: null,
      detail: "Insulta a todos",
    });
    expect(parseReportReason("Spammer de links")).toEqual({
      category: null,
      detail: "Spammer de links",
    });
  });

  it("es lo inverso de buildReportReason en todas las categorias", () => {
    for (const category of [
      ...REPORT_MESSAGE_CATEGORIES,
      ...REPORT_USER_CATEGORIES,
    ]) {
      const parsed = parseReportReason(buildReportReason(category, "x y"));
      expect(parsed.category?.label).toBe(category.label);
      expect(parsed.detail).toBe("x y");
    }
  });
});

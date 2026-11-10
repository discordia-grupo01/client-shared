import { describe, expect, it } from "vitest";

import {
  REPORT_MESSAGE_CATEGORIES,
  reportDetailMaxLength,
} from "../domain/report-categories";

import { validateReportDetail } from "./report";

const spam = REPORT_MESSAGE_CATEGORIES.find((c) => c.id === "spam")!;
const other = REPORT_MESSAGE_CATEGORIES.find((c) => c.id === "other")!;

describe("validateReportDetail", () => {
  it("el detalle es opcional en una categoria comun", () => {
    expect(validateReportDetail(spam, "")).toBeUndefined();
  });

  it("en Otro es obligatorio", () => {
    expect(validateReportDetail(other, "   ")).toMatch(/Contanos/);
    expect(validateReportDetail(other, "links raros")).toBeUndefined();
  });

  it("acepta hasta el maximo que deja la categoria", () => {
    const max = reportDetailMaxLength(spam);
    expect(validateReportDetail(spam, "a".repeat(max))).toBeUndefined();
    expect(validateReportDetail(spam, "a".repeat(max + 1))).toMatch(
      new RegExp(String(max)),
    );
  });

  it("cuenta un emoji como un solo caracter, como el back", () => {
    expect(
      validateReportDetail(spam, "😀".repeat(reportDetailMaxLength(spam))),
    ).toBeUndefined();
  });
});

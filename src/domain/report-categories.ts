import { REPORT_REASON_MAX_LENGTH } from "../constants/limits";

import type { ReportKind } from "./report";

export type ReportCategoryId =
  | "spam"
  | "harassment"
  | "hate"
  | "violence"
  | "private_info"
  | "profile"
  | "impersonation"
  | "other";

export interface ReportCategory {
  id: ReportCategoryId;
  label: string;
}

export const REPORT_MESSAGE_CATEGORIES: readonly ReportCategory[] = [
  { id: "spam", label: "Spam" },
  { id: "harassment", label: "Acoso o insultos" },
  { id: "hate", label: "Discurso de odio" },
  { id: "violence", label: "Contenido violento" },
  { id: "private_info", label: "Datos personales expuestos" },
  { id: "other", label: "Otro" },
];

export const REPORT_USER_CATEGORIES: readonly ReportCategory[] = [
  { id: "spam", label: "Spam o cuenta falsa" },
  { id: "harassment", label: "Acoso o insultos" },
  { id: "hate", label: "Discurso de odio" },
  { id: "profile", label: "Nombre o foto de perfil inapropiados" },
  { id: "impersonation", label: "Se hace pasar por otra persona" },
  { id: "other", label: "Otro" },
];

export function reportCategoriesFor(
  kind: ReportKind,
): readonly ReportCategory[] {
  return kind === "message"
    ? REPORT_MESSAGE_CATEGORIES
    : REPORT_USER_CATEGORIES;
}

export function isReportDetailRequired(category: ReportCategory): boolean {
  return category.id === "other";
}

const SEPARATOR = ": ";

function runeLength(text: string): number {
  return [...text].length;
}

export function buildReportReason(
  category: ReportCategory,
  detail: string,
): string {
  const trimmed = detail.trim();
  return trimmed ? `${category.label}${SEPARATOR}${trimmed}` : category.label;
}

export function reportDetailMaxLength(category: ReportCategory): number {
  return (
    REPORT_REASON_MAX_LENGTH -
    runeLength(category.label) -
    runeLength(SEPARATOR)
  );
}

export interface ParsedReportReason {
  category: ReportCategory | null;
  detail: string;
}

const KNOWN_CATEGORIES: readonly ReportCategory[] = [
  ...REPORT_MESSAGE_CATEGORIES,
  ...REPORT_USER_CATEGORIES.filter(
    (category) =>
      !REPORT_MESSAGE_CATEGORIES.some(
        (known) => known.label === category.label,
      ),
  ),
].sort((a, b) => b.label.length - a.label.length);

export function parseReportReason(reason: string): ParsedReportReason {
  const trimmed = reason.trim();
  for (const category of KNOWN_CATEGORIES) {
    if (trimmed === category.label) return { category, detail: "" };
    const prefix = `${category.label}${SEPARATOR}`;
    if (trimmed.startsWith(prefix)) {
      return { category, detail: trimmed.slice(prefix.length).trim() };
    }
  }
  return { category: null, detail: trimmed };
}

import {
  buildReportReason,
  isReportDetailRequired,
  type ReportCategory,
  reportDetailMaxLength,
} from "../domain/report-categories";
import { REPORT_REASON_MAX_LENGTH } from "../constants/limits";

export function validateReportDetail(
  category: ReportCategory,
  detail: string,
): string | undefined {
  if (isReportDetailRequired(category) && detail.trim() === "") {
    return "Contanos qué pasó para que los moderadores lo entiendan.";
  }
  const reason = buildReportReason(category, detail);
  if ([...reason].length > REPORT_REASON_MAX_LENGTH) {
    return `El detalle no puede superar los ${reportDetailMaxLength(category)} caracteres.`;
  }
  return undefined;
}

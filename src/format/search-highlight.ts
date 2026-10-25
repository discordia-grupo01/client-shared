export interface HighlightSegment {
  text: string;
  isMatch: boolean;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function splitHighlight(text: string, term: string): HighlightSegment[] {
  const needle = term.trim();
  if (!needle || !text) return text ? [{ text, isMatch: false }] : [];

  const segments: HighlightSegment[] = [];
  const pattern = new RegExp(escapeRegExp(needle), "giu");
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > last) {
      segments.push({ text: text.slice(last, start), isMatch: false });
    }
    segments.push({ text: match[0], isMatch: true });
    last = start + match[0].length;
  }
  if (last < text.length) {
    segments.push({ text: text.slice(last), isMatch: false });
  }
  return segments;
}

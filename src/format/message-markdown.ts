import { type MessageToken, tokenizeMessageContent } from "./message-content";
import { ROLE_TOKEN_SOURCE, USER_TOKEN_SOURCE } from "./mention-tokens";

export type MessageInline =
  | MessageToken
  | { kind: "bold" | "italic" | "strike"; children: MessageInline[] }
  | { kind: "code"; value: string };

export type MessageBlock =
  | { kind: "paragraph"; children: MessageInline[] }
  | { kind: "heading"; level: 1 | 2 | 3; children: MessageInline[] }
  | { kind: "list"; items: MessageInline[][] }
  | { kind: "quote"; children: MessageInline[] }
  | { kind: "code-block"; language: string | null; value: string };

const HEADING = /^(#{1,3}) +(\S.*)$/;
const LIST_ITEM = /^[ \t]*[-*] +(\S.*)$/;
const QUOTE = /^>(?: (.*))?$/;
const FENCE = "```";
const CODE_LANGUAGE = /^[\w+#.-]+$/;

const ESCAPABLE = "\\*_~`#>-";
const WORD_CHAR = /[A-Za-z0-9À-ſ]/;
const WHITESPACE = /\s/;
const MENTION_AT = new RegExp(`${ROLE_TOKEN_SOURCE}|${USER_TOKEN_SOURCE}`, "y");

type Delimiter = "***" | "**" | "~~" | "*" | "_";
const DELIMITERS: readonly Delimiter[] = ["***", "**", "~~", "*", "_"];

export function parseMessageMarkdown(content: string): MessageBlock[] {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  const blocks: MessageBlock[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    while (paragraph.length > 0 && paragraph[0].trim() === "") {
      paragraph.shift();
    }
    while (
      paragraph.length > 0 &&
      paragraph[paragraph.length - 1].trim() === ""
    ) {
      paragraph.pop();
    }
    if (paragraph.length > 0) {
      blocks.push({
        kind: "paragraph",
        children: parseMessageInline(paragraph.join("\n")),
      });
    }
    paragraph = [];
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    const code = readCodeBlock(lines, i);
    if (code) {
      flushParagraph();
      blocks.push(code.block);
      i = code.next;
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      flushParagraph();
      blocks.push({
        kind: "heading",
        level: heading[1].length as 1 | 2 | 3,
        children: parseMessageInline(heading[2]),
      });
      i++;
      continue;
    }

    if (LIST_ITEM.test(line)) {
      flushParagraph();
      const items: MessageInline[][] = [];
      let item: RegExpExecArray | null;
      while (i < lines.length && (item = LIST_ITEM.exec(lines[i]))) {
        items.push(parseMessageInline(item[1]));
        i++;
      }
      blocks.push({ kind: "list", items });
      continue;
    }

    if (QUOTE.test(line)) {
      flushParagraph();
      const quoted: string[] = [];
      let quote: RegExpExecArray | null;
      while (i < lines.length && (quote = QUOTE.exec(lines[i]))) {
        quoted.push(quote[1] ?? "");
        i++;
      }
      blocks.push({
        kind: "quote",
        children: parseMessageInline(quoted.join("\n")),
      });
      continue;
    }

    paragraph.push(line);
    i++;
  }
  flushParagraph();
  return blocks;
}

function readCodeBlock(
  lines: readonly string[],
  start: number,
): { block: MessageBlock; next: number } | null {
  const first = lines[start];
  if (!first.startsWith(FENCE)) return null;
  const rest = first.slice(FENCE.length);
  if (rest.includes(FENCE)) return null;

  const language = CODE_LANGUAGE.test(rest.trim()) ? rest.trim() : null;
  const body: string[] = [];
  if (language === null && rest.trim() !== "") body.push(rest);

  for (let j = start + 1; j < lines.length; j++) {
    const line = lines[j].trimEnd();
    if (line.endsWith(FENCE)) {
      const before = line.slice(0, -FENCE.length);
      if (before !== "") body.push(before);
      return {
        block: { kind: "code-block", language, value: body.join("\n") },
        next: j + 1,
      };
    }
    body.push(lines[j]);
  }
  return null;
}

export function parseMessageInline(text: string): MessageInline[] {
  const nodes: MessageInline[] = [];
  const unclosed = new Set<Delimiter>();
  let buffer = "";

  const flush = () => {
    if (buffer !== "") nodes.push(...tokenizeMessageContent(buffer));
    buffer = "";
  };

  let i = 0;
  while (i < text.length) {
    const char = text[i];

    if (char === "\\" && ESCAPABLE.includes(text[i + 1] ?? "")) {
      flush();
      nodes.push({ kind: "text", value: text[i + 1] });
      i += 2;
      continue;
    }

    const mention = mentionAt(text, i);
    if (mention) {
      buffer += mention;
      i += mention.length;
      continue;
    }

    if (char === "`") {
      const span = readCodeSpan(text, i);
      if (span) {
        flush();
        nodes.push({ kind: "code", value: span.value });
        i = span.end;
      } else {
        const run = runLength(text, i, "`");
        buffer += text.slice(i, i + run);
        i += run;
      }
      continue;
    }

    const styled = readStyled(text, i, unclosed);
    if (styled) {
      flush();
      const { delimiter, from, closer } = styled;
      nodes.push(wrap(delimiter, parseMessageInline(text.slice(from, closer))));
      i = closer + delimiter.length;
      continue;
    }

    buffer += char;
    i++;
  }
  flush();
  return mergeText(nodes);
}

function readStyled(
  text: string,
  start: number,
  unclosed: Set<Delimiter>,
): { delimiter: Delimiter; from: number; closer: number } | null {
  for (const delimiter of DELIMITERS) {
    if (unclosed.has(delimiter) || !text.startsWith(delimiter, start)) {
      continue;
    }
    if (!opens(text, start, delimiter)) continue;

    const from = start + delimiter.length;
    const closer = findCloser(text, from, delimiter);
    if (closer === -1) {
      unclosed.add(delimiter);
      continue;
    }
    return { delimiter, from, closer };
  }
  return null;
}

function opens(text: string, start: number, delimiter: Delimiter): boolean {
  const next = text[start + delimiter.length];
  if (next === undefined || WHITESPACE.test(next)) return false;
  if (delimiter === "*" && next === "*") return false;
  if (delimiter === "_") return !WORD_CHAR.test(text[start - 1] ?? "");
  return true;
}

function findCloser(text: string, from: number, delimiter: Delimiter): number {
  let j = from;
  while (j < text.length) {
    const char = text[j];

    if (char === "\\" && ESCAPABLE.includes(text[j + 1] ?? "")) {
      j += 2;
      continue;
    }
    const mention = mentionAt(text, j);
    if (mention) {
      j += mention.length;
      continue;
    }
    if (char === "`") {
      const span = readCodeSpan(text, j);
      j = span ? span.end : j + runLength(text, j, "`");
      continue;
    }

    const afterText = j > from && !WHITESPACE.test(text[j - 1]);

    if (
      char === "*" &&
      (delimiter === "*" || delimiter === "**" || delimiter === "***")
    ) {
      const run = runLength(text, j, "*");
      if (afterText && run >= delimiter.length) {
        if (!(delimiter === "*" && run === 2)) {
          return j + run - delimiter.length;
        }
      }
      if (delimiter === "*" && run === 2) {
        const inner = findCloser(text, j + 2, "**");
        j = inner === -1 ? j + 2 : inner + 2;
        continue;
      }
      j += run;
      continue;
    }

    if (delimiter === "~~" && text.startsWith("~~", j) && afterText) {
      return j;
    }

    if (
      delimiter === "_" &&
      char === "_" &&
      afterText &&
      !WORD_CHAR.test(text[j + 1] ?? "")
    ) {
      return j;
    }

    j++;
  }
  return -1;
}

function wrap(delimiter: Delimiter, children: MessageInline[]): MessageInline {
  switch (delimiter) {
    case "***":
      return { kind: "bold", children: [{ kind: "italic", children }] };
    case "**":
      return { kind: "bold", children };
    case "~~":
      return { kind: "strike", children };
    default:
      return { kind: "italic", children };
  }
}

function readCodeSpan(
  text: string,
  start: number,
): { value: string; end: number } | null {
  const run = runLength(text, start, "`");
  const fence = "`".repeat(run);
  let search = start + run;
  while (search < text.length) {
    const close = text.indexOf(fence, search);
    if (close === -1) return null;
    const closeRun = runLength(text, close, "`");
    if (closeRun === run) {
      let value = text.slice(start + run, close);
      if (
        value.length > 2 &&
        value.startsWith(" ") &&
        value.endsWith(" ") &&
        value.trim() !== ""
      ) {
        value = value.slice(1, -1);
      }
      if (value === "") return null;
      return { value, end: close + run };
    }
    search = close + closeRun;
  }
  return null;
}

function mentionAt(text: string, index: number): string | null {
  if (text[index] !== "<") return null;
  MENTION_AT.lastIndex = index;
  const match = MENTION_AT.exec(text);
  return match ? match[0] : null;
}

function runLength(text: string, start: number, char: string): number {
  let end = start;
  while (text[end] === char) end++;
  return end - start;
}

function mergeText(nodes: MessageInline[]): MessageInline[] {
  const merged: MessageInline[] = [];
  for (const node of nodes) {
    const last = merged[merged.length - 1];
    if (node.kind === "text" && last?.kind === "text") {
      merged[merged.length - 1] = {
        kind: "text",
        value: last.value + node.value,
      };
    } else {
      merged.push(node);
    }
  }
  return merged;
}

export function stripMessageMarkdown(content: string): string {
  return parseMessageMarkdown(content)
    .map((block) => {
      switch (block.kind) {
        case "code-block":
          return block.value;
        case "list":
          return block.items.map(inlineText).join("\n");
        default:
          return inlineText(block.children);
      }
    })
    .join("\n");
}

function inlineText(nodes: readonly MessageInline[]): string {
  return nodes
    .map((node) =>
      "children" in node ? inlineText(node.children) : node.value,
    )
    .join("");
}

export type MarkdownStyle =
  | "bold"
  | "italic"
  | "strike"
  | "code"
  | "marker"
  | "heading-1"
  | "heading-2"
  | "heading-3"
  | "quote"
  | "code-block";

/** Un tramo del texto (`start` incluido, `end` excluido) y el estilo que lleva. */
export interface MarkdownRange {
  start: number;
  end: number;
  style: MarkdownStyle;
}

const DELIMITER_STYLES: Record<Delimiter, MarkdownStyle[]> = {
  "***": ["bold", "italic"],
  "**": ["bold"],
  "~~": ["strike"],
  "*": ["italic"],
  _: ["italic"],
};

export function messageMarkdownRanges(content: string): MarkdownRange[] {
  const lines = content.split("\n");
  const starts: number[] = [];
  let offset = 0;
  for (const line of lines) {
    starts.push(offset);
    offset += line.length + 1;
  }

  const ranges: MarkdownRange[] = [];
  const add = (start: number, end: number, style: MarkdownStyle) => {
    if (end > start) ranges.push({ start, end, style });
  };
  const paragraph = { start: -1, end: -1 };
  const flushParagraph = () => {
    if (paragraph.start !== -1) {
      inlineRanges(
        content.slice(paragraph.start, paragraph.end),
        paragraph.start,
        ranges,
      );
    }
    paragraph.start = -1;
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const start = starts[i];
    const end = start + line.length;

    const code = readCodeBlock(lines, i);
    if (code) {
      flushParagraph();
      const block = code.block as Extract<MessageBlock, { kind: "code-block" }>;
      if (block.language !== null || line.trim() === FENCE) {
        add(start, end, "marker");
      } else {
        add(start, start + FENCE.length, "marker");
        add(start + FENCE.length, end, "code-block");
      }
      for (let j = i + 1; j < code.next; j++) {
        const lineStart = starts[j];
        const lineEnd = lineStart + lines[j].length;
        if (j === code.next - 1) {
          const fence = lineStart + lines[j].trimEnd().length - FENCE.length;
          add(lineStart, fence, "code-block");
          add(fence, fence + FENCE.length, "marker");
        } else {
          add(lineStart, lineEnd, "code-block");
        }
      }
      i = code.next;
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      flushParagraph();
      const prefix = line.length - heading[2].length;
      add(start, end, `heading-${heading[1].length}` as MarkdownStyle);
      add(start, start + prefix, "marker");
      inlineRanges(heading[2], start + prefix, ranges);
      i++;
      continue;
    }

    const item = LIST_ITEM.exec(line);
    if (item) {
      flushParagraph();
      const prefix = line.length - item[1].length;
      add(start, start + prefix, "marker");
      inlineRanges(item[1], start + prefix, ranges);
      i++;
      continue;
    }

    const quote = QUOTE.exec(line);
    if (quote) {
      flushParagraph();
      const prefix = Math.min(2, line.length);
      add(start, end, "quote");
      add(start, start + prefix, "marker");
      inlineRanges(quote[1] ?? "", start + prefix, ranges);
      i++;
      continue;
    }

    if (paragraph.start === -1) paragraph.start = start;
    paragraph.end = end;
    i++;
  }
  flushParagraph();
  return ranges;
}

function inlineRanges(text: string, base: number, out: MarkdownRange[]) {
  const unclosed = new Set<Delimiter>();
  const add = (start: number, end: number, style: MarkdownStyle) => {
    if (end > start) out.push({ start: base + start, end: base + end, style });
  };

  let i = 0;
  while (i < text.length) {
    const char = text[i];

    if (char === "\\" && ESCAPABLE.includes(text[i + 1] ?? "")) {
      add(i, i + 1, "marker");
      i += 2;
      continue;
    }

    const mention = mentionAt(text, i);
    if (mention) {
      i += mention.length;
      continue;
    }

    if (char === "`") {
      const run = runLength(text, i, "`");
      const span = readCodeSpan(text, i);
      if (span) {
        add(i, i + run, "marker");
        add(i + run, span.end - run, "code");
        add(span.end - run, span.end, "marker");
        i = span.end;
      } else {
        i += run;
      }
      continue;
    }

    const styled = readStyled(text, i, unclosed);
    if (styled) {
      const { delimiter, from, closer } = styled;
      add(i, from, "marker");
      for (const style of DELIMITER_STYLES[delimiter]) add(from, closer, style);
      add(closer, closer + delimiter.length, "marker");
      inlineRanges(text.slice(from, closer), base + from, out);
      i = closer + delimiter.length;
      continue;
    }

    i++;
  }
}

export function messageCodeRanges(content: string): MarkdownRange[] {
  return messageMarkdownRanges(content).filter(
    (range) => range.style === "code" || range.style === "code-block",
  );
}

import { type MessageToken, tokenizeMessageContent } from "./message-content";
import { ROLE_TOKEN_SOURCE, USER_TOKEN_SOURCE } from "./mention-tokens";

export type MessageInline =
  | MessageToken
  | {
      kind: "bold" | "italic" | "underline" | "strike" | "spoiler";
      children: MessageInline[];
    }
  | { kind: "link"; url: string; children: MessageInline[] }
  | { kind: "code"; value: string };

export interface MessageListItem {
  children: MessageInline[];
  lists: MessageList[];
}

export interface MessageList {
  kind: "list";
  ordered: boolean;
  start: number;
  items: MessageListItem[];
}

export type MessageBlock =
  | { kind: "paragraph"; children: MessageInline[] }
  | { kind: "heading"; level: 1 | 2 | 3; children: MessageInline[] }
  | { kind: "subtext"; children: MessageInline[] }
  | MessageList
  | { kind: "quote"; children: MessageInline[] }
  | { kind: "code-block"; language: string | null; value: string };

export const SPOILER_PREVIEW_TEXT = "(spoiler)";

const HEADING = /^(#{1,3}) +(\S.*)$/;
const SUBTEXT = /^-# +(\S.*)$/;
const LIST_ITEM = /^([ \t]*)(?:[-*]|(\d{1,9})\.) +(\S.*)$/;
const QUOTE = /^>(?: (.*))?$/;
const QUOTE_REST = /^>>>(?: (.*))?$/;
const FENCE = "```";
const CODE_LANGUAGE = /^[\w+#.-]+$/;

const ESCAPABLE = "\\*_~`#>-|[].";
const WORD_CHAR = /[A-Za-z0-9À-ſ]/;
const WHITESPACE = /\s/;
const MENTION_AT = new RegExp(`${ROLE_TOKEN_SOURCE}|${USER_TOKEN_SOURCE}`, "y");
const URL_AT = /https?:\/\/[^\s<>]+/y;
const MASKED_URL_AT = /\((https?:\/\/[^\s<>()]+)\)/y;
const URL_TRAILING = ".,:;!?'\"*_~|";

type Delimiter = "***" | "___" | "**" | "__" | "~~" | "||" | "*" | "_";
const DELIMITERS: readonly Delimiter[] = [
  "***",
  "___",
  "**",
  "__",
  "~~",
  "||",
  "*",
  "_",
];

interface ListEntry {
  indent: number;
  number: number | null;
  text: string;
}

export function parseMessageMarkdown(content: string): MessageBlock[] {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  const blocks: MessageBlock[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    const text = trimBlankLines(paragraph);
    if (text !== "") {
      blocks.push({ kind: "paragraph", children: parseMessageInline(text) });
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

    const subtext = SUBTEXT.exec(line);
    if (subtext) {
      flushParagraph();
      blocks.push({
        kind: "subtext",
        children: parseMessageInline(subtext[1]),
      });
      i++;
      continue;
    }

    if (LIST_ITEM.test(line)) {
      flushParagraph();
      const entries: ListEntry[] = [];
      let item: RegExpExecArray | null;
      while (i < lines.length && (item = LIST_ITEM.exec(lines[i]))) {
        entries.push({
          indent: item[1].length,
          number: item[2] === undefined ? null : Number(item[2]),
          text: item[3],
        });
        i++;
      }
      blocks.push(...buildLists(entries));
      continue;
    }

    const rest = QUOTE_REST.exec(line);
    if (rest) {
      flushParagraph();
      const quoted = trimBlankLines([rest[1] ?? "", ...lines.slice(i + 1)]);
      if (quoted !== "") {
        blocks.push({ kind: "quote", children: parseMessageInline(quoted) });
      }
      break;
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

function trimBlankLines(lines: readonly string[]): string {
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start].trim() === "") start++;
  while (end > start && lines[end - 1].trim() === "") end--;
  return lines.slice(start, end).join("\n");
}

/**
 * Arma las listas a partir de renglones seguidos de viñetas o numeros. Un
 * renglon con mas sangria que el anterior queda anidado debajo de ese item.
 */
function buildLists(entries: readonly ListEntry[]): MessageList[] {
  let i = 0;

  const level = (parentIndent: number): MessageList[] => {
    const lists: MessageList[] = [];
    while (i < entries.length && entries[i].indent > parentIndent) {
      const entry = entries[i];
      const ordered = entry.number !== null;
      let list = lists[lists.length - 1];
      if (!list || list.ordered !== ordered) {
        list = { kind: "list", ordered, start: entry.number ?? 1, items: [] };
        lists.push(list);
      }
      i++;
      const nested =
        i < entries.length && entries[i].indent > entry.indent
          ? level(entry.indent)
          : [];
      list.items.push({
        children: parseMessageInline(entry.text),
        lists: nested,
      });
    }
    return lists;
  };

  return level(-1);
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
  return parseInline(text, true);
}

/** `allowLinks` es falso dentro del texto de un link: no se anidan links. */
function parseInline(text: string, allowLinks: boolean): MessageInline[] {
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

    const link = allowLinks ? readLink(text, i) : null;
    if (link) {
      flush();
      nodes.push({
        kind: "link",
        url: link.url,
        children: link.label
          ? parseInline(text.slice(link.label.start, link.label.end), false)
          : [{ kind: "text", value: link.url }],
      });
      i = link.end;
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
      nodes.push(
        wrap(delimiter, parseInline(text.slice(from, closer), allowLinks)),
      );
      i = closer + delimiter.length;
      continue;
    }

    buffer += char;
    i++;
  }
  flush();
  return mergeText(nodes);
}

interface LinkMatch {
  url: string;
  /** Donde esta el texto visible de un `[texto](url)`; null en un link suelto. */
  label: { start: number; end: number } | null;
  end: number;
}

function readLink(text: string, start: number): LinkMatch | null {
  return text[start] === "["
    ? readMaskedLink(text, start)
    : readUrl(text, start);
}

function readUrl(text: string, start: number): LinkMatch | null {
  if (text[start] !== "h" || WORD_CHAR.test(text[start - 1] ?? "")) {
    return null;
  }
  URL_AT.lastIndex = start;
  const match = URL_AT.exec(text);
  if (!match) return null;

  let url = match[0];
  for (;;) {
    const last = url[url.length - 1];
    if (URL_TRAILING.includes(last)) {
      url = url.slice(0, -1);
    } else if (last === ")" && count(url, "(") < count(url, ")")) {
      url = url.slice(0, -1);
    } else {
      break;
    }
  }
  if (!/^https?:\/\/[^/]/.test(url)) return null;
  return { url, label: null, end: start + url.length };
}

function readMaskedLink(text: string, start: number): LinkMatch | null {
  let j = start + 1;
  while (j < text.length && text[j] !== "]") {
    if (text[j] === "\n" || text[j] === "[") return null;
    j += text[j] === "\\" && ESCAPABLE.includes(text[j + 1] ?? "") ? 2 : 1;
  }
  if (j >= text.length || text.slice(start + 1, j).trim() === "") return null;

  MASKED_URL_AT.lastIndex = j + 1;
  const match = MASKED_URL_AT.exec(text);
  if (!match) return null;
  return {
    url: match[1],
    label: { start: start + 1, end: j },
    end: j + 1 + match[0].length,
  };
}

function count(text: string, char: string): number {
  return text.split(char).length - 1;
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
  if (delimiter === "_" && next === "_") return false;
  if (delimiter[0] === "_") return !WORD_CHAR.test(text[start - 1] ?? "");
  return true;
}

function findCloser(text: string, from: number, delimiter: Delimiter): number {
  const family = delimiter[0];
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
    const link = readLink(text, j);
    if (link) {
      j = link.end;
      continue;
    }
    if (char === "`") {
      const span = readCodeSpan(text, j);
      j = span ? span.end : j + runLength(text, j, "`");
      continue;
    }

    const afterText = j > from && !WHITESPACE.test(text[j - 1]);

    if ((family === "*" || family === "_") && char === family) {
      const run = runLength(text, j, char);
      const single = delimiter.length === 1;
      if (afterText && run >= delimiter.length && !(single && run === 2)) {
        const atWordEnd = !WORD_CHAR.test(text[j + run] ?? "");
        if (family === "*" || atWordEnd) return j + run - delimiter.length;
      }
      if (single && run === 2) {
        const inner = findCloser(text, j + 2, `${char}${char}` as Delimiter);
        j = inner === -1 ? j + 2 : inner + 2;
        continue;
      }
      j += run;
      continue;
    }

    if (
      (delimiter === "~~" || delimiter === "||") &&
      text.startsWith(delimiter, j) &&
      afterText
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
    case "___":
      return { kind: "underline", children: [{ kind: "italic", children }] };
    case "**":
      return { kind: "bold", children };
    case "__":
      return { kind: "underline", children };
    case "~~":
      return { kind: "strike", children };
    case "||":
      return { kind: "spoiler", children };
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

/**
 * Texto plano del mensaje, sin simbolos de formato. Los spoilers se reemplazan
 * por `SPOILER_PREVIEW_TEXT` para no revelar su contenido.
 */
export function stripMessageMarkdown(content: string): string {
  return parseMessageMarkdown(content)
    .flatMap((block) => {
      switch (block.kind) {
        case "code-block":
          return [block.value];
        case "list":
          return listText(block);
        default:
          return [inlineText(block.children)];
      }
    })
    .join("\n");
}

function listText(list: MessageList): string[] {
  return list.items.flatMap((item) => [
    inlineText(item.children),
    ...item.lists.flatMap(listText),
  ]);
}

function inlineText(nodes: readonly MessageInline[]): string {
  return nodes
    .map((node) => {
      if (node.kind === "spoiler") return SPOILER_PREVIEW_TEXT;
      return "children" in node ? inlineText(node.children) : node.value;
    })
    .join("");
}

export type MarkdownStyle =
  | "bold"
  | "italic"
  | "underline"
  | "strike"
  | "spoiler"
  | "link"
  | "code"
  | "marker"
  | "heading-1"
  | "heading-2"
  | "heading-3"
  | "subtext"
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
  ___: ["underline", "italic"],
  "**": ["bold"],
  __: ["underline"],
  "~~": ["strike"],
  "||": ["spoiler"],
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
        true,
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
    const subtext = heading ? null : SUBTEXT.exec(line);
    const item = heading || subtext ? null : LIST_ITEM.exec(line);
    const prefixed = heading ?? subtext ?? item;
    if (prefixed) {
      flushParagraph();
      const text = prefixed[prefixed.length - 1];
      const prefix = line.length - text.length;
      if (heading)
        add(start, end, `heading-${heading[1].length}` as MarkdownStyle);
      if (subtext) add(start, end, "subtext");
      add(start, start + prefix, "marker");
      inlineRanges(text, start + prefix, true, ranges);
      i++;
      continue;
    }

    if (QUOTE_REST.test(line)) {
      flushParagraph();
      const prefix = Math.min(4, line.length);
      for (let j = i; j < lines.length; j++) {
        add(starts[j], starts[j] + lines[j].length, "quote");
      }
      add(start, start + prefix, "marker");
      inlineRanges(content.slice(start + prefix), start + prefix, true, ranges);
      break;
    }

    const quote = QUOTE.exec(line);
    if (quote) {
      flushParagraph();
      const prefix = Math.min(2, line.length);
      add(start, end, "quote");
      add(start, start + prefix, "marker");
      inlineRanges(quote[1] ?? "", start + prefix, true, ranges);
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

function inlineRanges(
  text: string,
  base: number,
  allowLinks: boolean,
  out: MarkdownRange[],
) {
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

    const link = allowLinks ? readLink(text, i) : null;
    if (link) {
      if (link.label) {
        const { start, end } = link.label;
        add(i, start, "marker");
        add(start, end, "link");
        inlineRanges(text.slice(start, end), base + start, false, out);
        add(end, link.end, "marker");
      } else {
        add(i, link.end, "link");
      }
      i = link.end;
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
      inlineRanges(text.slice(from, closer), base + from, allowLinks, out);
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

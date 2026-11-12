import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import c from "highlight.js/lib/languages/c";
import cpp from "highlight.js/lib/languages/cpp";
import csharp from "highlight.js/lib/languages/csharp";
import css from "highlight.js/lib/languages/css";
import go from "highlight.js/lib/languages/go";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import kotlin from "highlight.js/lib/languages/kotlin";
import python from "highlight.js/lib/languages/python";
import rust from "highlight.js/lib/languages/rust";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";

export type CodeTokenKind =
  | "keyword"
  | "string"
  | "number"
  | "comment"
  | "function"
  | "type"
  | "attribute";

export interface CodeToken {
  text: string;
  kind: CodeTokenKind | null;
}

/** Bloques mas largos que esto se muestran sin color. */
export const CODE_HIGHLIGHT_MAX_LENGTH = 20_000;

const highlighter = hljs.newInstance();
const LANGUAGES = {
  bash,
  c,
  cpp,
  csharp,
  css,
  go,
  java,
  javascript,
  json,
  kotlin,
  python,
  rust,
  sql,
  typescript,
  xml,
};
for (const [name, language] of Object.entries(LANGUAGES)) {
  highlighter.registerLanguage(name, language);
}

const SCOPE_KINDS: Record<string, CodeTokenKind | null> = {
  keyword: "keyword",
  "selector-tag": "keyword",
  meta: "keyword",
  doctag: "keyword",
  string: "string",
  regexp: "string",
  symbol: "string",
  char: "string",
  number: "number",
  literal: "number",
  comment: "comment",
  quote: "comment",
  title: "function",
  "title.function": "function",
  "title.function.invoke": "function",
  section: "function",
  "title.class": "type",
  "title.class.inherited": "type",
  type: "type",
  built_in: "type",
  class: "type",
  name: "type",
  tag: "type",
  attr: "attribute",
  attribute: "attribute",
  property: "attribute",
  variable: "attribute",
  "template-variable": "attribute",
  "selector-class": "attribute",
  "selector-id": "attribute",
  subst: null,
};

const HTML_PART = /<span class="([^"]*)">|<\/span>|[^<]+/g;
const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#x27;": "'",
};

export function isHighlightLanguage(language: string): boolean {
  return highlighter.getLanguage(language.toLowerCase()) !== undefined;
}

export function highlightCode(
  code: string,
  language: string,
): CodeToken[] | null {
  if (code.length > CODE_HIGHLIGHT_MAX_LENGTH) return null;
  if (!isHighlightLanguage(language)) return null;

  const html = highlighter.highlight(code, {
    language: language.toLowerCase(),
    ignoreIllegals: true,
  }).value;

  const tokens: CodeToken[] = [];
  const scopes: string[] = [];
  for (const [part, classes] of html.matchAll(HTML_PART)) {
    if (classes !== undefined) {
      scopes.push(scopeOf(classes));
    } else if (part === "</span>") {
      scopes.pop();
    } else {
      push(tokens, decode(part), kindOf(scopes));
    }
  }
  return tokens;
}

function scopeOf(classes: string): string {
  return classes
    .split(" ")
    .map((name) => name.replace(/^hljs-/, "").replace(/_+$/, ""))
    .join(".");
}

function kindOf(scopes: readonly string[]): CodeTokenKind | null {
  for (let i = scopes.length - 1; i >= 0; i--) {
    const scope = scopes[i];
    if (scope in SCOPE_KINDS) return SCOPE_KINDS[scope];
    const base = scope.split(".")[0];
    if (base in SCOPE_KINDS) return SCOPE_KINDS[base];
  }
  return null;
}

function decode(text: string): string {
  return text.replace(
    /&(?:amp|lt|gt|quot|#x27);/g,
    (entity) => ENTITIES[entity],
  );
}

function push(tokens: CodeToken[], text: string, kind: CodeTokenKind | null) {
  const last = tokens[tokens.length - 1];
  if (last && last.kind === kind) {
    last.text += text;
  } else {
    tokens.push({ text, kind });
  }
}

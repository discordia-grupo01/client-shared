import { describe, expect, it } from "vitest";

import {
  type MarkdownRange,
  messageMarkdownRanges,
  parseMessageInline,
  parseMessageMarkdown,
  stripMessageMarkdown,
} from "./message-markdown";

const ROLE_ID = "3b1c2d4e-1111-4222-8333-444455556666";
const text = (value: string) => ({ kind: "text", value });

describe("parseMessageInline", () => {
  it("texto sin formato queda igual", () => {
    expect(parseMessageInline("hola a todos")).toEqual([text("hola a todos")]);
  });

  it("negrita, cursiva y tachado", () => {
    expect(parseMessageInline("**a** *b* _c_ ~~d~~")).toEqual([
      { kind: "bold", children: [text("a")] },
      text(" "),
      { kind: "italic", children: [text("b")] },
      text(" "),
      { kind: "italic", children: [text("c")] },
      text(" "),
      { kind: "strike", children: [text("d")] },
    ]);
  });

  it("*** es negrita y cursiva a la vez", () => {
    expect(parseMessageInline("***hola***")).toEqual([
      {
        kind: "bold",
        children: [{ kind: "italic", children: [text("hola")] }],
      },
    ]);
  });

  it("formatos anidados", () => {
    expect(parseMessageInline("**negrita *y cursiva***")).toEqual([
      {
        kind: "bold",
        children: [
          text("negrita "),
          { kind: "italic", children: [text("y cursiva")] },
        ],
      },
    ]);
    expect(parseMessageInline("*cursiva **y negrita** fin*")).toEqual([
      {
        kind: "italic",
        children: [
          text("cursiva "),
          { kind: "bold", children: [text("y negrita")] },
          text(" fin"),
        ],
      },
    ]);
  });

  it("codigo en linea no interpreta formato ni menciones", () => {
    expect(parseMessageInline("usa `**x** <@u1>` asi")).toEqual([
      text("usa "),
      { kind: "code", value: "**x** <@u1>" },
      text(" asi"),
    ]);
  });

  it("codigo con doble backtick puede contener un backtick", () => {
    expect(parseMessageInline("`` a`b ``")).toEqual([
      { kind: "code", value: "a`b" },
    ]);
  });

  it("delimitadores sin cerrar quedan como texto", () => {
    expect(parseMessageInline("**hola")).toEqual([text("**hola")]);
    expect(parseMessageInline("a ` b")).toEqual([text("a ` b")]);
    expect(parseMessageInline("~~x")).toEqual([text("~~x")]);
  });

  it("un asterisco seguido de espacio no abre cursiva", () => {
    expect(parseMessageInline("2 * 3 * 4")).toEqual([text("2 * 3 * 4")]);
  });

  it("el guion bajo dentro de una palabra no es cursiva", () => {
    expect(parseMessageInline("mi_variable_larga")).toEqual([
      text("mi_variable_larga"),
    ]);
  });

  it("la barra invertida escapa los simbolos", () => {
    expect(parseMessageInline("\\*no es cursiva\\*")).toEqual([
      text("*no es cursiva*"),
    ]);
    expect(parseMessageInline("\\#general")).toEqual([text("#general")]);
  });

  it("una barra invertida comun queda tal cual", () => {
    expect(parseMessageInline("C:\\Users")).toEqual([text("C:\\Users")]);
  });

  it("las menciones siguen funcionando dentro del formato", () => {
    expect(parseMessageInline(`**hola <@u_1_x> y <@&${ROLE_ID}>**`)).toEqual([
      {
        kind: "bold",
        children: [
          text("hola "),
          { kind: "user", value: "<@u_1_x>", id: "u_1_x" },
          text(" y "),
          { kind: "role", value: `<@&${ROLE_ID}>`, id: ROLE_ID },
        ],
      },
    ]);
  });

  it("los guiones bajos de una mencion no abren cursiva", () => {
    expect(parseMessageInline("_<@a_b>_")).toEqual([
      {
        kind: "italic",
        children: [{ kind: "user", value: "<@a_b>", id: "a_b" }],
      },
    ]);
  });

  it("@everyone y #canal siguen siendo tokens", () => {
    expect(parseMessageInline("*@everyone* mira #general")).toEqual([
      { kind: "italic", children: [{ kind: "everyone", value: "@everyone" }] },
      text(" mira "),
      { kind: "channel", value: "#general" },
    ]);
  });
});

describe("parseMessageMarkdown", () => {
  it("un mensaje comun es un solo parrafo con sus saltos de linea", () => {
    expect(parseMessageMarkdown("hola\nque tal")).toEqual([
      { kind: "paragraph", children: [text("hola\nque tal")] },
    ]);
  });

  it("titulos de tres tamaños", () => {
    expect(parseMessageMarkdown("# Uno\n## Dos\n### Tres")).toEqual([
      { kind: "heading", level: 1, children: [text("Uno")] },
      { kind: "heading", level: 2, children: [text("Dos")] },
      { kind: "heading", level: 3, children: [text("Tres")] },
    ]);
  });

  it("sin espacio despues del # no es titulo, es canal", () => {
    expect(parseMessageMarkdown("#general")).toEqual([
      { kind: "paragraph", children: [{ kind: "channel", value: "#general" }] },
    ]);
  });

  it("#### o mas no es titulo", () => {
    expect(parseMessageMarkdown("#### hola")).toEqual([
      { kind: "paragraph", children: [text("#### hola")] },
    ]);
  });

  it("viñetas con - o * se agrupan en una lista", () => {
    expect(parseMessageMarkdown("Compras:\n- pan\n* **leche**\nfin")).toEqual([
      { kind: "paragraph", children: [text("Compras:")] },
      {
        kind: "list",
        items: [[text("pan")], [{ kind: "bold", children: [text("leche")] }]],
      },
      { kind: "paragraph", children: [text("fin")] },
    ]);
  });

  it("un guion sin espacio no es viñeta", () => {
    expect(parseMessageMarkdown("-5 grados")).toEqual([
      { kind: "paragraph", children: [text("-5 grados")] },
    ]);
  });

  it("citas consecutivas forman un solo bloque", () => {
    expect(parseMessageMarkdown("> uno\n> *dos*\n>\nfuera")).toEqual([
      {
        kind: "quote",
        children: [
          text("uno\n"),
          { kind: "italic", children: [text("dos")] },
          text("\n"),
        ],
      },
      { kind: "paragraph", children: [text("fuera")] },
    ]);
  });

  it(">sin espacio no es cita", () => {
    expect(parseMessageMarkdown(">hola")).toEqual([
      { kind: "paragraph", children: [text(">hola")] },
    ]);
  });

  it("bloque de codigo con lenguaje, sin interpretar su contenido", () => {
    expect(
      parseMessageMarkdown("mira:\n```js\nconst a = **b**;\n# no\n```\nlisto"),
    ).toEqual([
      { kind: "paragraph", children: [text("mira:")] },
      {
        kind: "code-block",
        language: "js",
        value: "const a = **b**;\n# no",
      },
      { kind: "paragraph", children: [text("listo")] },
    ]);
  });

  it("bloque de codigo sin lenguaje y cerrado al final de un renglon", () => {
    expect(parseMessageMarkdown("```\nuno\ndos```")).toEqual([
      { kind: "code-block", language: null, value: "uno\ndos" },
    ]);
  });

  it("codigo de un renglon con tres backticks es codigo en linea", () => {
    expect(parseMessageMarkdown("```hola mundo```")).toEqual([
      {
        kind: "paragraph",
        children: [{ kind: "code", value: "hola mundo" }],
      },
    ]);
  });

  it("un bloque de codigo sin cerrar queda como texto", () => {
    expect(parseMessageMarkdown("```\nhola")).toEqual([
      { kind: "paragraph", children: [text("```\nhola")] },
    ]);
  });

  it("los renglones vacios entre bloques no generan parrafos vacios", () => {
    expect(parseMessageMarkdown("# Titulo\n\ntexto\n\n- a")).toEqual([
      { kind: "heading", level: 1, children: [text("Titulo")] },
      { kind: "paragraph", children: [text("texto")] },
      { kind: "list", items: [[text("a")]] },
    ]);
  });

  it("acepta saltos de linea de Windows", () => {
    expect(parseMessageMarkdown("# a\r\nb")).toEqual([
      { kind: "heading", level: 1, children: [text("a")] },
      { kind: "paragraph", children: [text("b")] },
    ]);
  });
});

describe("stripMessageMarkdown", () => {
  it("saca los simbolos y deja las menciones", () => {
    expect(
      stripMessageMarkdown(
        "# Aviso\n**hola** <@u1>, ~~no~~ `si`\n- uno\n> cita\n```\ncodigo\n```",
      ),
    ).toBe("Aviso\nhola <@u1>, no si\nuno\ncita\ncodigo");
  });

  it("un mensaje sin formato queda igual", () => {
    expect(stripMessageMarkdown("hola, ¿todo bien?")).toBe("hola, ¿todo bien?");
  });
});

describe("messageMarkdownRanges", () => {
  const styled = (content: string) =>
    messageMarkdownRanges(content).map(
      ({ start, end, style }: MarkdownRange) =>
        `${style}:${content.slice(start, end)}`,
    );

  it("marca los simbolos y el texto con formato", () => {
    expect(styled("a **b** c")).toEqual(["marker:**", "bold:b", "marker:**"]);
  });

  it("*** marca negrita y cursiva", () => {
    expect(styled("***x***")).toEqual([
      "marker:***",
      "bold:x",
      "italic:x",
      "marker:***",
    ]);
  });

  it("formatos anidados", () => {
    expect(styled("**a ~~b~~**")).toEqual([
      "marker:**",
      "bold:a ~~b~~",
      "marker:**",
      "marker:~~",
      "strike:b",
      "marker:~~",
    ]);
  });

  it("codigo en linea y escapes", () => {
    expect(styled("`x` \\*y")).toEqual([
      "marker:`",
      "code:x",
      "marker:`",
      "marker:\\",
    ]);
  });

  it("titulos, viñetas y citas en su renglon", () => {
    expect(styled("hola\n## *T*\n- uno\n> cita")).toEqual([
      "heading-2:## *T*",
      "marker:## ",
      "marker:*",
      "italic:T",
      "marker:*",
      "marker:- ",
      "quote:> cita",
      "marker:> ",
    ]);
  });

  it("bloque de codigo", () => {
    expect(styled("```js\na **b**\n```")).toEqual([
      "marker:```js",
      "code-block:a **b**",
      "marker:```",
    ]);
  });

  it("los formatos de varios renglones de un parrafo usan el offset correcto", () => {
    const content = "uno\ndos **tres**";
    const [, bold] = messageMarkdownRanges(content);
    expect(bold).toEqual({ start: 10, end: 14, style: "bold" });
  });

  it("sin formato no hay tramos", () => {
    expect(messageMarkdownRanges("hola <@u_1> #general")).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";

import {
  type MarkdownRange,
  messageMarkdownRanges,
  parseMessageInline,
  parseMessageMarkdown,
  SPOILER_PREVIEW_TEXT,
  stripMessageMarkdown,
} from "./message-markdown";

const ROLE_ID = "3b1c2d4e-1111-4222-8333-444455556666";
const text = (value: string) => ({ kind: "text", value });
const item = (children: unknown[], lists: unknown[] = []) => ({
  children,
  lists,
});
const bullets = (...items: unknown[]) => ({
  kind: "list",
  ordered: false,
  start: 1,
  items,
});

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

  it("subrayado y spoiler", () => {
    expect(parseMessageInline("__a__ ||b||")).toEqual([
      { kind: "underline", children: [text("a")] },
      text(" "),
      { kind: "spoiler", children: [text("b")] },
    ]);
  });

  it("___ es subrayado y cursiva a la vez", () => {
    expect(parseMessageInline("___hola___")).toEqual([
      {
        kind: "underline",
        children: [{ kind: "italic", children: [text("hola")] }],
      },
    ]);
  });

  it("el doble guion bajo dentro de una palabra no subraya", () => {
    expect(parseMessageInline("mi__var__larga")).toEqual([
      text("mi__var__larga"),
    ]);
  });

  it("spoiler con formato adentro", () => {
    expect(parseMessageInline("||el **final**||")).toEqual([
      {
        kind: "spoiler",
        children: [text("el "), { kind: "bold", children: [text("final")] }],
      },
    ]);
  });

  it("un link suelto se vuelve link", () => {
    expect(parseMessageInline("mira https://ejemplo.com/a_b_c ya")).toEqual([
      text("mira "),
      {
        kind: "link",
        url: "https://ejemplo.com/a_b_c",
        children: [text("https://ejemplo.com/a_b_c")],
      },
      text(" ya"),
    ]);
  });

  it("la puntuacion del final no es parte del link", () => {
    expect(parseMessageInline("(ver https://a.com/x).")).toEqual([
      text("(ver "),
      {
        kind: "link",
        url: "https://a.com/x",
        children: [text("https://a.com/x")],
      },
      text(")."),
    ]);
  });

  it("los parentesis balanceados quedan en el link", () => {
    const url = "https://es.wikipedia.org/wiki/Mate_(bebida)";
    expect(parseMessageInline(url)).toEqual([
      { kind: "link", url, children: [text(url)] },
    ]);
  });

  it("un link adentro de un formato", () => {
    expect(parseMessageInline("**https://a.com**")).toEqual([
      {
        kind: "bold",
        children: [
          {
            kind: "link",
            url: "https://a.com",
            children: [text("https://a.com")],
          },
        ],
      },
    ]);
  });

  it("los simbolos de una url no abren formato", () => {
    expect(parseMessageInline("_ver https://a.com/x_y_")).toEqual([
      {
        kind: "italic",
        children: [
          text("ver "),
          {
            kind: "link",
            url: "https://a.com/x_y",
            children: [text("https://a.com/x_y")],
          },
        ],
      },
    ]);
  });

  it("sin http no es link", () => {
    expect(parseMessageInline("ejemplo.com y ftp://a.com")).toEqual([
      text("ejemplo.com y ftp://a.com"),
    ]);
  });

  it("link con texto", () => {
    expect(
      parseMessageInline("lee [la **guia**](https://a.com/g) hoy"),
    ).toEqual([
      text("lee "),
      {
        kind: "link",
        url: "https://a.com/g",
        children: [text("la "), { kind: "bold", children: [text("guia")] }],
      },
      text(" hoy"),
    ]);
  });

  it("el texto de un link no puede tener otro link", () => {
    expect(parseMessageInline("[https://b.com](https://a.com)")).toEqual([
      {
        kind: "link",
        url: "https://a.com",
        children: [text("https://b.com")],
      },
    ]);
  });

  it("un link con texto sin url valida queda como texto", () => {
    expect(parseMessageInline("[hola](javascript:alert(1))")).toEqual([
      text("[hola](javascript:alert(1))"),
    ]);
    expect(parseMessageInline("[](https://a.com)")).toEqual([
      text("[]("),
      { kind: "link", url: "https://a.com", children: [text("https://a.com")] },
      text(")"),
    ]);
  });

  it("se escapan barras, corchetes y puntos", () => {
    expect(parseMessageInline("\\|\\|no\\|\\| \\[a\\] 1\\.")).toEqual([
      text("||no|| [a] 1."),
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
      bullets(
        item([text("pan")]),
        item([{ kind: "bold", children: [text("leche")] }]),
      ),
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
      bullets(item([text("a")])),
    ]);
  });

  it("acepta saltos de linea de Windows", () => {
    expect(parseMessageMarkdown("# a\r\nb")).toEqual([
      { kind: "heading", level: 1, children: [text("a")] },
      { kind: "paragraph", children: [text("b")] },
    ]);
  });

  it("listas numeradas empiezan en el primer numero", () => {
    expect(parseMessageMarkdown("3. tres\n4. cuatro")).toEqual([
      {
        kind: "list",
        ordered: true,
        start: 3,
        items: [item([text("tres")]), item([text("cuatro")])],
      },
    ]);
  });

  it("un numero sin punto y espacio no es lista", () => {
    expect(parseMessageMarkdown("2024 fue un año\n1.5 kilos")).toEqual([
      { kind: "paragraph", children: [text("2024 fue un año\n1.5 kilos")] },
    ]);
  });

  it("la sangria anida viñetas", () => {
    expect(
      parseMessageMarkdown(
        "- frutas\n  - manzana\n    - roja\n  - pera\n- verduras",
      ),
    ).toEqual([
      bullets(
        item(
          [text("frutas")],
          [
            bullets(
              item([text("manzana")], [bullets(item([text("roja")]))]),
              item([text("pera")]),
            ),
          ],
        ),
        item([text("verduras")]),
      ),
    ]);
  });

  it("una lista numerada dentro de una de viñetas", () => {
    expect(parseMessageMarkdown("- pasos\n  1. abrir\n  2. cerrar")).toEqual([
      bullets(
        item(
          [text("pasos")],
          [
            {
              kind: "list",
              ordered: true,
              start: 1,
              items: [item([text("abrir")]), item([text("cerrar")])],
            },
          ],
        ),
      ),
    ]);
  });

  it("viñetas y numeros seguidos al mismo nivel son dos listas", () => {
    expect(parseMessageMarkdown("- a\n1. b")).toEqual([
      bullets(item([text("a")])),
      { kind: "list", ordered: true, start: 1, items: [item([text("b")])] },
    ]);
  });

  it("texto chico con -#", () => {
    expect(parseMessageMarkdown("hola\n-# editado a mano")).toEqual([
      { kind: "paragraph", children: [text("hola")] },
      { kind: "subtext", children: [text("editado a mano")] },
    ]);
  });

  it("-# sin espacio no es texto chico", () => {
    expect(parseMessageMarkdown("-#hola")).toEqual([
      { kind: "paragraph", children: [text("-#hola")] },
    ]);
  });

  it(">>> cita todo lo que sigue", () => {
    expect(parseMessageMarkdown("antes\n>>> uno\n\n**dos**\n- tres")).toEqual([
      { kind: "paragraph", children: [text("antes")] },
      {
        kind: "quote",
        children: [
          text("uno\n\n"),
          { kind: "bold", children: [text("dos")] },
          text("\n- tres"),
        ],
      },
    ]);
  });

  it(">>> solo en su renglon cita los renglones de abajo", () => {
    expect(parseMessageMarkdown(">>>\nhola")).toEqual([
      { kind: "quote", children: [text("hola")] },
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

  it("aplana las listas anidadas y tapa los spoilers", () => {
    expect(
      stripMessageMarkdown(
        "- a\n  1. b\nel final: ||muere||\n[guia](https://a.com)",
      ),
    ).toBe(`a\nb\nel final: ${SPOILER_PREVIEW_TEXT}\nguia`);
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

  it("subrayado, spoiler y links", () => {
    expect(styled("__a__ ||b|| https://c.com [d](https://e.com)")).toEqual([
      "marker:__",
      "underline:a",
      "marker:__",
      "marker:||",
      "spoiler:b",
      "marker:||",
      "link:https://c.com",
      "marker:[",
      "link:d",
      "marker:](https://e.com)",
    ]);
  });

  it("listas numeradas, anidadas, texto chico y >>>", () => {
    expect(styled("1. a\n  - b\n-# c\n>>> d\ne")).toEqual([
      "marker:1. ",
      "marker:  - ",
      "subtext:-# c",
      "marker:-# ",
      "quote:>>> d",
      "quote:e",
      "marker:>>> ",
    ]);
  });

  it("sin formato no hay tramos", () => {
    expect(messageMarkdownRanges("hola <@u_1> #general")).toEqual([]);
  });
});

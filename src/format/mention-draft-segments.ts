import type { ThemeColors } from "../theme/tokens";
import { hexToRgba } from "./color";
import {
  EVERYONE_MENTION,
  matchPickedMentions,
  type MentionKind,
  type PickedMention,
} from "./mention-tokens";

/** Un tramo del borrador, para dibujarlo: texto comun o una mencion elegida. */
export type DraftSegment =
  | { kind: "text"; value: string }
  | { kind: MentionKind; value: string; id: string }
  | { kind: "everyone"; value: string };

/** Igual que en `messaging` y en el tokenizador: no puede ir pegado a una letra, `@`, `&` o `<`. */
const EVERYONE_PATTERN = new RegExp(
  `(^|[^\\w@&<])(${EVERYONE_MENTION})(?![\\w-])`,
  "g",
);

interface Marked {
  start: number;
  end: number;
  segment: Exclude<DraftSegment, { kind: "text" }>;
}

/**
 * Parte el borrador visible en tramos para resaltar las menciones mientras se
 * escribe. Solo se marca lo que va a funcionar al enviar: las menciones elegidas
 * del selector y, si tiene permiso, `@everyone`. Lo escrito a mano o sin
 * permiso queda como texto comun, igual que lo trata el back.
 */
export function draftSegments(
  draft: string,
  picked: readonly PickedMention[],
  canMentionEveryone: boolean,
): DraftSegment[] {
  const marked: Marked[] = matchPickedMentions(draft, picked).map(
    ({ start, end, mention }) => ({
      start,
      end,
      segment: {
        kind: mention.kind,
        id: mention.id,
        value: draft.slice(start, end),
      },
    }),
  );

  if (canMentionEveryone) {
    for (const match of draft.matchAll(EVERYONE_PATTERN)) {
      const start = (match.index ?? 0) + match[1].length;
      marked.push({
        start,
        end: start + EVERYONE_MENTION.length,
        segment: { kind: "everyone", value: EVERYONE_MENTION },
      });
    }
  }

  marked.sort((a, b) => a.start - b.start);

  const segments: DraftSegment[] = [];
  let cursor = 0;
  for (const { start, end, segment } of marked) {
    if (start < cursor) continue;
    if (start > cursor) {
      segments.push({ kind: "text", value: draft.slice(cursor, start) });
    }
    segments.push(segment);
    cursor = end;
  }
  if (cursor < draft.length) {
    segments.push({ kind: "text", value: draft.slice(cursor) });
  }
  return segments;
}

/** Opacidad del fondo de un chip de mencion. */
const CHIP_BACKGROUND_ALPHA = 0.16;

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

/**
 * Colores de un chip de mencion en el cuadro de texto, una sola definicion para
 * web y mobile: usuario en `sky`, `@everyone` en `highlight` (el mismo amarillo
 * que en los mensajes) y rol con su propio color. Fondo plano, sin bordes
 * redondeados ni relleno: cualquier ancho extra desalinearia el cursor.
 */
export function mentionChipColors(
  kind: DraftSegment["kind"],
  theme: Pick<ThemeColors, "sky" | "highlight">,
  roleColor?: string | null,
): { color: string; backgroundColor: string } | null {
  if (kind === "text") return null;
  const color =
    kind === "everyone"
      ? theme.highlight
      : kind === "role" && roleColor && HEX_COLOR.test(roleColor)
        ? roleColor
        : theme.sky;
  return { color, backgroundColor: hexToRgba(color, CHIP_BACKGROUND_ALPHA) };
}

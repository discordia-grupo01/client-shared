import type { CustomEmojiRef } from "../domain/custom-emoji";
import {
  customEmojiDraftText,
  encodeDraft,
} from "../format/custom-emoji-draft";
import type { PickedMention } from "../format/mention-tokens";
import { messageCodeRanges } from "../format/message-markdown";
import {
  activeMentionQuery,
  type AppliedMention,
  type MentionCandidate,
  type MentionQuery,
  type MentionSources,
  suggestMentions,
} from "./mention-suggestions";

export interface MentionDraftState {
  text: string;
  cursor: number;
  picked: PickedMention[];
  /** Emojis del servidor elegidos: en el texto se ven como `:nombre:`. */
  pickedEmojis: CustomEmojiRef[];
  selectedIndex: number;
  isDismissed: boolean;
}

export type MentionDraftAction =
  | { type: "change"; text: string; cursor: number }
  | { type: "moveCursor"; cursor: number }
  | { type: "moveSelection"; delta: number; count: number }
  | { type: "pick"; applied: AppliedMention }
  | { type: "dismiss" }
  | { type: "append"; text: string }
  | { type: "pickEmoji"; emoji: CustomEmojiRef }
  /** Reemplaza todo el borrador (al empezar a editar un mensaje). */
  | { type: "load"; text: string; picked: PickedMention[] }
  | { type: "reset" };

export function createMentionDraft(
  text = "",
  picked: PickedMention[] = [],
  pickedEmojis: CustomEmojiRef[] = [],
): MentionDraftState {
  return {
    text,
    cursor: text.length,
    picked,
    pickedEmojis,
    selectedIndex: 0,
    isDismissed: false,
  };
}

export function mentionDraftReducer(
  state: MentionDraftState,
  action: MentionDraftAction,
): MentionDraftState {
  switch (action.type) {
    case "change":
      return {
        ...state,
        text: action.text,
        cursor: action.cursor,
        selectedIndex: 0,
        isDismissed: false,
      };
    case "moveCursor":
      return action.cursor === state.cursor
        ? state
        : { ...state, cursor: action.cursor };
    case "moveSelection":
      return {
        ...state,
        selectedIndex:
          action.count === 0
            ? 0
            : (state.selectedIndex + action.delta + action.count) %
              action.count,
      };
    case "pick":
      return {
        ...state,
        text: action.applied.text,
        cursor: action.applied.cursor,
        picked: action.applied.picked
          ? [...state.picked, action.applied.picked]
          : state.picked,
        selectedIndex: 0,
        isDismissed: true,
      };
    case "dismiss":
      return { ...state, isDismissed: true };
    case "append":
      return {
        ...state,
        text: state.text + action.text,
        cursor: state.cursor + action.text.length,
      };
    case "pickEmoji": {
      const text = customEmojiDraftText(action.emoji);
      const isKnown = state.pickedEmojis.some(
        (emoji) => emoji.id === action.emoji.id,
      );
      return {
        ...state,
        text: state.text + text,
        cursor: state.text.length + text.length,
        pickedEmojis: isKnown
          ? state.pickedEmojis
          : [...state.pickedEmojis, action.emoji],
      };
    }
    case "load":
      return createMentionDraft(action.text, action.picked);
    case "reset":
      return createMentionDraft();
  }
}

/** Lo que se calcula a partir del estado: el selector y el texto a enviar. */
export interface MentionDraftView {
  /** El `@algo` que se esta escribiendo; `null` si no hay (o no hay selector). */
  active: MentionQuery | null;
  candidates: MentionCandidate[];
  /** El selector se muestra: hay una mencion en curso, con candidatos, y no se cerro. */
  isOpen: boolean;
  /** Lo que se manda al back: el texto con las menciones elegidas ya como tokens. */
  encoded: string;
}

/** `sources` en `null` es un chat sin menciones (mensajes directos): sin selector. */
export function mentionDraftView(
  state: MentionDraftState,
  sources: MentionSources | null,
): MentionDraftView {
  const active = sources ? activeMentionQuery(state.text, state.cursor) : null;
  const candidates =
    active && sources ? suggestMentions(active.query, sources) : [];
  return {
    active,
    candidates,
    isOpen: candidates.length > 0 && !state.isDismissed,
    encoded: encodeDraft(
      state.text,
      state.picked,
      state.pickedEmojis,
      messageCodeRanges(state.text),
    ),
  };
}

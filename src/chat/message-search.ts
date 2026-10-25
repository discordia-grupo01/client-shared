import { MESSAGE_SEARCH_PAGE_SIZE } from "../constants/limits";
import type { Message } from "../domain/message";
import type {
  MessageSearchQuery,
  SearchMessagesResult,
} from "../domain/message-search";

export type MessageSearchStatus = "idle" | "loading" | "ready" | "error";

export interface MessageSearchPage {
  messages: Message[];
  nextCursor: string | null;
}

export interface MessageSearchState {
  /** Busqueda vigente; `null` antes de la primera. */
  query: MessageSearchQuery | null;
  /** Sube con cada busqueda: las respuestas de una anterior se descartan. */
  searchId: number;
  status: MessageSearchStatus;
  /** Texto del fallo cuando `status` es `error`. */
  error: string | null;
  /** Paginas traidas, en orden: `pages[0]` es la 1. */
  pages: MessageSearchPage[];
  /** Pagina que se muestra (1-based). */
  page: number;
  /** Pagina pedida; mientras no llegue, `status` es `loading`. */
  targetPage: number;
  /** Total de la primera pagina (tope 1000); `null` hasta que llega. */
  total: number | null;
  totalCapped: boolean;
}

export const INITIAL_MESSAGE_SEARCH_STATE: MessageSearchState = {
  query: null,
  searchId: 0,
  status: "idle",
  error: null,
  pages: [],
  page: 1,
  targetPage: 1,
  total: null,
  totalCapped: false,
};

export function startMessageSearch(
  state: MessageSearchState,
  query: MessageSearchQuery,
): MessageSearchState {
  return {
    ...INITIAL_MESSAGE_SEARCH_STATE,
    query,
    searchId: state.searchId + 1,
    status: "loading",
  };
}

export function requestMessageSearchPage(
  state: MessageSearchState,
  page: number,
): MessageSearchState {
  if (state.query === null || page < 1) return state;
  if (page <= state.pages.length) {
    return { ...state, page, targetPage: page, status: "ready", error: null };
  }
  return { ...state, targetPage: page, status: "loading", error: null };
}

export function messageSearchPageLoaded(
  state: MessageSearchState,
  searchId: number,
  pageNumber: number,
  result: SearchMessagesResult,
): MessageSearchState {
  if (searchId !== state.searchId) return state;
  if (pageNumber !== state.pages.length + 1) return state;
  if (!result.ok) {
    return { ...state, status: "error", error: result.message };
  }

  const pages = [
    ...state.pages,
    { messages: result.messages, nextCursor: result.nextCursor },
  ];
  const next: MessageSearchState =
    pageNumber === 1
      ? {
          ...state,
          pages,
          total: result.total ?? result.messages.length,
          totalCapped: result.totalCapped,
        }
      : { ...state, pages };

  const reachedTarget = pageNumber >= state.targetPage;
  const noMorePages = result.nextCursor === null;
  if (!reachedTarget && !noMorePages) return next;
  return {
    ...next,
    status: "ready",
    error: null,
    page: Math.min(state.targetPage, pages.length),
    targetPage: Math.min(state.targetPage, pages.length),
  };
}

export function messageSearchPageCount(
  state: MessageSearchState,
  pageSize: number = MESSAGE_SEARCH_PAGE_SIZE,
): number {
  const loaded = state.pages.length;
  const last = state.pages[loaded - 1];
  // Al pasar el tope el total no alcanza: se habilita una mas mientras haya cursor.
  const reachable = loaded + (last?.nextCursor ? 1 : 0);
  if (state.total === null) return Math.max(1, reachable);
  const fromTotal = Math.ceil(state.total / pageSize);
  return Math.max(
    1,
    state.totalCapped ? Math.max(fromTotal, reachable) : fromTotal,
  );
}

export function messageSearchResults(state: MessageSearchState): Message[] {
  return state.pages[state.page - 1]?.messages ?? [];
}

export function isMessageSearchEmpty(state: MessageSearchState): boolean {
  return state.status === "ready" && state.total === 0;
}

export async function fetchMessageSearchPages(
  state: MessageSearchState,
  fetchPage: (
    query: MessageSearchQuery,
    before: string | null,
  ) => Promise<SearchMessagesResult>,
  onPage: (
    searchId: number,
    pageNumber: number,
    result: SearchMessagesResult,
  ) => void,
): Promise<void> {
  const { query, searchId, targetPage } = state;
  if (query === null) return;
  let pageNumber = state.pages.length + 1;
  let cursor = state.pages[state.pages.length - 1]?.nextCursor ?? null;
  if (pageNumber > 1 && cursor === null) return;

  while (pageNumber <= targetPage) {
    const result = await fetchPage(query, cursor);
    onPage(searchId, pageNumber, result);
    if (!result.ok || result.nextCursor === null) return;
    cursor = result.nextCursor;
    pageNumber += 1;
  }
}

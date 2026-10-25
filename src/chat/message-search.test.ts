import { describe, expect, it, vi } from "vitest";

import type { Message } from "../domain/message";
import type { SearchMessagesResult } from "../domain/message-search";
import {
  fetchMessageSearchPages,
  INITIAL_MESSAGE_SEARCH_STATE,
  isMessageSearchEmpty,
  messageSearchPageCount,
  messageSearchPageLoaded,
  messageSearchResults,
  requestMessageSearchPage,
  startMessageSearch,
} from "./message-search";

function message(id: string): Message {
  return {
    id,
    channel_id: "c1",
    server_id: "s1",
    user_id: "u1",
    content: `deploy ${id}`,
    inserted_at: "2026-10-25T03:00:00.000Z",
  };
}

function page(
  ids: string[],
  nextCursor: string | null,
  total: number | null = null,
  totalCapped = false,
): SearchMessagesResult {
  return {
    ok: true,
    messages: ids.map(message),
    nextCursor,
    total,
    totalCapped,
  };
}

const QUERY = { text: "deploy", authorId: null };

function searched() {
  return startMessageSearch(INITIAL_MESSAGE_SEARCH_STATE, QUERY);
}

describe("busqueda de mensajes paginada", () => {
  it("la primera pagina guarda el total y queda lista", () => {
    const state = messageSearchPageLoaded(
      searched(),
      1,
      1,
      page(["m9", "m8"], "m8", 60),
    );

    expect(state.status).toBe("ready");
    expect(state.total).toBe(60);
    expect(messageSearchResults(state).map((m) => m.id)).toEqual(["m9", "m8"]);
    expect(messageSearchPageCount(state, 25)).toBe(3);
  });

  it("CA 3: sin coincidencias es una busqueda vacia, no un error", () => {
    const state = messageSearchPageLoaded(searched(), 1, 1, page([], null, 0));

    expect(state.status).toBe("ready");
    expect(isMessageSearchEmpty(state)).toBe(true);
    expect(messageSearchPageCount(state)).toBe(1);
  });

  it("descarta respuestas de una busqueda anterior", () => {
    const first = searched();
    const second = startMessageSearch(first, {
      text: "release",
      authorId: null,
    });

    const state = messageSearchPageLoaded(
      second,
      first.searchId,
      1,
      page(["m1"], null, 1),
    );

    expect(state).toBe(second);
  });

  it("volver a una pagina ya traida no pide nada", () => {
    let state = messageSearchPageLoaded(searched(), 1, 1, page(["a"], "a", 50));
    state = requestMessageSearchPage(state, 2);
    state = messageSearchPageLoaded(state, 1, 2, page(["b"], "b"));
    expect(state.page).toBe(2);

    state = requestMessageSearchPage(state, 1);

    expect(state.status).toBe("ready");
    expect(messageSearchResults(state).map((m) => m.id)).toEqual(["a"]);
  });

  it("saltar adelante sigue cargando hasta la pagina pedida", () => {
    let state = messageSearchPageLoaded(searched(), 1, 1, page(["a"], "a", 80));
    state = requestMessageSearchPage(state, 3);
    state = messageSearchPageLoaded(state, 1, 2, page(["b"], "b"));

    expect(state.status).toBe("loading");
    expect(state.page).toBe(1);

    state = messageSearchPageLoaded(state, 1, 3, page(["c"], "c"));
    expect(state.status).toBe("ready");
    expect(state.page).toBe(3);
  });

  it("si se acaban las paginas antes de la pedida, muestra la ultima", () => {
    let state = messageSearchPageLoaded(searched(), 1, 1, page(["a"], "a", 80));
    state = requestMessageSearchPage(state, 3);
    state = messageSearchPageLoaded(state, 1, 2, page(["b"], null));

    expect(state.status).toBe("ready");
    expect(state.page).toBe(2);
  });

  it("ignora una pagina repetida que trajo otra carga en paralelo", () => {
    let state = messageSearchPageLoaded(searched(), 1, 1, page(["a"], "a", 80));
    state = requestMessageSearchPage(state, 2);
    state = messageSearchPageLoaded(state, 1, 2, page(["b"], "b"));

    expect(messageSearchPageLoaded(state, 1, 2, page(["b"], "b"))).toBe(state);
  });

  it("un fallo deja el error y conserva lo ya cargado", () => {
    let state = messageSearchPageLoaded(searched(), 1, 1, page(["a"], "a", 80));
    state = requestMessageSearchPage(state, 2);
    state = messageSearchPageLoaded(state, 1, 2, {
      ok: false,
      message: "falló",
    });

    expect(state.status).toBe("error");
    expect(state.error).toBe("falló");
    expect(state.pages).toHaveLength(1);
  });

  it("con mas de 1000 coincidencias habilita una pagina mas mientras haya cursor", () => {
    const state = messageSearchPageLoaded(
      searched(),
      1,
      1,
      page(["a"], "a", 1000, true),
    );

    expect(messageSearchPageCount(state, 25)).toBe(40);
  });
});

describe("fetchMessageSearchPages", () => {
  it("trae en orden las paginas que faltan, cada una con el cursor de la anterior", async () => {
    let state = messageSearchPageLoaded(searched(), 1, 1, page(["a"], "a", 80));
    state = requestMessageSearchPage(state, 3);
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce(page(["b"], "b"))
      .mockResolvedValueOnce(page(["c"], "c"));
    const onPage = vi.fn();

    await fetchMessageSearchPages(state, fetchPage, onPage);

    expect(fetchPage.mock.calls).toEqual([
      [QUERY, "a"],
      [QUERY, "b"],
    ]);
    expect(onPage.mock.calls.map(([, n]) => n)).toEqual([2, 3]);
  });

  it("la primera pagina va sin cursor y corta si falla", async () => {
    const fetchPage = vi.fn().mockResolvedValue({ ok: false, message: "x" });
    const onPage = vi.fn();

    await fetchMessageSearchPages(searched(), fetchPage, onPage);

    expect(fetchPage).toHaveBeenCalledWith(QUERY, null);
    expect(onPage).toHaveBeenCalledTimes(1);
  });

  it("no pide nada si ya no hay mas paginas", async () => {
    let state = messageSearchPageLoaded(searched(), 1, 1, page(["a"], null, 1));
    state = { ...state, targetPage: 2 };
    const fetchPage = vi.fn();

    await fetchMessageSearchPages(state, fetchPage, vi.fn());

    expect(fetchPage).not.toHaveBeenCalled();
  });
});

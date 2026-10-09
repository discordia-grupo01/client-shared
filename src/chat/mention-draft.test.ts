import { describe, expect, it } from "vitest";

import type { MentionSources } from "./mention-suggestions";
import {
  applyMentionCandidate,
  type MentionCandidate,
} from "./mention-suggestions";
import {
  createMentionDraft,
  type MentionDraftAction,
  mentionDraftReducer,
  mentionDraftView,
} from "./mention-draft";

const sources: MentionSources = {
  members: [
    {
      id: "u_beto",
      name: "Beto",
      avatarUrl: null,
      roleName: null,
      roleColor: null,
    },
    {
      id: "u_ana",
      name: "Ana",
      avatarUrl: null,
      roleName: null,
      roleColor: null,
    },
  ],
  roles: [],
  canMentionEveryone: true,
};

function run(...actions: MentionDraftAction[]) {
  return actions.reduce(mentionDraftReducer, createMentionDraft());
}

describe("mentionDraftReducer", () => {
  it("escribir actualiza texto y cursor y reabre un selector cerrado", () => {
    const state = run(
      { type: "change", text: "@b", cursor: 2 },
      { type: "dismiss" },
      { type: "change", text: "@be", cursor: 3 },
    );
    expect(state).toMatchObject({ text: "@be", cursor: 3, isDismissed: false });
  });

  it("mover el cursor a la misma posicion devuelve el mismo estado", () => {
    const state = createMentionDraft("hola", []);
    expect(mentionDraftReducer(state, { type: "moveCursor", cursor: 4 })).toBe(
      state,
    );
  });

  it("la seleccion da la vuelta en los dos sentidos", () => {
    const down = run(
      { type: "moveSelection", delta: 1, count: 3 },
      { type: "moveSelection", delta: 1, count: 3 },
      { type: "moveSelection", delta: 1, count: 3 },
    );
    expect(down.selectedIndex).toBe(0);
    expect(
      run({ type: "moveSelection", delta: -1, count: 3 }).selectedIndex,
    ).toBe(2);
  });

  it("append agrega al final y mueve el cursor", () => {
    const state = run(
      { type: "change", text: "hola", cursor: 4 },
      { type: "append", text: "😀" },
    );
    expect(state.text).toBe("hola😀");
    expect(state.cursor).toBe(6);
  });

  it("load reemplaza todo el borrador con el de un mensaje a editar", () => {
    const picked = [{ kind: "user" as const, id: "u1", label: "Ana" }];
    const state = run(
      { type: "change", text: "otro", cursor: 4 },
      { type: "load", text: "hola @Ana", picked },
    );
    expect(state).toEqual(createMentionDraft("hola @Ana", picked));
    expect(state.cursor).toBe(9);
  });

  it("reset vuelve al borrador vacio", () => {
    const state = run(
      { type: "change", text: "hola", cursor: 4 },
      { type: "reset" },
    );
    expect(state).toEqual(createMentionDraft());
  });
});

describe("mentionDraftView", () => {
  it("al escribir @ el selector se abre con candidatos", () => {
    const state = run({ type: "change", text: "@", cursor: 1 });
    const view = mentionDraftView(state, sources);
    expect(view.isOpen).toBe(true);
    expect(view.candidates.length).toBeGreaterThan(0);
  });

  it("sin fuentes (un DM) nunca hay selector", () => {
    const state = run({ type: "change", text: "@", cursor: 1 });
    expect(mentionDraftView(state, null).isOpen).toBe(false);
  });

  it("Esc lo cierra hasta que cambie el texto", () => {
    const state = run(
      { type: "change", text: "@be", cursor: 3 },
      { type: "dismiss" },
    );
    expect(mentionDraftView(state, sources).isOpen).toBe(false);
  });

  it("sin coincidencias el selector no se muestra", () => {
    const state = run({ type: "change", text: "@zzz", cursor: 4 });
    expect(mentionDraftView(state, sources).isOpen).toBe(false);
  });

  it("elegir un candidato inserta @Nombre y el envio lleva el token", () => {
    let state = run({ type: "change", text: "Hola @be", cursor: 8 });
    const view = mentionDraftView(state, sources);
    const candidate = view.candidates[0] as MentionCandidate;
    const applied = applyMentionCandidate(state.text, view.active!, candidate);
    state = mentionDraftReducer(state, { type: "pick", applied });

    expect(state.text).toBe("Hola @Beto ");
    expect(mentionDraftView(state, sources).encoded).toBe("Hola <@u_beto> ");
  });

  it("un @Nombre escrito a mano no se convierte", () => {
    const state = run({ type: "change", text: "hola @Beto", cursor: 10 });
    expect(mentionDraftView(state, sources).encoded).toBe("hola @Beto");
  });

  it("el borrador de un mensaje editado conserva sus menciones", () => {
    const state = createMentionDraft("hola @Beto", [
      { kind: "user", id: "u_beto", label: "Beto" },
    ]);
    expect(mentionDraftView(state, sources).encoded).toBe("hola <@u_beto>");
  });
});

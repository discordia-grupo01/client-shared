import { describe, expect, it } from "vitest";

import * as actions from "./actions";
import * as auth from "./auth";
import * as errors from "./errors";
import * as notFound from "./not-found";
import * as permissions from "./permissions";
import { CHANNEL_REASONS, SERVER_REASONS, TRANSFER_REASONS } from "./reasons";

/**
 * Se comparan substrings y no `\bIntenta\b`: en JavaScript sin la flag `u`,
 * `\w` no incluye las vocales acentuadas, asi que `\bIntenta\b` matchea dentro
 * de "Intentá" y el test daria falsos positivos sobre los textos correctos.
 */
const TUTEO = [
  "Intenta de nuevo",
  "Revisa los datos",
  "Ingresa un",
  "Ingresa tu",
  "Inicia sesión",
  "Prueba con",
  "Vuelve a",
  "Elige a",
  "Tienes que",
  "Recarga",
];

/**
 * Faltaban en `web-client`: "salio mal", "Peticion invalida".
 *
 * Los plurales van excluidos porque pierden la tilde de verdad: "invitación"
 * la lleva, "invitaciones" no.
 */
const SIN_TILDE = [
  /salio mal/,
  /Peticion/,
  /invalida/,
  /sesion(?!es)/,
  /invitacion(?!es)/,
];

function todosLosMensajes(): [string, string][] {
  const modulos = { actions, auth, errors, notFound, permissions };
  const catalogos = { SERVER_REASONS, CHANNEL_REASONS, TRANSFER_REASONS };

  const entradas: [string, string][] = [];
  for (const [modulo, exports] of Object.entries(modulos)) {
    for (const [nombre, valor] of Object.entries(exports)) {
      if (typeof valor === "string")
        entradas.push([`${modulo}.${nombre}`, valor]);
    }
  }
  for (const [nombre, catalogo] of Object.entries(catalogos)) {
    for (const [clave, valor] of Object.entries(catalogo)) {
      entradas.push([`${nombre}.${clave}`, valor]);
    }
  }
  return entradas;
}

describe("mensajes al usuario", () => {
  const mensajes = todosLosMensajes();

  it("encuentra algo que revisar", () => {
    expect(mensajes.length).toBeGreaterThan(50);
  });

  it.each(mensajes)("%s esta en voseo", (_nombre, texto) => {
    for (const forma of TUTEO) expect(texto).not.toContain(forma);
  });

  it.each(mensajes)("%s no perdio las tildes", (_nombre, texto) => {
    for (const forma of SIN_TILDE) expect(texto).not.toMatch(forma);
  });

  it.each(mensajes)("%s termina en punto", (_nombre, texto) => {
    expect(texto.trim()).toMatch(/\.$/);
  });
});

describe("catalogo de acciones", () => {
  it("todas las acciones fallidas arrancan igual", () => {
    for (const [nombre, texto] of Object.entries(actions)) {
      if (typeof texto !== "string" || !nombre.endsWith("_FAILED")) continue;
      expect(texto, nombre).toMatch(/^No pudimos /);
    }
  });

  it("no hay dos acciones con el mismo texto", () => {
    const textos = Object.values(actions).filter(
      (v): v is string => typeof v === "string",
    );
    expect(new Set(textos).size).toBe(textos.length);
  });
});

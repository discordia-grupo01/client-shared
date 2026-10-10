/**
 * Tiempos de la pantalla de carga inicial (web y mobile): no aparece si todo
 * estaba listo enseguida, y una vez visible no desaparece de golpe.
 */
export const LOADING_SCREEN = {
  /** Espera antes de mostrarla; si todo carga antes, no se ve. */
  showDelayMs: 150,
  /** Tiempo minimo en pantalla una vez visible. */
  minVisibleMs: 600,
  /** Duracion del desvanecimiento al salir. */
  fadeOutMs: 200,
} as const;

/**
 * Hay dos tipos porque son dos cosas distintas:
 * - `ActivityStatusChoice`: lo que el usuario elige en el selector.
 * - `ActivityStatus`: lo que se muestra de una persona. "Invisible" se ve
 *   como `offline`, y `idle` tambien puede venir de la inactividad sin que
 *   nadie lo haya elegido.
 */
export type ActivityStatus = "online" | "idle" | "dnd" | "offline";

export type ActivityStatusChoice = "online" | "idle" | "dnd" | "invisible";

export const ACTIVITY_STATUS_CHOICES: readonly ActivityStatusChoice[] = [
  "online",
  "idle",
  "dnd",
  "invisible",
];

export const ACTIVITY_STATUS_CHOICE_LABEL: Record<
  ActivityStatusChoice,
  string
> = {
  online: "En línea",
  idle: "Ausente",
  dnd: "No molestar",
  invisible: "Invisible",
};

export const ACTIVITY_STATUS_CHOICE_DESCRIPTION: Record<
  ActivityStatusChoice,
  string
> = {
  online: "",
  idle: "",
  dnd: "No recibirás notificaciones de escritorio",
  invisible: "Aparecerás como desconectado",
};

export const ACTIVITY_STATUS_LABEL: Record<ActivityStatus, string> = {
  online: "En línea",
  idle: "Ausente",
  dnd: "No molestar",
  offline: "Desconectado",
};

export function displayedStatus(choice: ActivityStatusChoice): ActivityStatus {
  return choice === "invisible" ? "offline" : choice;
}

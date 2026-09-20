import { MAX_DESCRIPTION, MAX_CUSTOM_STATUS } from "../constants/limits";

import { validateUserName } from "./auth";

export function validateProfileName(name: string): string | undefined {
  return validateUserName(name, "Ingresá tu nombre.");
}

export function validateDescription(description: string): string | undefined {
  if ([...description].length > MAX_DESCRIPTION) {
    return `La descripción no puede superar los ${MAX_DESCRIPTION} caracteres.`;
  }
  return undefined;
}

export function validateCustomStatus(text: string): string | undefined {
  if ([...text].length > MAX_CUSTOM_STATUS) {
    return `El estado no puede superar los ${MAX_CUSTOM_STATUS} caracteres.`;
  }
  return undefined;
}

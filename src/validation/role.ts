import { MAX_NAME } from "../constants/limits";
import type { Role, RoleFieldErrors } from "../domain/role";
import { isValidHex } from "../format/color";

export interface RoleValues {
  name: string;
  color: string;
}

export interface RoleValidationContext {
  /** Roles ya cargados, para detectar nombres repetidos antes de pegarle al back. */
  existingRoles?: Pick<Role, "id" | "name">[];
  /** Al editar, el rol que se esta editando no cuenta como duplicado. */
  currentRoleId?: string;
}

export function validateRole(
  values: RoleValues,
  context: RoleValidationContext = {},
): RoleFieldErrors {
  const errors: RoleFieldErrors = {};
  const trimmed = values.name.trim();

  if (!trimmed) {
    errors.name = "El nombre del rol no puede estar vacío.";
  } else if (trimmed.length > MAX_NAME) {
    errors.name = `El nombre no puede superar los ${MAX_NAME} caracteres.`;
  } else {
    const duplicated = context.existingRoles?.some(
      (role) =>
        role.id !== context.currentRoleId &&
        role.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (duplicated) errors.name = "Ya existe un rol con ese nombre.";
  }

  if (!isValidHex(values.color)) {
    errors.color = "Seleccioná un color válido.";
  }

  return errors;
}

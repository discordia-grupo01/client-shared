/**
 * Validacion de los formularios de auth. Funciones puras: reciben los valores
 * y devuelven un objeto de errores (vacio = todo ok).
 *
 * Replican lo que valida identify-service, ni mas ni menos. El backend es la
 * unica autoridad; aca solo evitamos requests obviamente invalidos y le damos
 * feedback inmediato al usuario.
 */
import { MAX_USER_NAME } from "../constants/limits";
import type {
  ForgotPasswordErrors,
  ForgotPasswordValues,
  LoginErrors,
  LoginValues,
  RegisterErrors,
  RegisterValues,
  ResetPasswordErrors,
  ResetPasswordValues,
} from "../domain/auth";

/** Suficiente para descartar tipeos: algo@algo.algo. */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** El back exige 8+ caracteres con mayuscula, minuscula y numero. */
const PASSWORD_MIN = 8;
const HAS_UPPERCASE = /[A-Z]/;
const HAS_LOWERCASE = /[a-z]/;
const HAS_DIGIT = /\d/;

/**
 * La regla en palabras. Se arma desde `PASSWORD_MIN` y no a mano para que no
 * pueda quedar diciendo otro numero que el que valida.
 *
 * Exportada porque el BFF de `web-client` tambien la muestra cuando el back
 * rechaza la contraseña, y la decia con un tercer texto distinto.
 */
export const PASSWORD_RULE_MESSAGE = `Usá ${PASSWORD_MIN}+ caracteres con una mayúscula, una minúscula y un número`;

/**
 * Misma lista blanca que `normalizeProfileName` en identify-service: letras,
 * marcas diacriticas, digitos, y ` ' - .`. No entran guion bajo ni emoji.
 */
const NAME_ALLOWED = /^[\p{L}\p{M}\p{Nd} '\-.]+$/u;

/**
 * Colapsa espacios y recorta, igual que `strings.Fields` del back: el nombre
 * se guarda normalizado, asi que se valida normalizado.
 */
export function normalizeName(value: string): string {
  return value.trim().split(/\s+/).join(" ");
}

function emailError(value: string): string | undefined {
  const email = value.trim();
  if (email === "") return "Ingresá tu correo electrónico";
  if (!EMAIL_REGEX.test(email)) return "El correo electrónico no es válido";
  return undefined;
}

function passwordStrengthError(password: string): string | undefined {
  if (password === "") return "Ingresá una contraseña";
  if (
    password.length < PASSWORD_MIN ||
    !HAS_UPPERCASE.test(password) ||
    !HAS_LOWERCASE.test(password) ||
    !HAS_DIGIT.test(password)
  ) {
    return PASSWORD_RULE_MESSAGE;
  }
  return undefined;
}

export function validateUserName(
  value: string,
  emptyMessage = "Ingresá un nombre de usuario",
): string | undefined {
  const name = normalizeName(value);
  if (name === "") return emptyMessage;
  // Spread para contar caracteres reales y no unidades UTF-16.
  if ([...name].length > MAX_USER_NAME) {
    return `El nombre no puede superar los ${MAX_USER_NAME} caracteres`;
  }
  if (!NAME_ALLOWED.test(name)) {
    return "El nombre solo puede tener letras, números, espacios, apóstrofos, guiones y puntos";
  }
  return undefined;
}

export function validateLogin(values: LoginValues): LoginErrors {
  const errors: LoginErrors = {};
  errors.email = emailError(values.email);
  if (values.password === "") errors.password = "Ingresá tu contraseña";
  return errors;
}

export function validateRegister(values: RegisterValues): RegisterErrors {
  return {
    name: validateUserName(values.name),
    email: emailError(values.email),
    password: passwordStrengthError(values.password),
  };
}

export function validateForgotPassword(
  values: ForgotPasswordValues,
): ForgotPasswordErrors {
  return { email: emailError(values.email) };
}

export function validateResetPassword(
  values: ResetPasswordValues,
): ResetPasswordErrors {
  const errors: ResetPasswordErrors = {};
  errors.newPassword = passwordStrengthError(values.newPassword);

  if (values.confirmPassword === "") {
    errors.confirmPassword = "Confirmá tu contraseña";
  } else if (values.confirmPassword !== values.newPassword) {
    errors.confirmPassword = "Las contraseñas no coinciden";
  }

  return errors;
}

export function hasErrors(
  errors:
    LoginErrors | RegisterErrors | ForgotPasswordErrors | ResetPasswordErrors,
): boolean {
  return Object.values(errors).some((value) => value !== undefined);
}

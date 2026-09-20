// Flat config de ESLint 9. Web-client usa next/core-web-vitals y app-mobile
// usa eslint-config-expo: ninguno aplica aca, porque este paquete no tiene ni
// Next ni React ni Expo. Este es el equivalente neutro para TypeScript puro.
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**", "coverage/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // Va ultimo: apaga las reglas de estilo que chocarian con prettier.
  prettier,
);

# client-shared

Paquete compartido entre la web, la app móvil y el backoffice de Discordia.

## Tabla de contenidos

- [Introducción](#introducción)
- [Pre-requisitos](#pre-requisitos)
- [Cómo correr](#cómo-correr)
- [Variables de entorno](#variables-de-entorno)
- [Comandos Docker](#comandos-docker)
- [Tests](#tests)
- [Más documentación](#más-documentación)

## Introducción

`client-shared` guarda lo que los tres clientes (`web-client`, `app-mobile` y `backoffice`) necesitan escribir una sola vez: los tipos de dominio, las validaciones de formularios, las constantes, los textos, los colores de cada tema, y la lógica de cómo se actualizan las pantallas cuando el servidor avisa que algo cambió.

Es un paquete de TypeScript puro, sin pantallas. No se levanta como un servicio: los clientes lo instalan como una dependencia de GitHub, fijada a un tag (por ejemplo `github:discordia-grupo01/client-shared#v0.13.101`).

La regla que lo define: **este paquete no importa `react`, `react-dom`, `react-native`, `next`, `axios` ni `expo`**. Así funciona igual en Node, en el navegador y en Hermes (el motor de React Native). El `tsconfig.json` lo hace cumplir, porque no incluye las librerías del navegador: usar `window`, `document` o `localStorage` rompe la compilación.

Lo que va acá: tipos, validaciones (funciones puras), constantes, catálogos, helpers, rutas y códigos de error del backend, y los colores de los temas. Lo que no va: componentes de pantalla, estilos, almacenamiento (cookies, `expo-secure-store`) y clientes HTTP. El contrato se comparte, el transporte no.

## Pre-requisitos

- **Node.js 20** y **npm**.
- **Docker**, solo si preferís correr los tests sin instalar Node.

## Cómo correr

No se corre: se compila y se prueba.

```bash
npm install
npm run build
```

`npm run build` compila `src/` a `dist/` (JavaScript más los tipos). No hace falta backend ni variables de entorno.

### Usarlo desde un cliente

En el `package.json` del cliente, la dependencia apunta a un tag:

```json
"@discordia/client-shared": "github:discordia-grupo01/client-shared#v0.13.101"
```

Cada cambio que los clientes tengan que ver necesita un tag nuevo. Al llegar a `main`, el CI lo crea solo, y los clientes suben su versión con un commit automático (`chore: bump client-shared`).

Los colores de los temas están en `src/theme/tokens.ts`. El archivo `theme.css` define los nombres de clase de Tailwind que usan los clientes (`bg-surface`, `text-content-muted`, `border-line`) y se importa así:

```css
@import "@discordia/client-shared/theme.css";
```

Si agregás un color, hay que sumarle su clase en `theme.css`; un test lo verifica.

## Variables de entorno

No usa ninguna.

## Comandos Docker

No tiene `docker-compose.yml`: no es un servicio. Si querés correr los tests sin instalar Node, usá un contenedor con `node_modules` en un volumen aparte, para no pisar el de tu máquina (si lo instalaras desde el contenedor sobre tu carpeta, los binarios de Linux dejarían a `node_modules` inutilizable en tu Mac):

```bash
docker run --rm \
  -v "$PWD":/app \
  -v client_shared_node_modules:/app/node_modules \
  -w /app node:20-alpine \
  sh -c "apk add --no-cache git >/dev/null && npm ci && npm test"
```

Para borrar el volumen después:

```bash
docker volume rm client_shared_node_modules
```

## Tests

```bash
npm test
```

Corre los tests con Vitest. Para revisar el resto del código:

| Qué                | Comando                                                     |
| ------------------ | ----------------------------------------------------------- |
| Linter (ESLint)    | `npm run lint`                                              |
| Tipos (TypeScript) | `npm run typecheck`                                         |
| Compilar           | `npm run build`                                             |
| Formato            | `npm run format:check` (y `npm run format` para arreglarlo) |

El CI corre todo eso en cada pull request. El repositorio se formatea con Prettier; activá el hook una vez por clon:

```bash
git config core.hooksPath .githooks
```

## Más documentación

- Todo se exporta desde `src/index.ts`: no hay rutas internas del tipo `@discordia/client-shared/domain/role`, porque el soporte de `exports` en Metro (el empaquetador de React Native) es reciente y frágil.
- Los clientes que lo usan: [`web-client`](https://github.com/discordia-grupo01/web-client), [`app-mobile`](https://github.com/discordia-grupo01/app-mobile) y [`backoffice`](https://github.com/discordia-grupo01/backoffice).

# client-shared

Tipos, validaciones, constantes y contrato de API compartidos entre
`web-client` (Next.js) y `app-mobile` (Expo / React Native).

Existe para que la logica que ambas apps necesitan se escriba una sola vez:
hoy los tipos de dominio, las validaciones de formularios y los limites del
backend estan duplicados en los dos repos, y ya empezaron a divergir.

## Setup local

```bash
npm install
```

No necesita variables de entorno ni backend corriendo: es un paquete de
TypeScript puro, sin efectos de red.

## Scripts

| Script                 | Que hace                                           |
| ---------------------- | -------------------------------------------------- |
| `npm run build`        | Compila `src/` a `dist/` (JS + `.d.ts`)            |
| `npm run typecheck`    | Chequea tipos sin emitir archivos                  |
| `npm run lint`         | ESLint sobre todo el repo                          |
| `npm test`             | Tests con Vitest                                   |
| `npm run format`       | Formatea con Prettier                              |
| `npm run format:check` | Falla si hay archivos sin formatear (lo usa el CI) |

## Formato automatico

Este repo se autoformatea con Prettier en cada commit. Activalo una vez por
clone:

```bash
git config core.hooksPath .githooks
```

Si usas VS Code con la extension oficial de Prettier, tambien formatea al
guardar (ya configurado en `.vscode/settings.json`).

El CI corre `npm run format:check` como red de seguridad, por si alguien clono
sin activar el hook.

## Regla de oro

> Este paquete **no importa** `react`, `react-dom`, `react-native`, `next`,
> `axios` ni `expo`.

Si un archivo necesita cualquiera de esos, no pertenece a este repo. Eso es lo
que garantiza que funcione igual en Node, en el navegador y en Hermes (el motor
de React Native).

El `tsconfig.json` lo hace cumplir: `lib` es `["ES2020"]` **sin `"dom"`**, asi
que usar `window`, `document` o `localStorage` rompe el build en vez de fallar
en runtime del lado de mobile.

### Que va y que no va aca

**Va:** tipos de dominio, validaciones de formularios (funciones puras),
constantes y catalogos, helpers puros, paths y codigos de error del backend,
design tokens (colores de cada tema, en `src/theme/tokens.ts`) como valores
planos.

**No va:** componentes de UI (React y React Native no comparten primitivas),
clases de Tailwind o StyleSheets (cada app aplica los tokens a su manera),
almacenamiento (`expo-secure-store`, cookies),
clientes HTTP. El contrato se comparte; el transporte no.

## Como lo consumen las apps

```json
"dependencies": {
  "@discordia/client-shared": "git+ssh://git@github.com/discordia-grupo01/client-shared.git#v0.1.0"
}
```

El repo es privado. Para trabajar en local no hace falta ningun token: `npm`
resuelve la dependencia con la misma llave SSH que ya usas para clonar los
repos del grupo. Las credenciales solo hacen falta en CI y en los deploys.

### Theme

Los colores de cada tema estan en `src/theme/tokens.ts`. Ademas, `theme.css`
(en la raiz, fuera de `dist`) define los nombres de clase de Tailwind que usan
las dos apps (`bg-surface`, `text-content-muted`, `border-line`...):

```css
@import "@discordia/client-shared/theme.css";
```

Web lo importa en `globals.css` y mobile en `global.css` (NativeWind). Si se
agrega un token, sumarle su clase en `theme.css`; un test lo verifica.

Cada cambio que las apps tengan que ver necesita un **tag nuevo**:

```bash
git tag v0.2.0
git push origin v0.2.0
```

## Ramas

Mismo modelo que el resto de los repos del grupo:

- `main` — productiva
- `develop` — integracion
- `feature/*`, `fix/*` — se sacan de `develop` y vuelven por PR

## Estructura

```
client-shared/
├── .github/
│   └── workflows/
│       └── ci.yml               format:check, lint, typecheck, test y build
├── .githooks/
│   └── pre-commit               hook de prettier local
├── src/
│   └── index.ts                 barrel: unico punto de entrada
├── eslint.config.mjs
├── tsconfig.json
└── package.json
```

A medida que avance la migracion, `src/` se organiza en `domain/`,
`validation/`, `constants/`, `format/` y `api/`. Todo se exporta desde
`src/index.ts`: no hay subpaths (`@discordia/client-shared/domain/role`),
porque el soporte de `exports` maps en Metro es reciente y fragil.

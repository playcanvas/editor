# Agent Guidelines for PlayCanvas Editor

## Project

- TypeScript frontend for the PlayCanvas web-based 3D editor
- Build: Rollup + SWC | Styles: SASS | Lint: ESLint 9 + Stylelint 16 | Test: Mocha + Chai
- Node >=22.x (see `.nvmrc`)
- Commands: `npm run build`, `npm run develop`, `npm run lint`, `npm test`, `npm run type:check`

## How the Editor Loads

- A backend server renders an HTML shell via Mustache templates
- Injects `var config = {...}` (user, project, flags, URLs) into a `<script>` tag
- Frontend bundle loaded from a configurable base URL; `window.config` drives all runtime behavior
- Page variants:
  - **Editor** — `src/editor/index.ts` → `editor.js` (full editor)
  - **Blank** — `src/editor/blank.ts` → `editor-empty.js` (project/scene selection)
  - **Code Editor** — `src/code-editor/index.ts` → `code-editor.js` (Monaco)
  - **Launch** — `src/launch/index.ts` → `launch.js` (app preview)

## Architecture

- Class hierarchy: `Caller` → `Editor<T>` (`src/common/editor.ts`) → `MainEditor` (`src/editor/editor.ts`)
- **Caller pattern** — cross-module communication via `this.call('method:name', ...args)` / `this.method('method:name', handler)`
- **Side-effect imports** — `src/editor/index.ts` registers all modules on import; do not remove imports unless removing a feature
- **editor-api** — `@playcanvas/editor-api` at `modules/editor-api/`, exposes `api.globals.*` (history, selection, assets, entities, realtime); `editor` global injected via Rollup footer

## Conventions

- Path aliases: `@/*` → `./src/*`
- Naming: PascalCase classes, camelCase functions, UPPER_SNAKE_CASE constants, kebab-case files
- Strict TypeScript — all public APIs must have proper type annotations
- Only fix lint issues in code you are modifying
- Styles live in `sass/`, compiled via `compile-sass.mjs`
- Heavy work (texture convert, search, console) goes in Web Workers (`src/workers/`)

## Things to Avoid

- Don't edit `dist/` — generated output
- Don't remove side-effect imports from `index.ts` without understanding consequences
- Don't bypass the Caller pattern for cross-module communication
- Don't add heavy synchronous work to the main thread — use Web Workers
- Don't introduce circular dependencies
- Don't hardcode URLs or config values — use `window.config`

When in doubt, look at similar existing code or ask.

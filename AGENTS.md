# Agent Guidelines for PlayCanvas Editor

This document contains rules, conventions, and best practices for AI agents and developers working on the PlayCanvas Editor frontend codebase.

## Project Overview

PlayCanvas Editor is the frontend application for the PlayCanvas web-based 3D editor. It provides the UI for scene editing, asset management, code editing, real-time collaboration, version control, and project publishing.

- **Language**: TypeScript 5.9
- **Module System**: ES Modules
- **Node Version**: >=22.x (see `.nvmrc`)
- **Build System**: Rollup + SWC
- **Styling**: SASS (sass-embedded) + PostCSS (autoprefixer)
- **Testing**: Mocha + Chai (main), Karma + Mocha + Sinon (editor-api)
- **Linting**: ESLint 9 (flat config) + Stylelint 16
- **License**: MIT

## How the Editor Loads

The editor frontend does not serve itself. A backend server renders an HTML shell using Mustache templates. The server:

1. Authenticates the user and loads project/scene metadata.
2. Builds a `config` object containing user info, project details, feature flags, and service URLs.
3. Renders a Mustache template that injects `var config = {...}` into a `<script>` tag.
4. Includes `<script>` and `<link>` tags pointing to the frontend bundle (e.g. `editor.js`, `editor.css`) hosted at a configurable base URL.

When the browser loads the page:

1. The HTML shell is parsed and `window.config` becomes available.
2. The editor JS bundle (`editor.js`) is loaded and executes.
3. `src/editor/index.ts` runs, importing all editor modules via side-effect imports.
4. The `MainEditor` class (in `src/editor/editor.ts`) is instantiated, which registers the editor API, connects to realtime services, and emits a `loaded` event.
5. On `loaded`, the editor checks `config` to determine state — if no project is loaded it opens the project picker, if a merge is in progress it opens the conflict/diff manager, etc.

### Page Variants

| Page | Entry Point | Bundle | Description |
|------|-------------|--------|-------------|
| **Editor** | `src/editor/index.ts` | `editor.js` | Full editor with viewport, inspector, assets panel, etc. |
| **Blank** | `src/editor/blank.ts` | `editor-empty.js` | Lightweight shell for project/scene selection only |
| **Code Editor** | `src/code-editor/index.ts` | `code-editor.js` | Monaco-based script editor |
| **Launch** | `src/launch/index.ts` | `launch.js` | Preview/launch page for running apps |

## Directory Structure

```
src/
├── common/          # Shared utilities, PCUI extensions, thumbnail renderers, base Editor class
├── core/            # Core constants and utilities
├── editor/          # Main editor UI (~400+ files)
│   ├── assets/      # Asset panel, CRUD, upload, sync, previews
│   ├── attributes/  # Attribute editors for inspector panels
│   ├── chat/        # In-editor chat
│   ├── console/     # Console output panel
│   ├── entities/    # Entity hierarchy, CRUD, selection, sync
│   ├── inspector/   # Inspector panels for entities, assets, components, settings
│   ├── layout/      # Editor layout management
│   ├── pickers/     # Modal dialogs (scene picker, project management, conflict manager, etc.)
│   ├── realtime/    # Realtime collaboration connection
│   ├── schema/      # Schema definitions
│   ├── settings/    # Project and user settings
│   ├── store/       # Asset store integration
│   ├── toolbar/     # Top toolbar actions
│   ├── vc/          # Version control (branches, merges, checkpoints)
│   ├── viewport/    # 3D viewport, gizmos, camera, grid, cursor
│   └── ...          # Other subsystems (search, hotkeys, history, etc.)
├── code-editor/     # Monaco-based code editor
├── launch/          # Launch/preview page
├── plugins/         # Editor plugins
├── workers/         # Web Workers (console, texture convert, search, etc.)
├── sw/              # Service workers
└── wasm/            # WASM codecs (AVIF, JPEG, PNG, WebP)

modules/
├── editor-api/      # Public editor automation/extensions API (@playcanvas/editor-api)
├── texture-convert/ # Texture conversion utilities
└── pcui-diff.ts     # Diff utilities for PCUI

sass/                # SCSS stylesheets (editor, code-editor, launch)
static/              # Static assets (images, JSON)
test/                # Unit tests
```

## Architecture

### Editor Class Hierarchy

- **`Caller`** — Base event/method dispatch system (`this.call('picker:scene', ...)`)
- **`Editor<T>`** (in `src/common/editor.ts`) — Extends `Caller`, holds references to `api` globals (history, selection, assets, entities, etc.)
- **`MainEditor`** (in `src/editor/editor.ts`) — Extends `Editor`, registers API services, handles startup logic

### editor-api Module

`@playcanvas/editor-api` (at `modules/editor-api/`) is a standalone package providing the programmatic API for interacting with editor data — assets, entities, scenes, history, selection, clipboard, realtime, schema, and jobs.

- The editor UI imports `@playcanvas/editor-api` and instantiates its services during `MainEditor._registerApi()`.
- API globals are exposed at `api.globals.*` (e.g. `api.globals.history`, `api.globals.assets`).
- The `editor` global is exposed to plugins and scripts via Rollup footer injection.

### Module Communication

Editor subsystems communicate via the **Caller pattern**:

```typescript
// Emitting
this.call('status:text', 'ready');

// Listening
this.method('picker:scene', (callback) => { ... });
```

This decouples modules — a toolbar button calls `this.call('picker:scene')` without importing the picker directly.

### Side-Effect Import Pattern

`src/editor/index.ts` registers all editor modules via side-effect imports. Each module self-registers its methods and event listeners when imported. **Do not remove imports** from this file unless you are intentionally removing a feature.

## Code Style and Conventions

### General Rules

- **Follow ESLint and Stylelint rules**: Run `npm run lint` before committing.
- **Only fix lint issues in code you are modifying** — do not fix pre-existing issues in unrelated files.
- **Path aliases**: Use `@/*` which maps to `./src/*` (configured in `tsconfig.json`).
- **Naming conventions**:
  - Classes: PascalCase (e.g., `MainEditor`, `AssetPanel`)
  - Functions/variables: camelCase
  - Constants: UPPER_SNAKE_CASE (e.g., `MERGE_STATUS_READY_FOR_REVIEW`)
  - Files: kebab-case (e.g., `assets-upload.ts`, `picker-scene.ts`)

### TypeScript

- Strict TypeScript — the project uses full type checking (`npm run type:check`).
- Use proper type annotations for all public APIs and function signatures.
- Use `@playcanvas/editor-api` types for API-layer interfaces.

### SCSS

- Stylesheets live in `sass/` and are compiled via `compile-sass.mjs`.
- Follow existing naming patterns. Lint with `npm run lint:css`.

## Build System

### Rollup Bundles

| Bundle | Input | Output | Format |
|--------|-------|--------|--------|
| editor-api | `modules/editor-api/src/index.ts` | `modules/editor-api/dist/index.js` | ES |
| Editor | `src/editor/index.ts` | `dist/js/editor.js` | UMD |
| Blank | `src/editor/blank.ts` | `dist/js/editor-empty.js` | UMD |
| Code Editor | `src/code-editor/index.ts` | `dist/js/code-editor.js` | ES |
| Launch | `src/launch/index.ts` | `dist/js/launch.js` | ES |
| Plugins | `src/plugins/*.ts` | `dist/js/plugins/*.js` | ES |
| Workers | `src/workers/*.ts` | `dist/js/*.js` | ES |
| Service Workers | `src/sw/*.ts` | `dist/js/*.js` | ES |

### npm Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Full build (CSS + JS) |
| `npm run build:css` | Compile SCSS to CSS |
| `npm run build:js` | Rollup production build |
| `npm run develop` | Watch CSS + JS + serve on port 3487 |
| `npm run watch` | Watch CSS and JS without serving |
| `npm run serve` | Serve `dist/` on port 3487 with CORS |
| `npm run lint` | Run both `lint:js` and `lint:css` |
| `npm run lint:js:fix` | ESLint with auto-fix |
| `npm test` | Run Mocha unit tests |
| `npm run test:api` | Run editor-api Karma tests |
| `npm run type:check` | TypeScript type checking (no emit) |
| `npm run type:check:api` | Type-check editor-api module |

## Testing

### Main Project

- **Framework**: Mocha + Chai
- **Location**: `test/` directory
- **Config**: `.mocharc.json` (uses `ts-node/esm` loader)
- **Run**: `npm test`

### editor-api Module

- **Framework**: Karma + Mocha + Chai + Sinon
- **Location**: `modules/editor-api/test/`
- **Run**: `npm run test:api` (from root) or `npm test` (from `modules/editor-api/`)

### Guidelines

- Write tests for new features and bug fixes when instructed.
- Use descriptive test names that explain the expected behavior.
- Match the existing test structure in the relevant test directory.

## Performance Considerations

- The editor runs in the browser alongside a real-time 3D viewport. Avoid unnecessary DOM manipulations or expensive computations on the main thread.
- Heavy work (texture conversion, search indexing, console processing) is offloaded to **Web Workers** in `src/workers/`.
- WASM codecs in `src/wasm/` handle image encoding/decoding off the main thread.
- Minimize allocations in frequently called code paths (e.g. viewport render loop callbacks).

## Common Patterns

### Adding a New Inspector Panel

Inspector panels live in `src/editor/inspector/`. Follow the pattern of existing panels — extend the appropriate base class, register via side-effect import in `index.ts`.

### Adding a New Picker/Dialog

Pickers live in `src/editor/pickers/`. Register the picker method name (e.g. `picker:myFeature`) via the Caller pattern, then trigger it from toolbar or context menu code with `this.call('picker:myFeature')`.

### Adding a New Asset Type

Asset creation modules follow the pattern `src/editor/assets/assets-create-*.ts`. Each module registers the creation logic and wires it into the assets context menu.

### Adding a New Toolbar Action

Toolbar items are in `src/editor/toolbar/`. Add a new file, register the action, and import it in `index.ts`.

## Things to Avoid

- **Don't edit `dist/`**: Generated output — never modify directly.
- **Don't remove side-effect imports from `index.ts`** without understanding the consequences.
- **Don't bypass the Caller pattern**: Use `this.call()` / `this.method()` for cross-module communication.
- **Don't add heavy synchronous work to the main thread**: Use Web Workers for CPU-intensive tasks.
- **Don't introduce circular dependencies**: The module structure relies on clean import graphs.
- **Don't hardcode URLs or config values**: Use `window.config` for runtime configuration injected by the server.

## Commit and PR Guidelines

- **Clear commit messages**: Use conventional commits format (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, etc.)
- **Small, focused commits**: Each commit should be a logical unit of work.
- **No generated files**: Don't commit files in `dist/`.
- **Reference issues**: Include issue numbers where applicable.

## Questions?

When in doubt:
1. Look at similar existing code in the codebase.
2. Check the ESLint configuration (`eslint.config.mjs`).
3. Review recent commits for patterns.
4. If unclear or multiple valid approaches exist, ask rather than guessing.

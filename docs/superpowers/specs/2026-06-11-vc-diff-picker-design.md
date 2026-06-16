# Version Control Diff Picker — Design

**Date:** 2026-06-11
**Branch:** `feat/modern-version-control-pickers`
**Status:** Approved via brainstorming session (visual mockups in `.superpowers/brainstorm/28890-1781208930/content/`, `full-layout-v8.html` is the layout reference)

## Goal

A GitHub-Desktop-inspired full-diff picker that replaces the legacy conflict-manager view for *diff viewing* (the conflict manager remains for merge-conflict resolution). Property changes in scenes and settings render as cropped, read-only inspector panels — entity breadcrumb, component header, changed fields as unified `−`/`+` row pairs — using the editor's real UI components so the diff looks exactly like the inspector it came from. All conflict data types are supported.

## Decisions made during brainstorming

1. **Evolve the existing skeleton** `src/editor/pickers/version-control/picker-version-control-diff.ts` (untracked WIP); keep its overlay/sidebar/main structure and `picker:versioncontrol:diffPicker` entry point.
2. **Unified diff presentation**: each modified field renders as a red `−` row (old value) directly above a green `+` row (new value) inside one panel. Not side-by-side, not inline-"was" annotations.
3. **Changed rows only**: the diff payload contains only changed fields; we do not fetch full checkpoint data to render unchanged context rows.
4. **Real read-only PCUI components** for trees, panels, and value widgets (revised during review from "custom DOM + borrowed classes" — pixel fidelity demands made real components the obviously better choice). Custom DOM remains only for diff-row scaffolding, reference chips, and missing-value states.

## Architecture & wiring

- `picker-version-control-diff.ts` stays the module; registers `picker:versioncontrol:diffPicker(diff)` on `editor.once('load')`.
- Wire-in (two edits):
  - `src/editor/index.ts`: add the side-effect import alongside the other version-control pickers.
  - `src/editor/pickers/version-control/picker-version-control.ts` (`presentDiff`): call `picker:versioncontrol:diffPicker` instead of `picker:diffManager`.
- All three diff entry points flow through `presentDiff` and therefore land in the new picker: changes-tab "Open Full Diff", checkpoint-detail diff, compare mode.
- The conflict-manager picker (`picker:diffManager`) is untouched and remains the merge-conflict resolution UI.
- Diff retention lifecycle is kept exactly as in the skeleton: `hasRetainedDiff` check, `picker:diffManager:closed` emit, `mergeDelete` on close for non-retained diffs, `picker:project:resume` / `picker:versioncontrol` reopen, viewport hover suppression.

### Data flow

`Diff` payload (`src/editor-api/models.ts`) → `summarizeDiff` for the sidebar groups → selected conflict → split into `textEntry` (textual file merge) and `propertyEntries` → property entries grouped into inspector sections; textual entries render the embedded code-editor diff iframe (existing behaviour, kept).

**Name resolution:** a per-diff index built once from `diff.srcCheckpoint` / `diff.dstCheckpoint`:

- `assets: Record<id, name>` — asset reference names
- `scenes: Record<sceneId, Record<entityGuid, entityName>>` — entity names (also feeds the breadcrumb)
- `settings.layers` / `settings.batchGroups` — layer and batch-group names

Lookup order: src index first, then dst (matching the legacy resolver). Unresolvable ids render the raw id in muted "missing" styling.

## Layout

Fullscreen `Overlay` (pcui), themed to the existing GitHub-Desktop version-control picker:

- **Top bar**: bold title "Diff", meta `N changes · vs <hash chip>` (reuse `hashChip` from `vc-helpers`), icon close button. `$bcg-dark` background, `$border-primary` bottom border.
- **Sidebar** (~280px, `$bcg-darker`): grouped change list using existing conventions — `vc-group`-style uppercase headers (`Scenes · 1`), rows with name, status badge (`%vc-badge`), and a sub-line:
  - property-bearing items (scenes, settings): `scene · N fields`
  - textual assets: `script · +A −D` (async line counts, existing `loadTextCounts` flow)
  - hover `#354144`; selected `#354144` + `inset 2px 0 0 $text-active`.
- **Main**: detail header (item name, status badge, field/line stats) + scrollable section stream.

## Section structure (per conflict)

Property entries are grouped by their `(entityContext, section, context)` key from `inspectorInfo` (consecutive entries sharing a key share a section), preserving payload order. Each section renders:

1. **Entity breadcrumb** (scene entity changes only): real pcui `TreeView` + `TreeViewItem`s — `allowDrag: false, allowRenaming: false, allowReordering: false`; ancestor chain from the entity path with each ancestor `.open = true`; leaf item selected and carrying the changed component's icon (`component-icon-postfix type-<component>` classes, as the hierarchy does); ancestors get the default pcui dot icon. The real component draws toggles, guide lines, and selection exactly like the hierarchy panel.
2. **Panel** (real pcui `Panel`, `collapsible: true`, default expanded):
   - **Component changes**: header = component icon (`component-icon type-<component>`) + uppercase component name (e.g. `LIGHT`).
   - **Script component**: `SCRIPT` panel containing a nested sub-panel per script name (`playerController`), mirroring the inspector's per-script panels. Script attribute labels are **raw** (`speed`, not `Speed`) — the inspector shows unprettified attribute names. Sound slots (`Slot: <name>`) and sprite clips (`Clip: <name>`) use the same nested sub-panel treatment.
   - **Settings changes** (scene settings and project settings): one parent `SETTINGS` panel containing a sub-panel per settings group (`RENDERING`, `PHYSICS`, …) — matching the real settings panel's nesting. Root-level settings fields render directly in the parent panel. Group names come from `formatDiffPath`'s existing settings labels.
3. **Diff rows** inside the panel content (see below).

**Whole-item add/delete** (entry without `path`): a status banner panel — item name, `added`/`deleted` badge, one-line explanation — no field rows.

## Unified diff rows

Custom row scaffolding (no PCUI equivalent exists):

- Row = gutter glyph (`−`/`+`, monospace) + field label (fixed-width label column, `pcui-label-group` proportions) + value cell.
- modified → `−` row with old (`dstValue`) widget, then `+` row with new (`srcValue`) widget. `missingInDst` (added) → `+` row only. `missingInSrc` (deleted) → `−` row only. (`src` = newer/working state, `dst` = checkpoint — matching existing code.)
- Tints (chosen for legibility over the `#364346` panel body): deleted `rgba(248, 81, 73, 0.15)` + `inset 2px 0 0 #f85149`; added `rgba(63, 185, 80, 0.15)` + `inset 2px 0 0 #3fb950`. Sidebar badges and `+N/−N` counters keep the existing theme colors (`#ff8a8a` / `#6fd088`).
- Value cells get `pointer-events: none` to suppress residual widget interactivity (color-picker overlays, slider drags). Widgets are detached PCUI instances (not observer-bound), so they cannot emit edits into history/realtime.

## Value renderers (type → widget)

Per-entry type from `srcType`/`dstType`/`type` (fall back to value shape, reusing the skeleton's heuristics):

| Type | Widget |
|---|---|
| `boolean` | `BooleanInput`, `readOnly` — true ticked state (light fill, dark tick) |
| number | `NumericInput`, `readOnly`; format via existing `num()` |
| string / default | `TextInput`, `readOnly`; empty string renders `""` with tooltip |
| `vec2`/`vec3`/`vec4` (numeric arrays 2–4) | `VectorInput`, `readOnly`, `dimensions` = length, placeholders `X/Y/Z/W` |
| `rgb`/`rgba` (or color-ish path heuristic) | `ColorPicker`, `readOnly`, `channels` = length (as legacy `ConflictFieldColor`) |
| `curve`/`curveset` | `CurveInput` (`@/common/pcui/element/element-curve-input`), `readOnly` (as legacy `ConflictFieldCurve`) |
| `curveset` on a color-graph path (`colorGraph` etc., colour heuristic) | `GradientPicker` (pcui), `readOnly` — the inspector renders these as gradients; fall back to `CurveInput` if the value shape doesn't fit |
| `asset` | chip: `ASSET` tag + name from asset index, id tooltip |
| `entity` | chip: entity dot glyph + name from entity index, guid tooltip |
| `layer` / `batchGroup` | chip with name from settings index |
| `sublayer` | label `«layer name» Transparent/Opaque` (legacy parity) |
| `array:<type>` | vertical list of the element renderer; `array:sublayer` per legacy |
| `json` / unknown objects | `TextAreaInput`, `readOnly`, height-capped, pretty-printed |
| `object` | muted "No preview available" label |
| value `undefined` / missing side | muted label: `not present` (added), `removed` (deleted), `null` |

Chips share the PCUI input chrome (height/background/border) via SCSS so they sit consistently beside real inputs.

## SCSS

New partial `sass/editor/_editor-version-control-diff.scss`, imported in `sass/editor.scss` directly after `editor-version-control-picker`.

- Hoist `%vc-badge` (currently nested inside `.pcui-container.picker-vc`) to file scope in the picker partial so both partials can `@extend` it; the overlay lives outside `.picker-vc`.
- The partial contains only what PCUI doesn't provide: overlay shell + top bar, sidebar list styles (following the picker partial's conventions), section card spacing, diff-row scaffolding (gutter, label column, tints), reference chips, zeroing PCUI's default 6px element margins inside diff rows, `pointer-events: none` on value cells, iframe sizing, empty/banner/skeleton states.

## Behaviour

- Open: `picker:versioncontrol:diffPicker(diff)` renders sidebar + first item's detail; `viewToken` invalidation guards async line-count updates (existing pattern, kept).
- Sidebar click re-renders the main panel only.
- Panels collapse/expand via pcui `Panel`; default expanded.
- Close: existing lifecycle untouched (release or delete merge, reopen underlying picker, `vcgraph:moveToForeground`, viewport hover restore).

## Edge cases & errors

- File line-count fetch failure → falls back to locally computed counts (existing `log.error` path).
- Reference id absent from the name index → raw id, muted styling.
- Large JSON values → height-capped read-only textarea.
- Large diffs render eagerly — no virtualization (accepted; sections are cheap; one conflict renders at a time).

## Non-goals

- Unchanged context rows (would require full checkpoint fetches).
- Virtualized rendering.
- Any widget interactivity (editing, color pickers, curve editors opening).
- Changes to the conflict manager.
- Enum/slider awareness — the payload has values + types but no inspector schema, so enums render as strings and slider-backed numbers as plain numeric inputs.
- Asset thumbnails (only id→name maps are available).
- Per-section scope icons from the settings panel (globe/person) — not in the payload.

## Verification

1. `npm run lint` and `npm run type:check` pass.
2. Unit tests (Mocha/Chai, `test/common/`, alongside `script-names.test.ts`) for new pure helpers: the reference name-index builder and the type→renderer mapping (extracted into `vc-helpers.ts` or a sibling module so they're testable without DOM).
3. Manual smoke via `npm run develop`:
   - Open the diff from all three entry points (changes tab, checkpoint detail, compare mode).
   - A scene diff covering: color, boolean, vector, curve, script attributes (raw labels, sub-panel), entity reference, asset reference.
   - Scene/project settings diff (nested SETTINGS sub-panels).
   - Whole-entity add and delete banners.
   - Textual asset diff (iframe + async line counts).
   - Close/reopen cycles to confirm retained-diff lifecycle still works.

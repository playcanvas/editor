# Merge Picker → GitHub-Desktop Migration

**Date:** 2026-06-19
**Status:** Design — awaiting review
**Area:** version-control (PlayCanvas Editor)

## Summary

Migrate the merge conflict resolution UI (the `RESOLVE CONFLICTS` overlay, today a
dense 3-column BASE / DEST / SOURCE matrix) to a GitHub-Desktop-style two-pane picker
that matches the theming of the recently-shipped diff picker
(`picker-version-control-diff.ts`).

The key enabling insight: **merge data and diff data share the exact same shape**
(`{ conflicts: [{ itemId, itemType, assetType, data: [{ id, path, srcValue, dstValue,
missingInSrc, missingInDst, isTextualMerge, mergedFilePath, … }] }], srcCheckpoint,
dstCheckpoint }`). The diff picker already renders this shape into the desired two-pane
layout. So the merge picker is **"the diff picker + a per-item resolution layer + the
merge lifecycle."** Rather than rebuild the rendering, we extract the diff picker's
presentation into a shared core that both pickers render through.

## Decisions (locked)

1. **Resolution model:** Full overhaul to **per-item** resolution (GitHub-Desktop
   coarse: Use destination / Use source per item), replacing per-field resolution.
   The backend already supports this — `conflictsResolve` accepts multiple conflict IDs
   in one call, and the old "USE ALL FROM THIS BRANCH" button already did bulk resolve.
2. **Detail pane:** Show a **compact read-only preview** of what changed on each branch,
   rendered with the diff picker's field renderers, above the resolution choice.
3. **File/text conflicts:** Keep an **"Open editor"** escape hatch (the existing
   iframe code-merge editor) for line-level resolution of scripts/shaders, in addition
   to Use destination / Use source.
4. **Code sharing:** **Extract a shared diff-view core**; both the diff picker and the
   new merge picker render through it (guarantees identical styling, no duplicated
   inspector logic).
5. **Scope:** **Full rebuild** — the new module owns both resolve mode
   (`picker:conflictManager`) and the post-REVIEW review mode (`picker:diffManager`),
   plus the merge lifecycle. Retire the legacy conflict-manager and its field UI.
6. **Legacy scripts:** **Drop legacy support.** All projects route through the new
   picker; no `useLegacyScripts` fallback is added. Legacy-script merge rendering is
   accepted as unsupported. (The diff picker keeps its own existing `useLegacyScripts`
   guard at its own entry point — unaffected.)

## Architecture

```
vc-diff-view.ts  (NEW — shared presentation core)
   ├── builds: overlay → shell → top(title · meta · fullscreen · close) → body
   │            → sidebar(head · filter · list [· footer]) → main(detail-head · detail)
   ├── owns:   renderSidebar / renderMain / renderUnifiedDiff + all helpers
   │            (inspectorInfo, sectionParts, fieldRow, sideField, entityTree,
   │             wholeBanner, appendSummaryStats, skeleton/loading/notice …)
   └── hooks:  { title, decorateRow?, renderDetailFooter?, fileMode?, … }
        │
        ├── picker-version-control-diff.ts  → createVcDiffView({ title: 'Diff', fileMode: 'readonly' })
        │      keeps: promise/loading, slow-hint, popstate/esc, retained-diff cleanup,
        │             useLegacyScripts guard, the `picker:versioncontrol:diffPicker` method
        │
        └── picker-conflict-manager.ts (REBUILT) → createVcDiffView({ title: 'Resolve Conflicts', … })
               adds: resolution layer + merge lifecycle (two modes)
```

The render path has **no per-consumer branching** — both pickers feed the same data
shape into the core. Consumer-specific behaviour lives entirely in the hooks and in
each consumer's own lifecycle handlers.

### Module boundaries

Each unit has one purpose, a defined interface, and known dependencies:

- **`vc-diff-view.ts`** — *what:* renders a diff/merge data object into the two-pane
  shell. *interface:* `createVcDiffView(opts)` returning an object of containers +
  render methods (below). *depends on:* `vc-diff-fields`, `vc-diff-data`, `vc-helpers`,
  pcui, the editor caller (`localStorage:*`, `search:items`, `viewport:*`). *No merge
  or diff lifecycle knowledge.*
- **`picker-version-control-diff.ts`** — *what:* diff lifecycle (load/promise/close).
  *depends on:* `vc-diff-view`, `diffCreate`, merge REST.
- **`picker-conflict-manager.ts`** — *what:* merge lifecycle + per-item resolution.
  *depends on:* `vc-diff-view`, `text-resolver`, conflicts/merge REST, messenger.

### Shared-core interface (representative)

```ts
export const createVcDiffView = (opts: {
  title: string;
  // merge mode: decorate each sidebar row (resolution dot + "X/Y")
  decorateRow?: (row: HTMLElement, conflict: any, item: any) => void;
  // merge mode: inject Use destination / Use source / Resolve (+ Open editor) under the preview
  renderDetailFooter?: (detail: HTMLElement, conflict: any) => void;
  // diff & review: render read-only file diff iframe; resolve mode omits it (uses Open editor)
  fileMode?: 'readonly';
}) => {
  // exposes shell containers so consumers can mount their own chrome
  return {
    overlay, top, sidebar, sidebarFooter, main,
    setData,        // (diff|merge) -> index names, render sidebar + main
    render,         // full re-render
    renderMain,     // re-render detail only (after selection / resolve)
    refreshRow,     // (index) -> re-decorate one sidebar row (after resolve)
    renderNotice,   // (msg) -> single-line message in main (loading/empty/error)
    renderLoading,  // skeletons
    cleanup,
    getSelectedConflict,
    on,             // 'select'(conflict, index)
  };
};
```

**Lifecycle stays in the consumers.** The core does NOT own `overlay.on('hide')`
cleanup, `picker:diffManager:closed` emission, retained-diff deletion, or
`picker:open|close` emission — each consumer wires those, because they differ
(diff deletes its temp diff on close; merge confirms stopping the merge on close).

## The new merge picker — two modes

### Resolve mode — `picker:conflictManager`

- **Sidebar:** grouped, filterable rows (shared). `decorateRow` adds a resolved /
  conflict indicator dot and a `Resolved X/Y` count per item.
- **Detail pane:**
  1. Compact read-only field preview (shared `renderUnifiedDiff` output — destination
     vs source).
  2. Resolution footer (`renderDetailFooter`): `◉ Use destination  ○ Use source`
     + `[ Resolve ]`.
  3. If the item has a file conflict (`isTextualMerge`): also `[ Open editor ]` →
     mounts the existing `TextResolver` (iframe code-merge editor) in the main pane,
     hiding the inspector while editing; its `resolve`/`close` events return to the
     resolution view.
- **Resolution wiring:** `[ Resolve ]` collects **all** of the item's conflict IDs and
  issues a single `conflictsResolve({ mergeId, conflictIds, useSrc|useDst: true })`.
  On success the item is marked resolved, its sidebar row re-decorated (`refreshRow`),
  and the REVIEW MERGE button enables once **all** items are resolved.
  Re-selecting a resolved item and choosing the other side re-resolves it.
- **Sidebar footer:** `REVIEW MERGE` (primary; enabled when all resolved) →
  `mergeApply({ finalize: false })`.

### Review mode — `picker:diffManager`

- Same shell, **read-only** (no `renderDetailFooter`); file conflicts use the
  read-only iframe (`fileMode: 'readonly'`).
- **Sidebar footer:** `COMPLETE MERGE` → `mergeApply({ finalize: true })`.
- Loads via `diffCreate(...)` (unchanged).
- Preserves `picker:diffManager:closed` emission + retained-diff deletion on hide.

### Merge lifecycle (preserved, moved into the rebuilt module)

- Messenger `messenger:merge.setProgress` → progress transitions
  (`AUTO_STARTED`/`APPLY_STARTED` → spinner, `READY_FOR_REVIEW` → review,
  `APPLY_ENDED` → complete, `task_failed` → error).
- Spinner / done / error states shown via the core's `renderNotice` in the main pane.
- Close button confirms ("Closing will stop the merge") → `mergeDelete` for in-progress
  merges; retained-diff-aware deletion otherwise.
- All existing entry points keep working unchanged:
  - `editor.ts` → `picker:conflictManager` / `picker:diffManager`
  - `picker-version-control.ts:568` → `picker:conflictManager`
- The unused sub-methods `picker:conflictManager:currentMerge` and
  `:rightPanel` are dropped (grep confirms no external readers).

## Combined data + file conflicts (edge case)

An item can have both data conflicts and a file conflict. Behaviour:
- **Use destination / Use source** resolves the **whole item** (every conflict ID,
  including the file) to that side.
- **Open editor** resolves **only the file** (`useMergedFile: true`); any data
  conflicts in the same item remain and are resolved via the radios.

This matches current capability (the old UI also separated file-conflict resolution
from field resolution).

## Styling

- Reuse the `.vc-diff-*` classes wholesale (the shared core emits them) — guarantees
  the visual match.
- **NEW** `sass/editor/_editor-version-control-merge.scss` holds only merge-specific
  rules: the sidebar resolution indicator/`X/Y`, the detail-pane resolution footer
  (radios + Resolve / Open editor buttons), and the sidebar footer (REVIEW / COMPLETE).
  Reuse `%vc-badge`, `%vc-checkbox`, and the tint variables.
- Import it in `sass/editor.scss` directly after `editor-version-control-diff`.
- **DELETE** the legacy `.ui-overlay.picker-conflict-manager { … }` block in
  `sass/editor/_editor-main.scss` (starts at L6515, ~825 lines).

## File plan

| File | Action |
| --- | --- |
| `version-control/vc-diff-view.ts` | **NEW** — shared presentation core (extracted from the diff picker) |
| `version-control/picker-version-control-diff.ts` | **SLIM** — consume the core; keep lifecycle + `useLegacyScripts` guard |
| `conflict-manager/picker-conflict-manager.ts` | **REWRITE** — thin consumer + resolution layer + merge lifecycle (both modes) |
| `conflict-manager/ui/text-resolver.ts` | **KEEP** — "Open editor" |
| `conflict-manager/ui/conflict-resolver.ts` | **DELETE** |
| `conflict-manager/ui/conflict-section.ts` | **DELETE** |
| `conflict-manager/ui/conflict-section-row.ts` | **DELETE** |
| `conflict-manager/ui/conflict-field.ts` | **DELETE** |
| `conflict-manager/picker-conflict-manager-asset.ts` | **DELETE** (Open-editor mount logic moves into the rewrite) |
| `conflict-manager/picker-conflict-manager-scene.ts` | **DELETE** (generic renderer covers scene hierarchy) |
| `conflict-manager/picker-conflict-manager-settings.ts` | **DELETE** (generic renderer covers settings: layers/batch-groups/scripts) |
| `sass/editor/_editor-version-control-merge.scss` | **NEW** — merge-only rules |
| `sass/editor/_editor-main.scss` (≈L6515 block) | **DELETE** old `.picker-conflict-manager` styles |
| `sass/editor.scss` | **+1** `@import` for the merge partial |
| `src/editor/index.ts` (L374-377) | swap the four retired imports for the single new module import |

## Risks & mitigations

- **Renderer coverage of all conflict types.** Deleting the asset/scene/settings
  handlers assumes the shared renderer covers scene-entity hierarchy, settings
  (layers / batch groups / scripts), and asset-property grouping. The helpers
  (`vc-helpers`, `vc-diff-data`, `vc-diff-fields`) appear to handle all of these.
  *Mitigation:* during implementation, diff each conflict type against a real merge and
  confirm parity **before** deleting the handlers.
- **Extracting from freshly-shipped code.** The diff picker shipped recently.
  *Mitigation:* extract by moving code, not rewriting; verify the diff picker's existing
  behaviour (filter, fullscreen, resize, esc/back, retained diffs) is unchanged after
  the extraction, before touching the merge picker.
- **`picker:diffManager:closed` contract.** Consumed by `panel-changes`, `panel-detail`,
  and `picker-version-control`. *Mitigation:* preserve emission on hide + retained-diff
  deletion exactly.
- **Legacy scripts.** Accepted as unsupported per decision 6; new picker carries no
  guard. *Mitigation:* none required, but note in the PR description.

## Verification

- `npm run lint`, `npm run type:check`, `npm run build` all pass.
- **Manual** (primary verification — this is pure UI/DOM/picker work, no unit tests):
  trigger a real merge with conflicts across types (material asset + scene entity +
  project settings + a script-file conflict) and confirm:
  1. Two-pane layout matches the diff picker's theming (header, sidebar, badges, tints).
  2. Sidebar filter + type dropdown + resolution dots + `X/Y` work.
  3. Use destination / Use source resolves an item; row flips to resolved.
  4. Open editor resolves a file conflict line-by-line; returns correctly.
  5. REVIEW MERGE enables only when all resolved; review mode is read-only; COMPLETE
     MERGE finalizes.
  6. Close mid-merge prompts to stop the merge.
  7. The diff picker (checkpoint diffs) still works unchanged.

## Out of scope

- Changing the merge REST API or messenger protocol.
- Changing the version-control picker, changes panel, or checkpoint-diff entry points
  (beyond the shared-core extraction).
- Legacy-script merge support.
- Unit tests (pure UI per project convention).

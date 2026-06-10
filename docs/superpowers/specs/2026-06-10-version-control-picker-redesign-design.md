# Version Control Picker Redesign — Design

**Date:** 2026-06-10
**Status:** Approved (brainstormed with visual mockups; see `.superpowers/brainstorm/` session)

## Context

The version control picker (branches + checkpoints, inside the project picker overlay) predates the modernized builds panel (#2080). A styling pass brought its colors and controls in line, but the structure has the same problems it always had:

- The current branch is a green dot buried in a list; switching takes three hidden steps.
- Every action (merge, close, delete, restore, hard reset, new branch from checkpoint) hides behind tiny kebab menus.
- Creating a checkpoint — the most common action — swaps the entire right pane to a form, hiding history.
- Checkpoints have no detail view; descriptions truncate behind "read more".
- Diffing is a checkbox mode with a bar sliding up from the bottom.
- "Load More" buttons instead of infinite scroll; raw branch GUIDs consume a line per row.

## Goal

Rebuild the picker as a GitHub Desktop-style layout using the builds panel's visual language and interaction patterns.

## Constraints (user-confirmed)

1. Stays a tab inside the project picker frame (builds precedent).
2. Full feature parity: switch, merge, close/re-open, delete, favorite, create branch (incl. from checkpoint), restore, hard reset, two-checkpoint compare, cross-branch compare, browse-other-branch-history-without-switching, VC graph.
3. UI rebuilt with pcui Containers + plain DOM; LegacyList/LegacyListItem retired here.
4. Frontend only — existing editor-api rest endpoints and diff jobs as they are.

## Layout (approved: "Faithful GitHub Desktop")

```
┌ top bar ───────────────────────────────────────────────────────────┐
│ [⎇ CURRENT BRANCH: main ▾]            [⌥ Graph] [⇄ Compare] [+ Checkpoint] │
├ sidebar (~270px) ──────────┬ main area ─────────────────────────────┤
│ [Changes · N] [History]    │ changes summary / checkpoint detail    │
│ tab content                │                                        │
│ (form pinned, Changes tab) │                                        │
└────────────────────────────┴────────────────────────────────────────┘
```

### Top bar

- **Branch switcher** (left): permanent button showing the current branch; opens the branch panel below it.
- **Graph**: opens the existing VC graph for the viewed branch.
- **Compare**: toggles compare mode (see Flows).
- **+ Checkpoint** (orange primary): activates the Changes tab and focuses the description field.

### Branch panel (switcher dropdown)

- Search input filters loaded branches as you type; a small filter swaps Open / Favorites / Closed (replaces today's separate search row + select).
- Sections: Favorites (starred), then All branches. Infinite scroll for pagination.
- Branch GUIDs removed from rows; available via row kebab → "Copy Branch ID".
- Row hover reveals an explicit **Switch** button (one click checkout).
- Clicking the row body **views** that branch's history without switching: sidebar shows a "Viewing \<branch\> — Return to \<current\>" banner; Changes tab disables.
- Row kebab: Merge into current, Favorite/Unfavorite, Close / Re-open, Delete, Graph, Copy Branch ID. Items follow today's permission/visibility rules (e.g. no close/delete on master or current branch).
- **+ New Branch** entry at the bottom opens the New Branch dialog.

## Sidebar tabs

### Changes tab

- Computes working-state vs latest-checkpoint via the existing `diffCreate` job when the tab opens. Cached per branch; invalidated on checkpoint create/restore/branch switch and messenger checkpoint events; manual ↻ refresh in the main-area summary card.
- Items grouped by type (Entities, Assets, Settings, …) with added/modified/deleted badges; tab label shows total count.
- **Pinned checkpoint form** at the bottom: description textarea + Create Checkpoint (primary). Disabled when empty; Cmd/Ctrl+Enter submits (kept from today).
- Main area: summary card (counts by type, last-checkpoint meta, ↻ Refresh, Open Full Diff → existing diff viewer).
- States: shimmer skeleton while the diff computes (builds-style); "No changes since your last checkpoint" empty state with the form CTA dimmed.

### History tab

- Date-grouped checkpoint rows: avatar, bold first description line, author + relative date. Infinite scroll replaces Load More. Per-branch cache + refresh-on-open semantics kept.
- Selecting a row drives the detail pane. Row kebabs removed — actions live in the detail pane.
- Viewing another branch: same list for that branch beneath the banner.

### Detail pane (History selection)

- Hero card: full untruncated description, avatar, author, absolute date, short checkpoint id with a copy button.
- Action row: Restore, New Branch, Compare with previous, Hard Reset… (danger red). Restore + Hard Reset only on the current branch with write access (today's rules); New Branch + Compare always (write access for New Branch).
- "Changes in this checkpoint" card: checkpoint-vs-previous via `diffCreate`, loaded lazily on selection, cached per checkpoint; counts by type + "Open full diff →".

## Flows

### Compare mode

- Entered via top-bar Compare (or pre-filled by "Compare with previous").
- History rows (plus a "Working state" row at the top of the current branch) get checkboxes, capped at two selections; further rows disable at two.
- Floating bottom bar shows the two slots and a primary **Compare** button; opens the existing diff viewer.
- The viewed branch can be changed mid-mode for cross-branch compares. Changes tab disables during compare. "Exit" in the top bar leaves the mode.

### Dialogs (replace full-pane form swaps)

One parameterized modal component (title, body, optional input, optional type-to-confirm, primary/danger CTA):

- **Merge into \<branch\>** — source → destination summary, note about automatic checkpoint; conflicts continue to the existing merge resolution view.
- **New Branch** — name field; "From: \<checkpoint\> · latest checkpoint of \<branch\>" (pre-filled with a specific checkpoint when launched from the detail pane).
- **Restore** — confirmation with checkpoint summary.
- **Close / Re-open branch** — confirmation.
- **Delete branch** / **Hard Reset** — type-to-confirm (kept from today), red danger CTA, disabled until the text matches.

Esc/Cancel closes with full context intact.

### Progress and errors

- Branch switch, merge, restore, hard reset keep the existing full-screen progress overlays.
- Checkpoint creation is inline: form button enters a spinner state; on success the new checkpoint appears at the top of History and Changes resets to empty.
- Operation failures route to the existing messenger error widget. Dialog field errors (duplicate name, wrong confirm text) render inline red. List-load failures show an inline retry row.

## Architecture

`src/editor/pickers/version-control/`:

| File | Responsibility |
| --- | --- |
| `picker-version-control.ts` | Shell: picker tab registration, top bar, layout, mode state (normal / compare / viewing-branch), wiring |
| `branch-switcher.ts` | Switcher button + dropdown panel |
| `panel-changes.ts` | Changes tab + pinned form |
| `panel-history.ts` | History list (groups, infinite scroll, selection, compare checkboxes) |
| `panel-detail.ts` | Detail pane |
| `dialogs.ts` | Shared parameterized modal + the six dialog configurations |

- **Kept:** `picker-version-control-progress.ts`, `picker-version-control-messenger.ts`, `picker-version-control-overlay-*.ts`, diff viewer / conflict manager.
- **Deleted after migration:** the seven side-panel form files and their `picker-version-control-side-panel.ts` factory, `picker-version-control-checkpoints.ts`, `picker-version-control-diff-checkpoints.ts`, `ui/version-control-side-panel-box.ts`.
- Externally-consumed Caller methods (`picker:versioncontrol:*`, e.g. the checkpoint widget used by other pickers) keep names and signatures.

## Data flow

- Branches: `rest.branches.branchesList` with existing filter params; client-side search; infinite scroll.
- Checkpoints: `rest.branches.branchCheckpoints({ branchId, limit, skip })`; per-branch cache + refresh-on-open.
- Diffs: existing `diffCreate` job for working-vs-latest (Changes tab) and checkpoint-vs-previous (detail card); lazy, cached, messenger-invalidated.
- Realtime: existing messenger events keep lists current. Permissions: existing `permissions:write` / `writeState` gates re-render action buttons.

**Risk:** `diffCreate` cost on large projects. Mitigations: compute only on tab open / row selection, cache, manual refresh. Fallback if too slow: Changes tab renders the form immediately with an explicit "Compute changes" button instead of auto-running.

## Styles

New partial `sass/editor/_editor-version-control-picker.scss` imported from `editor.scss`, reusing builds tokens (6px-radius bordered cards, `rgb(0 0 0 / 8%)` header bars, orange primary CTAs, secondary grey buttons, `#354144` row hover, kebab icon buttons). Old `.picker-version-control` blocks in `_editor-main.scss` and obsolete rules in `sass/common/_version-control.scss` are removed with the code they style.

## Testing

- Extend `test-suite/test/ui/basic.test.ts` (builds-PR pattern): picker opens, tabs switch, branch switcher opens, checkpoint form gates on input, compare mode caps at two selections.
- Mocha unit tests for pure helpers: date grouping, relative dates, diff summarization.
- Manual pass via `npm run develop` before completion.

## Out of scope

- VC graph internals, diff viewer / conflict manager internals (reused as-is).
- Backend/API changes.
- The merge progress overlays' flows (restyled previously, behavior unchanged).

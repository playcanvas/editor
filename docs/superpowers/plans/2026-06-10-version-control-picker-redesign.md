# Version Control Picker Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the version control picker as a GitHub Desktop-style UI (top-bar branch switcher, Changes/History tabs, detail pane, modal dialogs) per the approved spec.

**Architecture:** A shell module (`picker-version-control.ts`) owns the top bar, mode state and all operation flows; four focused modules provide the branch switcher, Changes tab, History tab and detail pane, communicating with the shell via pcui events. Forms become parameterized modal dialogs. Pure date/diff helpers are extracted and unit-tested.

**Tech Stack:** TypeScript, pcui (`@playcanvas/pcui`), plain DOM rows (builds-panel pattern), SASS, Mocha+Chai (unit), Playwright (`test-suite/`, UI).

**Spec:** `docs/superpowers/specs/2026-06-10-version-control-picker-redesign-design.md`

**Branch:** work on `feat/modern-version-control-pickers` (already has the styling pass + spec).

---

## Verified codebase facts (read these first)

- **REST:** `editor.api.globals.rest.projects.projectBranches({ limit?, skip?, closed?, favorite? })` → `{ result, pagination: { hasMore } }`. `rest.branches.branchCreate({ name, projectId, sourceBranchId, sourceCheckpointId? })`, `branchCheckout({ branchId })`, `branchOpen/branchClose/branchDelete({ branchId })`, `branchCheckpoints({ branchId, limit?, skip? })` → `{ result, pagination: { hasMore } }`. `rest.checkpoints.checkpointRestore({ checkpointId, branchId })`, `checkpointHardReset({ checkpointId, branchId })`. `rest.merge.mergeCreate({ srcBranchId, dstBranchId, srcBranchClose })`, `mergeGet({ mergeId })`. All consumed via `handleCallback(promise, (err, data) => ...)` from `@/common/utils`.
- **Jobs:** `import { checkpointCreate as checkpointCreateJob, diffCreate } from '../../messenger/jobs';` — `diffCreate({ srcBranchId, srcCheckpointId, dstBranchId, dstCheckpointId, histItem? })` resolves a `Diff`; `checkpointCreateJob({ projectId, branchId, description })` resolves the new checkpoint.
- **Diff shape** (`src/editor-api/models.ts`): `diff.numConflicts: number`, `diff.conflicts?: Array<{ itemId, itemType, itemName, assetType, data: Array<{ missingInSrc?: boolean, missingInDst?: boolean, ... }> }>`.
- **Checkpoint shape:** `{ id: string, description: string, createdAt: string, user: { id: string, fullName?: string } }`.
- **Branch shape:** `{ id: string, name: string, closed?: boolean, latestCheckpointId?: string }`; current branch is `config.self.branch`; master is `config.project.masterBranch`.
- **Messenger events:** `messenger:branch.createEnded`, `messenger:branch.close`, `messenger:branch.open`, `messenger:branch.delete`, `messenger:branch.switch`, `messenger:checkpoint.createEnded` (payload uses snake_case: `branch_id`, `checkpoint_id`, `user_id`, `status`, `message`).
- **Kept files & their Caller methods (do not touch):** `picker-version-control-progress.ts` (`picker:versioncontrol:createProgressWidget`, `isProgressWidgetVisible`, `isErrorWidgetVisible`), `picker-version-control-overlay-message.ts` / `-overlay-merge.ts` (`createOverlay`, `mergeOverlay`, `mergeOverlay:hide`), `picker-version-control-messenger.ts` (consumes only kept-file methods).
- **External Caller consumers the new shell must re-provide:** `picker:versioncontrol` (toolbar-logo, viewport-scene, conflict-manager) and `picker:versioncontrol:transformCheckpointData` (vc graph). **The `vcgraph:*` methods (`closeGraphPanel`, `moveToBackground`, `moveToForeground`, `isHidden`, `showGraphPanel`) are currently defined in `picker-version-control-checkpoints.ts` (deleted) and MUST move to the new shell.**
- **Favorites:** `editor.call('settings:projectUser')` observer — `get('favoriteBranches'): string[]`, `insert('favoriteBranches', id)`, `remove('favoriteBranches', index)`, events `favoriteBranches:insert` / `favoriteBranches:remove`.
- **Permissions:** `editor.call('permissions:read')`, `permissions:write`, event `permissions:writeState`.
- **Picker frame:** `editor.call('picker:project:registerMenu', 'version control', 'Version Control', panel)`, `picker:project:setClosable`, `picker:project:toggleLeftPanel`, `picker:project:close`, `picker:project:toggleMenu`.
- **Style tokens** (defined in pcui theme, available in all editor SASS): `$bcg-darkest #20292b`, `$bcg-darker #293538`, `$bcg-dark #2c393c`, `$bcg-primary #364346`, `$text-darkest`, `$text-dark`, `$text-secondary`, `$text-primary`, `$text-active #f60`, `$error-secondary #d34141`, `$border-primary #232e30`, `$element-shadow-hover`, `$element-shadow-active`, `$element-opacity-disabled`. Row hover color: `#354144`. Link blue: `#9dd4ff`.
- **Lint/build commands:** `npx stylelint sass`, `npx eslint <files>`, `npm run type:check`, `npm test` (mocha, spec `test/**/*.test.*`), sass compile check: `node -e "import('sass-embedded').then(async s => { await s.compileAsync('sass/editor.scss', { logger: s.Logger.silent }); console.log('ok'); })"`.
- **Known pre-existing issue:** `npm run type:check` already fails on dynamic-property patterns in the OLD picker files. The rewrite must not add new errors; deleting the old files removes most existing ones.

## File structure

| File | Action | Responsibility |
| --- | --- | --- |
| `src/editor/pickers/version-control/vc-helpers.ts` | Create | Pure helpers: relative dates, day grouping, diff summarization |
| `test/editor/vc-helpers.test.ts` | Create | Mocha unit tests for the helpers |
| `sass/editor/_editor-version-control-picker.scss` | Create | All new picker styles (builds tokens) |
| `sass/editor.scss` | Modify | Import the new partial |
| `src/editor/pickers/version-control/dialogs.ts` | Create | `showVcDialog(opts)` parameterized modal |
| `src/editor/pickers/version-control/branch-switcher.ts` | Create | Top-bar switcher button + dropdown panel |
| `src/editor/pickers/version-control/panel-history.ts` | Create | History list: day groups, infinite scroll, selection, compare checkboxes |
| `src/editor/pickers/version-control/panel-detail.ts` | Create | Detail pane: hero, actions, lazy changes card |
| `src/editor/pickers/version-control/panel-changes.ts` | Create | Changes tab sidebar (item list + pinned form) and main summary card |
| `src/editor/pickers/version-control/picker-version-control.ts` | Rewrite | Shell: registration, top bar, tabs, modes, operations, messenger, vcgraph host, hotkey |
| `src/editor/index.ts` | Modify | Swap side-effect imports |
| `sass/editor/_editor-main.scss` | Modify | Delete the old `.pcui-container.picker-version-control` block |
| `sass/common/_version-control.scss` | Modify | Delete old search + branch-list rules (keep overlay + menu styles) |
| 8 old TS files (side panels, checkpoints, diff-checkpoints, side-panel-box) | Delete | Superseded |
| `test-suite/test/ui/version-control.test.ts` | Rewrite selectors | Drive the new UI |

DOM ids kept for tests/messenger updates: branch rows get `id="branch-<id>"`, checkpoint rows `id="checkpoint-<id>"`.

---

### Task 1: Pure helpers (TDD)

**Files:**
- Create: `src/editor/pickers/version-control/vc-helpers.ts`
- Create: `test/editor/vc-helpers.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// test/editor/vc-helpers.test.ts
import { expect } from 'chai';

import { formatRelativeDate, formatDayGroup, summarizeDiff } from '../../src/editor/pickers/version-control/vc-helpers';

describe('vc-helpers', () => {
    const now = new Date('2026-06-10T15:00:00');

    describe('formatRelativeDate', () => {
        it('returns "just now" under a minute', () => {
            expect(formatRelativeDate(new Date('2026-06-10T14:59:30'), now)).to.equal('just now');
        });

        it('returns minutes ago same day', () => {
            expect(formatRelativeDate(new Date('2026-06-10T14:15:00'), now)).to.equal('45 minutes ago');
            expect(formatRelativeDate(new Date('2026-06-10T14:59:00'), now)).to.equal('1 minute ago');
        });

        it('returns hours ago same day', () => {
            expect(formatRelativeDate(new Date('2026-06-10T12:00:00'), now)).to.equal('3 hours ago');
            expect(formatRelativeDate(new Date('2026-06-10T14:00:00'), now)).to.equal('1 hour ago');
        });

        it('returns absolute date for other days', () => {
            expect(formatRelativeDate(new Date('2026-06-08T10:00:00'), now)).to.equal('Jun 8, 2026');
        });
    });

    describe('formatDayGroup', () => {
        it('returns Today for same day', () => {
            expect(formatDayGroup(new Date('2026-06-10T01:00:00'), now)).to.equal('Today');
        });

        it('returns weekday, month day, year otherwise', () => {
            expect(formatDayGroup(new Date('2026-06-08T10:00:00'), now)).to.equal('Mon, Jun 8, 2026');
        });
    });

    describe('summarizeDiff', () => {
        it('handles empty diff', () => {
            expect(summarizeDiff({ numConflicts: 0 })).to.deep.equal({ total: 0, groups: [] });
        });

        it('groups by item type with status from missing flags', () => {
            const diff = {
                numConflicts: 3,
                conflicts: [
                    { itemType: 'scene', itemName: 'Terrain', data: [{}] },
                    { itemType: 'asset', itemName: 'water.glsl', data: [{ missingInDst: true }] },
                    { itemType: 'asset', itemName: 'old.png', data: [{ missingInSrc: true }] }
                ]
            };
            expect(summarizeDiff(diff)).to.deep.equal({
                total: 3,
                groups: [
                    { type: 'scene', items: [{ name: 'Terrain', status: 'modified' }] },
                    { type: 'asset', items: [
                        { name: 'water.glsl', status: 'added' },
                        { name: 'old.png', status: 'deleted' }
                    ] }
                ]
            });
        });
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- --grep vc-helpers`
Expected: FAIL — cannot find module `vc-helpers`.

- [ ] **Step 3: Write the implementation**

```ts
// src/editor/pickers/version-control/vc-helpers.ts

export type DiffStatus = 'added' | 'deleted' | 'modified';

export type DiffSummary = {
    total: number;
    groups: { type: string; items: { name: string; status: DiffStatus }[] }[];
};

const sameDay = (a: Date, b: Date) => {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
};

// relative time for same-day values, absolute date otherwise (builds panel convention)
export const formatRelativeDate = (value: string | Date, now = new Date()) => {
    const d = new Date(value);
    if (!sameDay(d, now)) {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    const mins = Math.max(0, Math.floor((now.getTime() - d.getTime()) / 60000));
    if (mins < 1) {
        return 'just now';
    }
    if (mins < 60) {
        return mins === 1 ? '1 minute ago' : `${mins} minutes ago`;
    }
    const hours = Math.floor(mins / 60);
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
};

export const formatDayGroup = (value: string | Date, now = new Date()) => {
    const d = new Date(value);
    if (sameDay(d, now)) {
        return 'Today';
    }
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).replace(/(\w+) (\w+ \d+), (\d+)/, '$1, $2, $3');
};

type DiffLike = {
    numConflicts?: number;
    conflicts?: { itemType: string; itemName: string; data?: { missingInSrc?: boolean; missingInDst?: boolean }[] }[];
};

export const summarizeDiff = (diff: DiffLike): DiffSummary => {
    const groups = new Map<string, { name: string; status: DiffStatus }[]>();
    for (const c of diff.conflicts ?? []) {
        const entry = c.data?.[0] ?? {};
        const status: DiffStatus = entry.missingInDst ? 'added' : entry.missingInSrc ? 'deleted' : 'modified';
        if (!groups.has(c.itemType)) {
            groups.set(c.itemType, []);
        }
        groups.get(c.itemType).push({ name: c.itemName, status });
    }
    return {
        total: diff.numConflicts ?? 0,
        groups: [...groups.entries()].map(([type, items]) => ({ type, items }))
    };
};
```

Note: if the `formatDayGroup` regex approach proves brittle against `toLocaleDateString` output, build the string manually instead: `` `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}` `` with `const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];` and `const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];` hoisted to the top of the file. Use whichever makes the test pass deterministically — prefer the manual table version if in doubt.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- --grep vc-helpers`
Expected: 7 passing.

- [ ] **Step 5: Lint and commit**

```bash
npx eslint src/editor/pickers/version-control/vc-helpers.ts test/editor/vc-helpers.test.ts
git add src/editor/pickers/version-control/vc-helpers.ts test/editor/vc-helpers.test.ts
git commit -m "feat: add version control date and diff summary helpers"
```

---

### Task 2: SASS partial

**Files:**
- Create: `sass/editor/_editor-version-control-picker.scss`
- Modify: `sass/editor.scss` (add `@import 'editor/editor-version-control-picker';` after the `editor/editor-main` import line)

- [ ] **Step 1: Create the partial**

The full stylesheet. Class names here are the contract for Tasks 3–8 — do not rename in either place.

```scss
// modern version control picker (github desktop style)

.pcui-container.picker-vc {
    height: 100%;
    overflow: hidden;
    flex-direction: column;

    // ---- top bar ----
    > .vc-top-bar {
        display: flex;
        flex: none;
        align-items: stretch;
        border-bottom: 1px solid $border-primary;
        background-color: $bcg-dark;

        > .vc-branch-button {
            appearance: none;
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 220px;
            margin: 0;
            padding: 8px 16px;
            border: none;
            border-right: 1px solid $border-primary;
            background-color: $bcg-darkest;
            color: $text-secondary;
            text-align: left;
            cursor: pointer;
            transition: background-color 100ms, color 100ms;

            &:hover,
            &.active {
                color: $text-primary;
                background-color: $bcg-darker;
            }

            > .labels {
                min-width: 0;

                > .hint {
                    display: block;
                    color: $text-dark;
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                > .name {
                    @extend .font-bold;

                    display: block;
                    max-width: 260px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    color: $text-primary;
                    font-size: 14px;
                }
            }

            &::after {
                content: '';
                width: 10px;
                height: 10px;
                margin-left: auto;
                background-color: currentcolor;
                mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M4 6h8l-4 4-4-4Z'/%3E%3C/svg%3E") center / contain no-repeat;
            }
        }

        > .vc-top-actions {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-left: auto;
            padding: 0 16px;

            > .pcui-button {
                @extend .font-bold;

                display: inline-flex;
                align-items: center;
                justify-content: center;
                height: 32px;
                margin: 0;
                padding: 0 14px;
                border: 1px solid $bcg-darkest;
                border-radius: 6px;
                color: $text-secondary;
                background-color: $bcg-dark;
                font-size: 12px;
                box-shadow: none;
                cursor: pointer;
                transition: color 100ms, background-color 100ms, opacity 100ms, box-shadow 100ms;

                &[data-icon]::before {
                    font-size: 14px;
                    line-height: 1;
                    margin-right: 6px;
                }

                &:not(.pcui-disabled):hover,
                &:not(.pcui-disabled):focus {
                    color: $text-primary;
                    box-shadow: $element-shadow-hover;
                }

                &:not(.pcui-disabled):active {
                    background-color: $bcg-darkest;
                    box-shadow: none;
                }

                &.pcui-disabled {
                    opacity: $element-opacity-disabled;
                    cursor: default;
                }

                &.vc-primary {
                    color: $text-primary;
                    border-color: transparent;
                    background-color: $text-active;

                    &:not(.pcui-disabled):hover,
                    &:not(.pcui-disabled):focus {
                        background-color: color.adjust($text-active, $lightness: -7%);
                    }

                    &:not(.pcui-disabled):active {
                        background-color: color.adjust($text-active, $lightness: -12%);
                    }
                }

                &.vc-compare-active {
                    color: $text-primary;
                    background-color: $bcg-darkest;
                    border-color: $border-primary;
                    box-shadow: $element-shadow-active;
                }
            }
        }
    }

    // ---- body: sidebar + main ----
    > .vc-body {
        display: flex;
        flex: 1 1 auto;
        min-height: 0;

        > .vc-sidebar {
            display: flex;
            flex: none;
            flex-direction: column;
            width: 300px;
            min-height: 0;
            border-right: 1px solid $border-primary;

            > .vc-view-banner {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 8px 12px;
                border-bottom: 1px solid $border-primary;
                background-color: rgb(255 102 0 / 8%);
                color: $text-secondary;
                font-size: 12px;

                > .name {
                    @extend .font-bold;

                    min-width: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    color: $text-primary;
                }

                > .return {
                    appearance: none;
                    margin-left: auto;
                    padding: 0;
                    border: none;
                    background: transparent;
                    color: #9dd4ff;
                    font-size: 12px;
                    cursor: pointer;
                    white-space: nowrap;

                    &:hover {
                        text-decoration: underline;
                    }
                }
            }

            > .vc-tabs {
                display: flex;
                flex: none;
                border-bottom: 1px solid $border-primary;
                background-color: rgb(0 0 0 / 8%);

                > .vc-tab {
                    @extend .font-bold;

                    appearance: none;
                    flex: 1 1 0;
                    padding: 10px 0;
                    border: none;
                    background: transparent;
                    color: $text-dark;
                    font-size: 12px;
                    cursor: pointer;
                    transition: color 100ms, box-shadow 100ms;

                    &:hover {
                        color: $text-secondary;
                    }

                    &.active {
                        color: $text-primary;
                        box-shadow: inset 0 -2px 0 $text-active;
                    }

                    &:disabled {
                        opacity: $element-opacity-disabled;
                        cursor: default;
                    }
                }
            }

            > .vc-tab-content {
                display: flex;
                flex: 1 1 auto;
                flex-direction: column;
                min-height: 0;
            }
        }

        > .vc-main {
            flex: 1 1 auto;
            min-width: 0;
            overflow-y: auto;
            padding: 16px;

            // kept progress widgets render here now (was .side-panel)
            > .progress-widget {
                margin: 60px auto;

                .ui-label {
                    width: 100%;
                    color: $text-primary;
                    font-size: 16px;
                    text-align: center;

                    &.note {
                        color: $text-secondary;
                        font-size: 12px;

                        &:not(.hidden) {
                            display: block;
                        }
                    }
                }

                svg {
                    margin: 15px auto auto;
                }
            }
        }
    }

    // ---- shared card (builds form-section style) ----
    .vc-card {
        margin: 0 0 12px;
        padding: 14px 16px;
        border: 1px solid $border-primary;
        border-radius: 6px;
        background-color: rgb(0 0 0 / 8%);

        > h3 {
            @extend .font-bold;

            margin: 0 0 6px;
            color: $text-primary;
            font-size: 13px;
        }

        .vc-meta {
            color: $text-dark;
            font-size: 12px;
        }
    }

    .vc-pill {
        display: inline-block;
        margin: 8px 6px 0 0;
        padding: 2px 10px;
        border: 1px solid $border-primary;
        border-radius: 10px;
        background-color: rgb(0 0 0 / 14%);
        color: $text-primary;
        font-size: 12px;
    }

    // secondary action button (cards, lists)
    .vc-button {
        @extend .font-bold;

        appearance: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 28px;
        margin: 0;
        padding: 0 12px;
        border: 1px solid $bcg-darkest;
        border-radius: 6px;
        color: $text-secondary;
        background-color: $bcg-dark;
        font-size: 12px;
        box-shadow: none;
        cursor: pointer;
        transition: color 100ms, background-color 100ms, opacity 100ms, box-shadow 100ms;

        &:hover,
        &:focus {
            color: $text-primary;
            box-shadow: $element-shadow-hover;
        }

        &:active {
            background-color: $bcg-darkest;
            box-shadow: none;
        }

        &:disabled,
        &.pcui-disabled {
            opacity: $element-opacity-disabled;
            cursor: default;
        }

        &.danger {
            color: #ff8a8a;
            border-color: rgb(211 65 65 / 40%);
        }
    }

    .vc-link {
        appearance: none;
        padding: 0;
        border: none;
        background: transparent;
        color: #9dd4ff;
        font-size: 12px;
        cursor: pointer;

        &:hover {
            text-decoration: underline;
        }
    }

    // ---- history list ----
    .vc-history {
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;

        > .vc-day {
            @extend .font-bold;

            position: sticky;
            top: 0;
            z-index: 1;
            padding: 6px 12px;
            border-top: 1px solid $border-primary;
            border-bottom: 1px solid $border-primary;
            background-color: $bcg-darker;
            color: $text-primary;
            font-size: 11px;
            text-transform: uppercase;

            &:first-child {
                border-top: none;
            }
        }

        > .vc-row {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            padding: 11px 12px;
            border-bottom: 1px solid $border-primary;
            cursor: pointer;
            transition: background-color 100ms ease;

            &:hover {
                background-color: #354144;
            }

            &.selected {
                background-color: #354144;
                box-shadow: inset 2px 0 0 $text-active;
            }

            > .avatar {
                flex: none;
                width: 22px;
                height: 22px;
                border: 1px solid $border-primary;
                border-radius: 50%;
                background-color: $bcg-darkest;
                box-sizing: border-box;
            }

            > .check {
                flex: none;
                margin-top: 3px;
            }

            > .body {
                min-width: 0;

                > .desc {
                    @extend .font-bold;

                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    color: $text-primary;
                    font-size: 13px;
                }

                > .sub {
                    margin-top: 2px;
                    color: $text-dark;
                    font-size: 11px;
                }
            }

            &.disabled {
                opacity: $element-opacity-disabled;
                pointer-events: none;
            }
        }

        > .vc-list-status {
            padding: 12px;
            color: $text-dark;
            font-size: 12px;
            text-align: center;
        }
    }

    // ---- changes tab ----
    .vc-changes {
        display: flex;
        flex: 1 1 auto;
        flex-direction: column;
        min-height: 0;

        > .vc-changes-list {
            flex: 1 1 auto;
            min-height: 0;
            overflow-y: auto;

            > .vc-group {
                @extend .font-bold;

                padding: 6px 12px;
                border-bottom: 1px solid $border-primary;
                background-color: rgb(0 0 0 / 12%);
                color: $text-primary;
                font-size: 11px;
                text-transform: uppercase;
            }

            > .vc-item {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 7px 12px;
                border-bottom: 1px solid $border-primary;
                color: $text-primary;
                font-size: 12px;

                > .name {
                    min-width: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                > .status {
                    @extend .font-bold;

                    flex: none;
                    margin-left: auto;
                    padding: 1px 7px;
                    border: 1px solid $border-primary;
                    border-radius: 8px;
                    background-color: rgb(0 0 0 / 14%);
                    font-size: 9px;
                    text-transform: uppercase;

                    &.added { color: #6fd088; }
                    &.modified { color: #f3c16f; }
                    &.deleted { color: #ff8a8a; }
                }
            }

            > .vc-list-status {
                padding: 12px;
                color: $text-dark;
                font-size: 12px;
                text-align: center;
            }
        }

        > .vc-checkpoint-form {
            flex: none;
            padding: 12px;
            border-top: 1px solid $border-primary;
            background-color: $bcg-dark;

            > .pcui-text-area-input {
                width: 100%;
                margin: 0 0 8px;
                border: 1px solid $border-primary;
                border-radius: 4px;
                background-color: $bcg-darkest;
                transition: box-shadow 100ms;

                > textarea {
                    @extend .font-regular;

                    display: block;
                    width: calc(100% - 20px);
                    height: 56px;
                    margin: 0;
                    padding: 10px;
                    border: none;
                    background: transparent;
                    color: $text-primary;
                    font-size: 13px;
                    outline: none;
                    box-shadow: none;
                }

                &:hover { box-shadow: $element-shadow-hover; }
                &:focus-within { box-shadow: $element-shadow-active; }
            }

            > .vc-create-checkpoint {
                @extend .font-bold;

                appearance: none;
                display: block;
                width: 100%;
                height: 32px;
                border: none;
                border-radius: 6px;
                background-color: $text-active;
                color: $text-primary;
                font-size: 13px;
                cursor: pointer;
                transition: background-color 100ms, opacity 100ms, box-shadow 100ms;

                &:hover:not(:disabled) {
                    background-color: color.adjust($text-active, $lightness: -7%);
                    box-shadow: $element-shadow-hover;
                }

                &:disabled {
                    opacity: $element-opacity-disabled;
                    cursor: default;
                }

                &.busy {
                    pointer-events: none;
                    opacity: 0.7;
                }
            }
        }
    }

    // shimmer skeleton (builds pattern)
    .vc-skeleton {
        > .skeleton-row {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 11px 12px;
            border-bottom: 1px solid $border-primary;

            > .bone {
                border-radius: 4px;
                background-color: rgb(255 255 255 / 8%);
                animation: vc-skeleton-pulse 1.4s ease-in-out infinite;

                &.dot { flex: none; width: 22px; height: 22px; border-radius: 50%; }
                &.line { height: 10px; flex: 1 1 auto; }
            }

            &:nth-child(2) .bone { animation-delay: 120ms; }
            &:nth-child(3) .bone { animation-delay: 240ms; }
        }
    }

    // ---- detail pane ----
    .vc-detail-hero {
        display: flex;
        gap: 12px;
        align-items: flex-start;

        > .avatar {
            flex: none;
            width: 40px;
            height: 40px;
            border: 1px solid $border-primary;
            border-radius: 50%;
            background-color: $bcg-darkest;
            box-sizing: border-box;
        }

        > .body {
            min-width: 0;
            flex: 1 1 auto;

            > .title {
                @extend .font-bold;

                margin: 0 0 4px;
                color: $text-primary;
                font-size: 15px;
                white-space: pre-wrap;
                word-break: break-word;
            }

            > .vc-meta > .copy-id {
                appearance: none;
                margin-left: 6px;
                padding: 1px 6px;
                border: 1px solid $border-primary;
                border-radius: 4px;
                background: transparent;
                color: $text-dark;
                font-size: 10px;
                cursor: pointer;

                &:hover { color: $text-primary; }
            }
        }
    }

    .vc-detail-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 12px;
    }

    .vc-empty-detail {
        color: $text-dark;
        font-size: 13px;
        padding: 24px;
        text-align: center;
    }

    // ---- compare bar ----
    > .vc-compare-bar {
        position: absolute;
        right: 16px;
        bottom: 12px;
        left: 316px;
        z-index: 2;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 14px;
        border: 1px solid $border-primary;
        border-radius: 8px;
        background-color: $bcg-dark;
        box-shadow: 0 8px 24px rgb(0 0 0 / 45%);

        > .slot {
            flex: 1 1 0;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            padding: 6px 10px;
            border: 1px dashed $text-darkest;
            border-radius: 6px;
            color: $text-dark;
            font-size: 12px;

            &.full {
                border-style: solid;
                border-color: $border-primary;
                background-color: rgb(0 0 0 / 14%);
                color: $text-primary;
            }
        }
    }
}

// branch switcher dropdown (appended to layout root, positioned under the button)
.pcui-container.vc-branch-panel {
    position: absolute;
    z-index: 100002;
    width: 320px;
    max-height: 480px;
    border: 1px solid $border-primary;
    border-radius: 8px;
    background-color: $bcg-dark;
    box-shadow: 0 12px 32px rgb(0 0 0 / 55%);
    overflow: hidden;
    flex-direction: column;

    > .vc-branch-filter {
        display: flex;
        flex: none;
        gap: 6px;
        padding: 10px;
        border-bottom: 1px solid $border-primary;

        > .pcui-text-input {
            flex: 1 1 auto;
            margin: 0;
            border: 1px solid $bcg-darkest;
            border-radius: 4px;
            background-color: $bcg-darkest;
        }

        > .pcui-select-input {
            flex: none;
            width: 110px;
            margin: 0;
        }
    }

    > .vc-branch-list {
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;

        > .vc-group {
            @extend .font-bold;

            padding: 5px 12px;
            border-bottom: 1px solid $border-primary;
            background-color: rgb(0 0 0 / 12%);
            color: $text-dark;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        > .vc-branch-row {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            border-bottom: 1px solid $border-primary;
            cursor: pointer;
            transition: background-color 100ms ease;

            &:hover { background-color: #354144; }

            > .icon {
                flex: none;
                width: 14px;
                color: $text-darkest;
                font-size: 10px;
                text-align: center;

                &.current { color: #6fd088; }
                &.favorite { color: #f3c16f; }
            }

            > .name {
                @extend .font-bold;

                min-width: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                color: $text-primary;
                font-size: 13px;

                &.closed { color: $text-secondary; }
            }

            > .sub {
                flex: none;
                color: $text-dark;
                font-size: 10px;
            }

            > .row-actions {
                display: none;
                align-items: center;
                gap: 6px;
                margin-left: auto;
            }

            &:hover > .row-actions { display: flex; }
            &:hover > .sub { display: none; }

            > .row-actions > .switch {
                @extend .font-bold;

                appearance: none;
                padding: 3px 10px;
                border: 1px solid $bcg-darkest;
                border-radius: 4px;
                background-color: $bcg-darker;
                color: $text-secondary;
                font-size: 11px;
                cursor: pointer;

                &:hover { color: $text-primary; box-shadow: $element-shadow-hover; }
            }

            > .row-actions > .kebab {
                appearance: none;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 24px;
                height: 24px;
                padding: 0;
                border: 1px solid transparent;
                border-radius: 4px;
                background: transparent;
                color: $text-dark;
                cursor: pointer;

                &::before {
                    content: '';
                    width: 14px;
                    height: 14px;
                    background-color: currentcolor;
                    mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ccircle cx='3' cy='8' r='1.4'/%3E%3Ccircle cx='8' cy='8' r='1.4'/%3E%3Ccircle cx='13' cy='8' r='1.4'/%3E%3C/svg%3E") center / contain no-repeat;
                }

                &:hover {
                    color: $text-primary;
                    background-color: $bcg-darker;
                    border-color: $bcg-darkest;
                }
            }
        }

        > .vc-list-status {
            padding: 12px;
            color: $text-dark;
            font-size: 12px;
            text-align: center;
        }
    }

    > .vc-new-branch {
        @extend .font-bold;

        appearance: none;
        flex: none;
        padding: 10px 12px;
        border: none;
        border-top: 1px solid $border-primary;
        background: transparent;
        color: #9dd4ff;
        font-size: 12px;
        text-align: left;
        cursor: pointer;

        &:hover { background-color: #354144; }
    }
}

// modal dialogs
.pcui-container.vc-dialog-overlay {
    position: fixed;
    inset: 0;
    z-index: 100003;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgb(0 0 0 / 50%);

    > .vc-dialog {
        width: 360px;
        border: 1px solid $border-primary;
        border-radius: 8px;
        background-color: $bcg-dark;
        box-shadow: 0 12px 32px rgb(0 0 0 / 55%);
        overflow: hidden;

        > .hd {
            @extend .font-bold;

            padding: 12px 16px;
            border-bottom: 1px solid $border-primary;
            background-color: rgb(0 0 0 / 8%);
            color: $text-primary;
            font-size: 14px;

            &.danger { color: #ff8a8a; }
        }

        > .bd {
            padding: 14px 16px;
            color: $text-secondary;
            font-size: 12px;
            line-height: 1.5;

            b { color: $text-primary; }

            > .pcui-text-input {
                width: 100%;
                margin: 10px 0 0;
                border: 1px solid $bcg-darkest;
                border-radius: 4px;
                background-color: $bcg-darkest;
            }

            > .vc-dialog-check {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-top: 10px;

                > .pcui-label { margin: 0; font-size: 12px; color: $text-primary; }
                > .pcui-boolean-input { margin: 0; flex: none; }
            }

            > .vc-dialog-error {
                margin-top: 8px;
                color: #ff8a8a;
                font-size: 12px;
            }
        }

        > .ft {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            padding: 12px 16px;
            border-top: 1px solid $border-primary;

            > .pcui-button {
                @extend .font-bold;

                height: 30px;
                margin: 0;
                padding: 0 16px;
                border: 1px solid $bcg-darkest;
                border-radius: 6px;
                color: $text-secondary;
                background-color: $bcg-dark;
                font-size: 12px;
                box-shadow: none;

                &:not(.pcui-disabled):hover { color: $text-primary; box-shadow: $element-shadow-hover; }

                &.pcui-disabled { opacity: $element-opacity-disabled; }

                &.confirm {
                    color: $text-primary;
                    border-color: transparent;
                    background-color: $text-active;

                    &:not(.pcui-disabled):hover { background-color: color.adjust($text-active, $lightness: -7%); }
                }

                &.confirm.danger {
                    background-color: $error-secondary;

                    &:not(.pcui-disabled):hover { background-color: color.adjust($error-secondary, $lightness: -7%); }
                }
            }
        }
    }
}

@keyframes vc-skeleton-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.45; }
}
```

Note: `color.adjust` requires `@use 'sass:color';` — `_editor-main.scss` already uses it, confirm the import chain provides it; if the compile fails with "Undefined function color.adjust", add `@use 'sass:color';` as the first line of the partial.

- [ ] **Step 2: Wire the import**

In `sass/editor.scss`, after `@import 'editor/editor-main';` add:

```scss
@import 'editor/editor-version-control-picker';
```

- [ ] **Step 3: Verify compile + lint**

```bash
node -e "import('sass-embedded').then(async s => { await s.compileAsync('sass/editor.scss', { logger: s.Logger.silent }); console.log('ok'); })"
npx stylelint sass/editor/_editor-version-control-picker.scss
```

Expected: `ok`, no stylelint output.

- [ ] **Step 4: Commit**

```bash
git add sass/editor/_editor-version-control-picker.scss sass/editor.scss
git commit -m "feat: add modern version control picker styles"
```

---

### Task 3: Dialogs module

**Files:**
- Create: `src/editor/pickers/version-control/dialogs.ts`

- [ ] **Step 1: Write the module**

```ts
import { BooleanInput, Button, Container, Label, TextInput } from '@playcanvas/pcui';

export type VcDialogOpts = {
    title: string;
    // html-free body lines; entity names are passed through bold()
    body: (string | { bold: string })[];
    confirmText: string;
    danger?: boolean;
    input?: { placeholder: string };
    // confirm disabled until input matches exactly (type-to-confirm)
    confirmMatch?: string;
    checkboxes?: { key: string; label: string; value?: boolean }[];
    onConfirm: (values: { input: string; checks: Record<string, boolean> }) => void;
    onCancel?: () => void;
};

export type VcDialogHandle = {
    close: () => void;
    setError: (msg: string) => void;
};

export const showVcDialog = (opts: VcDialogOpts): VcDialogHandle => {
    const overlay = new Container({ class: 'vc-dialog-overlay' });
    const dialog = new Container({ class: 'vc-dialog' });
    overlay.append(dialog);

    const hd = document.createElement('div');
    hd.classList.add('hd');
    if (opts.danger) {
        hd.classList.add('danger');
    }
    hd.textContent = opts.title;
    dialog.dom.appendChild(hd);

    const bd = document.createElement('div');
    bd.classList.add('bd');
    dialog.dom.appendChild(bd);

    for (const line of opts.body) {
        if (typeof line === 'string') {
            bd.appendChild(document.createTextNode(line));
        } else {
            const b = document.createElement('b');
            b.textContent = line.bold;
            bd.appendChild(b);
        }
    }

    let input: TextInput = null;
    if (opts.input) {
        input = new TextInput({ placeholder: opts.input.placeholder, keyChange: true, renderChanges: false });
        bd.appendChild(input.dom);
    }

    const checks: Record<string, boolean> = {};
    const checkInputs: BooleanInput[] = [];
    for (const c of opts.checkboxes ?? []) {
        checks[c.key] = !!c.value;
        const row = document.createElement('div');
        row.classList.add('vc-dialog-check');
        const box = new BooleanInput({ value: !!c.value });
        box.on('change', (v: boolean) => {
            checks[c.key] = v;
        });
        checkInputs.push(box);
        row.appendChild(box.dom);
        const label = new Label({ text: c.label });
        row.appendChild(label.dom);
        bd.appendChild(row);
    }

    const error = document.createElement('div');
    error.classList.add('vc-dialog-error');
    error.hidden = true;
    bd.appendChild(error);

    const ft = document.createElement('div');
    ft.classList.add('ft');
    dialog.dom.appendChild(ft);

    const cancel = new Button({ text: 'Cancel' });
    ft.appendChild(cancel.dom);

    const confirm = new Button({ text: opts.confirmText, class: opts.danger ? ['confirm', 'danger'] : 'confirm' });
    ft.appendChild(confirm.dom);

    const updateConfirm = () => {
        confirm.enabled = !opts.confirmMatch || (input && input.value === opts.confirmMatch);
    };
    updateConfirm();
    if (input) {
        input.on('change', updateConfirm);
    }

    const close = () => {
        document.removeEventListener('keydown', onKey, true);
        overlay.destroy();
    };

    const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.stopPropagation();
            close();
            opts.onCancel?.();
        } else if (e.key === 'Enter' && confirm.enabled && document.activeElement?.tagName !== 'TEXTAREA') {
            e.stopPropagation();
            confirm.emit('click');
        }
    };
    document.addEventListener('keydown', onKey, true);

    cancel.on('click', () => {
        close();
        opts.onCancel?.();
    });

    confirm.on('click', () => {
        opts.onConfirm({ input: input ? input.value.trim() : '', checks });
    });

    // backdrop click cancels
    overlay.dom.addEventListener('mousedown', (e: MouseEvent) => {
        if (e.target === overlay.dom) {
            close();
            opts.onCancel?.();
        }
    });

    editor.call('layout.root').append(overlay);

    if (input) {
        setTimeout(() => input.focus());
    }

    return {
        close,
        setError: (msg: string) => {
            error.hidden = false;
            error.textContent = msg;
        }
    };
};
```

Design notes baked in: the dialog does NOT auto-close on confirm — callers close it on success or call `setError` on failure (gives inline duplicate-name errors). Esc and backdrop cancel.

- [ ] **Step 2: Verify lint + types**

```bash
npx eslint src/editor/pickers/version-control/dialogs.ts
npm run type:check 2>&1 | grep "dialogs.ts" || echo "clean"
```

Expected: no eslint output; `clean`.

- [ ] **Step 3: Commit**

```bash
git add src/editor/pickers/version-control/dialogs.ts
git commit -m "feat: add version control modal dialog component"
```

---

### Task 4: Branch switcher

**Files:**
- Create: `src/editor/pickers/version-control/branch-switcher.ts`

Emits (pcui events on the returned button container): `'switch' (branch)`, `'view' (branch)`, `'merge' (branch)`, `'close' (branch)`, `'open' (branch)`, `'delete' (branch)`, `'graph' (branch)`, `'newBranch'`. Exposes `refresh()`, `closePanel()`, `getBranch(id)`, `removeBranch(id)`, `panelHidden`.

- [ ] **Step 1: Write the module**

```ts
import { Button, Container, Menu, MenuItem, SelectInput, TextInput } from '@playcanvas/pcui';

import { LegacyTooltip } from '@/common/ui/tooltip';
import { handleCallback } from '@/common/utils';
import { config } from '@/editor/config';

const PAGE_SIZE = 50;

export const createBranchSwitcher = () => {
    const projectUserSettings = editor.call('settings:projectUser');

    let branches: Record<string, any> = {};
    let skip: string = null;
    let hasMore = false;
    let loading = false;
    let search = '';
    let contextBranch: any = null;

    // top-bar button
    const button = new Container({ class: 'vc-branch-button' });
    button.dom.setAttribute('role', 'button');
    const labels = document.createElement('span');
    labels.classList.add('labels');
    labels.innerHTML = '<span class="hint">Current branch</span><span class="name"></span>';
    button.dom.appendChild(labels);
    const nameEl = labels.querySelector('.name') as HTMLElement;
    nameEl.textContent = config.self.branch.name;

    // dropdown panel, appended to layout root so it floats over the picker
    const panel = new Container({ class: 'vc-branch-panel', hidden: true });
    editor.call('layout.root').append(panel);

    const filter = new Container({ class: 'vc-branch-filter' });
    panel.append(filter);

    const searchInput = new TextInput({ placeholder: 'Filter branches', keyChange: true, renderChanges: false });
    filter.append(searchInput);

    const filterSelect = new SelectInput({
        options: [
            { v: 'open', t: 'Open' },
            { v: 'favorite', t: 'Favorites' },
            { v: 'closed', t: 'Closed' }
        ],
        value: 'favorite'
    });
    filter.append(filterSelect);

    const list = new Container({ class: 'vc-branch-list' });
    panel.append(list);

    const newBranch = document.createElement('button');
    newBranch.type = 'button';
    newBranch.classList.add('vc-new-branch');
    newBranch.textContent = '+ New Branch';
    panel.dom.appendChild(newBranch);
    newBranch.addEventListener('click', () => {
        hidePanel();
        button.emit('newBranch');
    });

    // context menu for row kebabs
    const menu = new Menu({ class: 'version-control' });
    editor.call('layout.root').append(menu);

    const menuItems: { item: MenuItem; show: (b: any) => boolean }[] = [];
    const addMenuItem = (text: string, event: string, show: (b: any) => boolean, cls?: string) => {
        const item = new MenuItem(cls ? { text, class: cls } : { text });
        menu.append(item);
        item.on('select', () => {
            if (contextBranch) {
                hidePanel();
                button.emit(event, contextBranch);
            }
        });
        menuItems.push({ item, show });
        return item;
    };

    const writable = () => editor.call('permissions:write');
    const isCurrent = (b: any) => b.id === config.self.branch.id;
    const isMaster = (b: any) => b.id === config.project.masterBranch;

    const favItem = addMenuItem('Favorite', 'favorite', b => writable() && !isCurrent(b));
    addMenuItem('Merge Into Current Branch', 'merge', b => writable() && !isCurrent(b) && !b.closed);
    addMenuItem('Version Control Graph', 'graph', () => true);
    addMenuItem('Copy Branch ID', 'copyId', () => true);
    addMenuItem('Re-Open This Branch', 'open', b => writable() && !!b.closed);
    addMenuItem('Close This Branch', 'close', b => writable() && !b.closed && !isCurrent(b) && !isMaster(b));
    addMenuItem('Delete This Branch', 'delete', b => writable() && !isCurrent(b) && !isMaster(b), 'delete');

    menu.on('show', () => {
        const favs = projectUserSettings.get('favoriteBranches') || [];
        favItem.text = favs.includes(contextBranch?.id) ? 'Unfavorite This Branch' : 'Favorite This Branch';
        menuItems.forEach(({ item, show }) => {
            item.hidden = !contextBranch || !show(contextBranch);
        });
    });

    button.on('copyId', (b: any) => navigator.clipboard?.writeText(b.id));
    button.on('favorite', (b: any) => {
        const favs = projectUserSettings.get('favoriteBranches') || [];
        const index = favs.indexOf(b.id);
        if (index >= 0) {
            projectUserSettings.remove('favoriteBranches', index);
        } else {
            projectUserSettings.insert('favoriteBranches', b.id);
        }
        render();
    });

    const setStatus = (text: string) => {
        const status = document.createElement('div');
        status.classList.add('vc-list-status');
        status.textContent = text;
        list.dom.appendChild(status);
    };

    const matchesSearch = (b: any) => {
        return !search || editor.call('search:items', [[b.name, b.name]], search).length > 0;
    };

    const createRow = (branch: any) => {
        const row = document.createElement('div');
        row.classList.add('vc-branch-row');
        row.id = `branch-${branch.id}`;

        const favs = projectUserSettings.get('favoriteBranches') || [];
        const fav = favs.includes(branch.id);
        const icon = document.createElement('span');
        icon.classList.add('icon');
        if (isCurrent(branch)) {
            icon.classList.add('current');
            icon.textContent = '●';
        } else if (fav) {
            icon.classList.add('favorite');
            icon.textContent = '★';
        } else {
            icon.textContent = branch.closed ? '✕' : '●';
        }
        row.appendChild(icon);

        const name = document.createElement('span');
        name.classList.add('name');
        if (branch.closed) {
            name.classList.add('closed');
        }
        name.textContent = branch.name;
        name.title = branch.name;
        row.appendChild(name);

        if (isCurrent(branch)) {
            const sub = document.createElement('span');
            sub.classList.add('sub');
            sub.textContent = 'current';
            row.appendChild(sub);
        } else {
            const actions = document.createElement('span');
            actions.classList.add('row-actions');
            row.appendChild(actions);

            if (!branch.closed) {
                const sw = document.createElement('button');
                sw.type = 'button';
                sw.classList.add('switch');
                sw.textContent = 'Switch';
                sw.addEventListener('click', (e) => {
                    e.stopPropagation();
                    hidePanel();
                    button.emit('switch', branch);
                });
                actions.appendChild(sw);
            }

            const kebab = document.createElement('button');
            kebab.type = 'button';
            kebab.classList.add('kebab');
            kebab.setAttribute('aria-label', 'Branch actions');
            kebab.addEventListener('click', (e) => {
                e.stopPropagation();
                contextBranch = branch;
                menu.hidden = false;
                const rect = kebab.getBoundingClientRect();
                menu.position(rect.right - menu.innerElement.clientWidth, rect.bottom);
            });
            actions.appendChild(kebab);
        }

        row.addEventListener('click', () => {
            hidePanel();
            button.emit('view', branch);
        });

        return row;
    };

    const render = () => {
        list.dom.innerHTML = '';

        const all = Object.values(branches).filter(matchesSearch);
        if (!all.length) {
            setStatus(loading ? 'Loading…' : 'No branches found');
            return;
        }

        const favs = projectUserSettings.get('favoriteBranches') || [];
        const favBranches = all.filter((b: any) => favs.includes(b.id) || isCurrent(b));
        const rest = all.filter((b: any) => !favBranches.includes(b));

        const addGroup = (title: string, items: any[]) => {
            if (!items.length) {
                return;
            }
            const head = document.createElement('div');
            head.classList.add('vc-group');
            head.textContent = title;
            list.dom.appendChild(head);
            items.forEach(b => list.dom.appendChild(createRow(b)));
        };

        addGroup('Favorites', favBranches);
        addGroup(filterSelect.value === 'closed' ? 'Closed branches' : 'All branches', rest);

        if (loading) {
            setStatus('Loading…');
        }
    };

    const load = (reset: boolean) => {
        if (loading) {
            return;
        }
        loading = true;
        if (reset) {
            skip = null;
            branches = {};
        }
        render();

        handleCallback(editor.api.globals.rest.projects.projectBranches({
            limit: PAGE_SIZE,
            skip: skip,
            closed: filterSelect.value === 'closed',
            favorite: filterSelect.value === 'favorite'
        }), (err, data) => {
            loading = false;
            if (err) {
                log.error(err);
                render();
                return;
            }
            // current branch always present at the top
            if (!skip && filterSelect.value !== 'closed') {
                branches[config.self.branch.id] = config.self.branch;
            }
            data.result.forEach((b: any) => {
                branches[b.id] = b;
            });
            hasMore = data.pagination.hasMore;
            if (data.result.length) {
                skip = data.result[data.result.length - 1].id;
            }
            render();
        });
    };

    // infinite scroll
    list.dom.addEventListener('scroll', () => {
        if (hasMore && !loading && list.dom.scrollTop + list.dom.clientHeight >= list.dom.scrollHeight - 60) {
            load(false);
        }
    });

    searchInput.on('change', (value: string) => {
        search = value.trim();
        render();
    });

    filterSelect.on('change', () => load(true));

    const positionPanel = () => {
        const rect = button.dom.getBoundingClientRect();
        panel.style.left = `${rect.left}px`;
        panel.style.top = `${rect.bottom + 4}px`;
    };

    const hidePanel = () => {
        panel.hidden = true;
        button.class.remove('active');
        document.removeEventListener('mousedown', onOutside, true);
    };

    const onOutside = (e: MouseEvent) => {
        if (!panel.dom.contains(e.target as Node) && !button.dom.contains(e.target as Node) && menu.hidden) {
            hidePanel();
        }
    };

    button.dom.addEventListener('click', () => {
        if (!panel.hidden) {
            hidePanel();
            return;
        }
        positionPanel();
        panel.hidden = false;
        button.class.add('active');
        searchInput.value = '';
        search = '';
        load(true);
        document.addEventListener('mousedown', onOutside, true);
        setTimeout(() => searchInput.focus());
    });

    LegacyTooltip.attach({
        target: button.dom,
        text: 'Switch or manage branches',
        align: 'top',
        root: editor.call('layout.root')
    });

    // public surface used by the shell
    Object.assign(button, {
        refresh: () => {
            if (!panel.hidden) {
                load(true);
            }
            nameEl.textContent = config.self.branch.name;
        },
        closePanel: hidePanel,
        getBranch: (id: string) => branches[id],
        removeBranch: (id: string) => {
            delete branches[id];
            render();
        }
    });

    return button as Container & {
        refresh: () => void;
        closePanel: () => void;
        getBranch: (id: string) => any;
        removeBranch: (id: string) => void;
    };
};
```

- [ ] **Step 2: Verify lint + types**

```bash
npx eslint src/editor/pickers/version-control/branch-switcher.ts
npm run type:check 2>&1 | grep "branch-switcher" || echo "clean"
```

Expected: clean both.

- [ ] **Step 3: Commit**

```bash
git add src/editor/pickers/version-control/branch-switcher.ts
git commit -m "feat: add branch switcher dropdown for version control picker"
```

---

### Task 5: History panel

**Files:**
- Create: `src/editor/pickers/version-control/panel-history.ts`

Emits: `'select' (checkpoint | null)`, `'compare:change' (slots: {branch, checkpoint|null}[])`. Exposes `setBranch(branch)`, `reload()`, `prependCheckpoint(checkpoint)`, `setCompareMode(on)`, `clearCompare()`, `checkpoints` (current array), `branch`.

- [ ] **Step 1: Write the module**

```ts
import { Container } from '@playcanvas/pcui';

import { handleCallback } from '@/common/utils';
import { config } from '@/editor/config';

import { formatDayGroup, formatRelativeDate } from './vc-helpers';

const PAGE_SIZE = 50;
const MAX_COMPARE = 2;

export const createHistoryPanel = () => {
    const panel = new Container({ class: 'vc-history' });

    let branch: any = null;
    let checkpoints: any[] = null;
    let skip: string = null;
    let hasMore = false;
    let loading = false;
    let selectedId: string = null;
    let compareMode = false;
    let compareSlots: { branch: any; checkpoint: any | null }[] = [];
    let request: any = null;
    const cache: Record<string, { result: any[]; hasMore: boolean }> = {};

    const isSlotted = (checkpoint: any | null) => {
        return compareSlots.some(s => (s.checkpoint ? s.checkpoint.id === checkpoint?.id : !checkpoint && s.branch.id === branch.id));
    };

    const toggleSlot = (checkpoint: any | null) => {
        if (isSlotted(checkpoint)) {
            compareSlots = compareSlots.filter(s => !(s.checkpoint ? s.checkpoint.id === checkpoint?.id : !checkpoint && s.branch.id === branch.id));
        } else if (compareSlots.length < MAX_COMPARE) {
            compareSlots.push({ branch, checkpoint });
        }
        render();
        panel.emit('compare:change', compareSlots.slice());
    };

    const setStatus = (text: string) => {
        const el = document.createElement('div');
        el.classList.add('vc-list-status');
        el.textContent = text;
        panel.dom.appendChild(el);
    };

    const skeleton = () => {
        const wrap = document.createElement('div');
        wrap.classList.add('vc-skeleton');
        for (let i = 0; i < 3; i++) {
            const row = document.createElement('div');
            row.classList.add('skeleton-row');
            row.innerHTML = '<span class="bone dot"></span><span class="bone line"></span>';
            wrap.appendChild(row);
        }
        panel.dom.appendChild(wrap);
    };

    const createRow = (checkpoint: any | null, label?: string) => {
        const row = document.createElement('div');
        row.classList.add('vc-row');
        if (checkpoint) {
            row.id = `checkpoint-${checkpoint.id}`;
        }

        if (compareMode) {
            const check = document.createElement('input');
            check.type = 'checkbox';
            check.classList.add('check');
            check.checked = isSlotted(checkpoint);
            if (!check.checked && compareSlots.length >= MAX_COMPARE) {
                row.classList.add('disabled');
            }
            row.appendChild(check);
        } else {
            const avatar = document.createElement('img');
            avatar.classList.add('avatar');
            avatar.alt = '';
            avatar.src = checkpoint ? `/api/users/${checkpoint.user.id}/thumbnail?size=28` : `${config.url.static}/platform/images/common/blank_project.png`;
            row.appendChild(avatar);
        }

        const body = document.createElement('div');
        body.classList.add('body');
        const desc = document.createElement('div');
        desc.classList.add('desc');
        desc.textContent = label ?? (checkpoint.description.split('\n')[0]);
        body.appendChild(desc);
        const sub = document.createElement('div');
        sub.classList.add('sub');
        sub.textContent = checkpoint ?
            `${checkpoint.user.fullName || 'Unknown'} · ${formatRelativeDate(checkpoint.createdAt)}` :
            'uncheckpointed changes';
        body.appendChild(sub);
        row.appendChild(body);

        if (checkpoint && checkpoint.id === selectedId && !compareMode) {
            row.classList.add('selected');
        }

        row.addEventListener('click', () => {
            if (compareMode) {
                toggleSlot(checkpoint);
            } else if (checkpoint) {
                selectedId = checkpoint.id;
                render();
                panel.emit('select', checkpoint);
            }
        });

        return row;
    };

    const render = () => {
        const scrollTop = panel.dom.scrollTop;
        panel.dom.innerHTML = '';

        if (loading && !checkpoints) {
            skeleton();
            return;
        }
        if (!checkpoints) {
            return;
        }
        if (!checkpoints.length) {
            setStatus('No checkpoints yet');
            return;
        }

        // working-state row, compare mode + current open branch only
        if (compareMode && branch && !branch.closed && branch.id === config.self.branch.id) {
            const head = document.createElement('div');
            head.classList.add('vc-day');
            head.textContent = 'Current state';
            panel.dom.appendChild(head);
            panel.dom.appendChild(createRow(null, `Working state of ${branch.name}`));
        }

        let lastDay: string = null;
        for (const c of checkpoints) {
            const day = formatDayGroup(c.createdAt);
            if (day !== lastDay) {
                lastDay = day;
                const head = document.createElement('div');
                head.classList.add('vc-day');
                head.textContent = day;
                panel.dom.appendChild(head);
            }
            panel.dom.appendChild(createRow(c));
        }

        if (loading) {
            setStatus('Loading…');
        }
        panel.dom.scrollTop = scrollTop;
    };

    const load = (more: boolean) => {
        if (loading || !branch) {
            return;
        }
        loading = true;
        render();

        const req = handleCallback(editor.api.globals.rest.branches.branchCheckpoints({
            branchId: branch.id,
            limit: PAGE_SIZE,
            skip: more ? skip : undefined
        }), (err, data) => {
            if (req !== request) {
                return;
            }
            request = null;
            loading = false;
            if (err) {
                log.error(err);
                render();
                return;
            }
            checkpoints = more && checkpoints ? checkpoints.concat(data.result) : data.result;
            hasMore = data.pagination.hasMore;
            skip = checkpoints.length ? checkpoints[checkpoints.length - 1].id : null;
            cache[branch.id] = { result: checkpoints, hasMore };
            render();
        });
        request = req;
    };

    panel.dom.addEventListener('scroll', () => {
        if (hasMore && !loading && panel.dom.scrollTop + panel.dom.clientHeight >= panel.dom.scrollHeight - 80) {
            load(true);
        }
    });

    Object.assign(panel, {
        setBranch: (b: any) => {
            branch = b;
            request = null;
            selectedId = null;
            panel.emit('select', null);
            if (b && cache[b.id]) {
                checkpoints = cache[b.id].result;
                hasMore = cache[b.id].hasMore;
                skip = checkpoints.length ? checkpoints[checkpoints.length - 1].id : null;
                render();
                load(false); // refresh in background
            } else {
                checkpoints = null;
                load(false);
            }
        },
        reload: () => load(false),
        prependCheckpoint: (c: any) => {
            if (!checkpoints) {
                return;
            }
            checkpoints.unshift(c);
            render();
            panel.dom.scrollTop = 0;
        },
        setCompareMode: (on: boolean) => {
            compareMode = on;
            compareSlots = [];
            render();
            panel.emit('compare:change', []);
        },
        clearCompare: () => {
            compareSlots = [];
            render();
            panel.emit('compare:change', []);
        },
        get checkpoints() {
            return checkpoints;
        },
        get branch() {
            return branch;
        }
    });

    return panel as Container & {
        setBranch: (b: any) => void;
        reload: () => void;
        prependCheckpoint: (c: any) => void;
        setCompareMode: (on: boolean) => void;
        clearCompare: () => void;
        checkpoints: any[];
        branch: any;
    };
};
```

- [ ] **Step 2: Verify lint + types, commit**

```bash
npx eslint src/editor/pickers/version-control/panel-history.ts
npm run type:check 2>&1 | grep "panel-history" || echo "clean"
git add src/editor/pickers/version-control/panel-history.ts
git commit -m "feat: add history panel for version control picker"
```

---

### Task 6: Detail panel

**Files:**
- Create: `src/editor/pickers/version-control/panel-detail.ts`

Emits: `'restore' (checkpoint)`, `'newBranch' (checkpoint)`, `'comparePrevious' (checkpoint, previous)`, `'hardReset' (checkpoint)`, `'openDiff' (checkpoint, previous)`. Exposes `render(checkpoint, previous, ctx)` and `clear()`.

- [ ] **Step 1: Write the module**

```ts
import { Container } from '@playcanvas/pcui';

import { diffCreate } from '../../messenger/jobs';

import { summarizeDiff } from './vc-helpers';

export const createDetailPanel = () => {
    const panel = new Container({ class: 'vc-detail' });

    const diffCache: Record<string, ReturnType<typeof summarizeDiff>> = {};
    let renderToken = 0;

    const clear = () => {
        renderToken++;
        panel.dom.innerHTML = '';
        const empty = document.createElement('div');
        empty.classList.add('vc-empty-detail');
        empty.textContent = 'Select a checkpoint to see its details';
        panel.dom.appendChild(empty);
    };

    const button = (label: string, cls: string, onClick: () => void) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.classList.add('vc-button');
        if (cls) {
            b.classList.add(cls);
        }
        b.textContent = label;
        b.addEventListener('click', onClick);
        return b;
    };

    const renderChangesCard = (checkpoint: any, previous: any, branchId: string, token: number) => {
        const card = document.createElement('div');
        card.classList.add('vc-card');
        card.innerHTML = '<h3>Changes in this checkpoint</h3>';

        const meta = document.createElement('div');
        meta.classList.add('vc-meta');
        card.appendChild(meta);

        if (!previous) {
            meta.textContent = 'This is the oldest loaded checkpoint — scroll the history to load older ones for a comparison baseline.';
            return card;
        }
        meta.textContent = `vs previous checkpoint ${previous.id.substring(0, 7)}`;

        const body = document.createElement('div');
        card.appendChild(body);

        const key = `${previous.id}:${checkpoint.id}`;
        const fill = (summary: ReturnType<typeof summarizeDiff>) => {
            body.innerHTML = '';
            if (!summary.total) {
                const none = document.createElement('div');
                none.classList.add('vc-meta');
                none.textContent = 'No changes';
                body.appendChild(none);
            } else {
                for (const g of summary.groups) {
                    const pill = document.createElement('span');
                    pill.classList.add('vc-pill');
                    pill.textContent = `${g.items.length} ${g.type}${g.items.length === 1 ? '' : 's'}`;
                    body.appendChild(pill);
                }
            }
            const open = document.createElement('div');
            open.style.marginTop = '10px';
            const link = document.createElement('button');
            link.type = 'button';
            link.classList.add('vc-link');
            link.textContent = 'Open full diff →';
            link.addEventListener('click', () => panel.emit('openDiff', checkpoint, previous));
            open.appendChild(link);
            body.appendChild(open);
        };

        if (diffCache[key]) {
            fill(diffCache[key]);
        } else {
            body.innerHTML = '<div class="vc-meta">Computing changes…</div>';
            diffCreate({
                srcBranchId: branchId,
                srcCheckpointId: checkpoint.id,
                dstBranchId: branchId,
                dstCheckpointId: previous.id
            }).then((diff: any) => {
                if (token !== renderToken) {
                    return;
                }
                diffCache[key] = summarizeDiff(diff ?? {});
                fill(diffCache[key]);
            }).catch(() => {
                if (token !== renderToken) {
                    return;
                }
                body.innerHTML = '<div class="vc-meta">Failed to compute changes</div>';
            });
        }

        return card;
    };

    Object.assign(panel, {
        clear,
        render: (checkpoint: any, previous: any, ctx: { branchId: string; isCurrentBranch: boolean; canWrite: boolean }) => {
            const token = ++renderToken;
            panel.dom.innerHTML = '';

            const hero = document.createElement('div');
            hero.classList.add('vc-card');

            const heroInner = document.createElement('div');
            heroInner.classList.add('vc-detail-hero');
            hero.appendChild(heroInner);

            const avatar = document.createElement('img');
            avatar.classList.add('avatar');
            avatar.alt = '';
            avatar.src = `/api/users/${checkpoint.user.id}/thumbnail?size=40`;
            heroInner.appendChild(avatar);

            const body = document.createElement('div');
            body.classList.add('body');
            heroInner.appendChild(body);

            const title = document.createElement('div');
            title.classList.add('title');
            title.textContent = checkpoint.description;
            body.appendChild(title);

            const meta = document.createElement('div');
            meta.classList.add('vc-meta');
            const created = new Date(checkpoint.createdAt);
            meta.textContent = `${checkpoint.user.fullName || 'Unknown'} · ${created.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })} · ${checkpoint.id.substring(0, 7)}`;
            const copy = document.createElement('button');
            copy.type = 'button';
            copy.classList.add('copy-id');
            copy.textContent = 'copy id';
            copy.addEventListener('click', () => {
                navigator.clipboard?.writeText(checkpoint.id);
                copy.textContent = 'copied';
                setTimeout(() => {
                    copy.textContent = 'copy id';
                }, 1200);
            });
            meta.appendChild(copy);
            body.appendChild(meta);

            const actions = document.createElement('div');
            actions.classList.add('vc-detail-actions');
            hero.appendChild(actions);

            if (ctx.isCurrentBranch && ctx.canWrite) {
                actions.appendChild(button('Restore', null, () => panel.emit('restore', checkpoint)));
            }
            if (ctx.canWrite) {
                actions.appendChild(button('New Branch', null, () => panel.emit('newBranch', checkpoint)));
            }
            if (previous) {
                actions.appendChild(button('Compare with previous', null, () => panel.emit('comparePrevious', checkpoint, previous)));
            }
            if (ctx.isCurrentBranch && ctx.canWrite) {
                actions.appendChild(button('Hard Reset…', 'danger', () => panel.emit('hardReset', checkpoint)));
            }

            panel.dom.appendChild(hero);
            panel.dom.appendChild(renderChangesCard(checkpoint, previous, ctx.branchId, token));
        }
    });

    clear();

    return panel as Container & {
        clear: () => void;
        render: (checkpoint: any, previous: any, ctx: { branchId: string; isCurrentBranch: boolean; canWrite: boolean }) => void;
    };
};
```

- [ ] **Step 2: Verify lint + types, commit**

```bash
npx eslint src/editor/pickers/version-control/panel-detail.ts
npm run type:check 2>&1 | grep "panel-detail" || echo "clean"
git add src/editor/pickers/version-control/panel-detail.ts
git commit -m "feat: add checkpoint detail panel for version control picker"
```

---

### Task 7: Changes panel

**Files:**
- Create: `src/editor/pickers/version-control/panel-changes.ts`

Returns `{ sidebar, summary }` containers. Sidebar emits: `'create' (description)`. Summary emits: `'openDiff'`. Both share `refresh(force)`, `setBusy(on)`, `resetForm()`, `focusForm()`, `count` getter, and emit `'count' (n)` on the sidebar after each diff.

- [ ] **Step 1: Write the module**

```ts
import { Container, TextAreaInput } from '@playcanvas/pcui';

import { config } from '@/editor/config';

import { diffCreate } from '../../messenger/jobs';

import { formatRelativeDate, summarizeDiff, type DiffSummary } from './vc-helpers';

export const createChangesPanel = () => {
    const sidebar = new Container({ class: 'vc-changes' });
    const summary = new Container({ class: 'vc-changes-summary' });

    let current: DiffSummary = null;
    let loading = false;
    let stale = true;

    const list = document.createElement('div');
    list.classList.add('vc-changes-list');
    sidebar.dom.appendChild(list);

    const form = document.createElement('div');
    form.classList.add('vc-checkpoint-form');
    sidebar.dom.appendChild(form);

    const description = new TextAreaInput({ blurOnEnter: false, keyChange: true, renderChanges: false, placeholder: 'Describe this checkpoint…' });
    form.appendChild(description.dom);

    const create = document.createElement('button');
    create.type = 'button';
    create.classList.add('vc-create-checkpoint');
    create.textContent = 'Create Checkpoint';
    create.disabled = true;
    form.appendChild(create);

    description.on('change', (v: string) => {
        create.disabled = !v.trim() || !editor.call('permissions:write');
    });
    description.on('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !create.disabled) {
            sidebar.emit('create', description.value.trim());
        }
    });
    create.addEventListener('click', () => {
        sidebar.emit('create', description.value.trim());
    });

    const renderList = () => {
        list.innerHTML = '';
        if (loading) {
            const wrap = document.createElement('div');
            wrap.classList.add('vc-skeleton');
            for (let i = 0; i < 3; i++) {
                const row = document.createElement('div');
                row.classList.add('skeleton-row');
                row.innerHTML = '<span class="bone line"></span>';
                wrap.appendChild(row);
            }
            list.appendChild(wrap);
            return;
        }
        if (!current || !current.total) {
            const status = document.createElement('div');
            status.classList.add('vc-list-status');
            status.textContent = current ? 'No changes since your last checkpoint' : 'Changes not computed yet';
            list.appendChild(status);
            return;
        }
        for (const g of current.groups) {
            const head = document.createElement('div');
            head.classList.add('vc-group');
            head.textContent = `${g.type}s · ${g.items.length}`;
            list.appendChild(head);
            for (const item of g.items) {
                const row = document.createElement('div');
                row.classList.add('vc-item');
                const name = document.createElement('span');
                name.classList.add('name');
                name.textContent = item.name;
                name.title = item.name;
                row.appendChild(name);
                const status = document.createElement('span');
                status.classList.add('status', item.status);
                status.textContent = item.status;
                row.appendChild(status);
                list.appendChild(row);
            }
        }
    };

    const renderSummary = () => {
        summary.dom.innerHTML = '';
        const card = document.createElement('div');
        card.classList.add('vc-card');
        const branch = config.self.branch;

        const h = document.createElement('h3');
        h.textContent = loading ? 'Computing changes…' :
            current ? `${current.total} change${current.total === 1 ? '' : 's'} since your last checkpoint` : 'Changes';
        card.appendChild(h);

        const meta = document.createElement('div');
        meta.classList.add('vc-meta');
        meta.textContent = `Working state of ${branch.name}${branch.latestCheckpointId ? ` vs checkpoint ${branch.latestCheckpointId.substring(0, 7)}` : ''}`;
        card.appendChild(meta);

        if (current) {
            for (const g of current.groups) {
                const pill = document.createElement('span');
                pill.classList.add('vc-pill');
                pill.textContent = `${g.items.length} ${g.type}${g.items.length === 1 ? '' : 's'}`;
                card.appendChild(pill);
            }
        }

        const actions = document.createElement('div');
        actions.classList.add('vc-detail-actions');
        card.appendChild(actions);

        const refreshBtn = document.createElement('button');
        refreshBtn.type = 'button';
        refreshBtn.classList.add('vc-button');
        refreshBtn.textContent = '↻ Refresh';
        refreshBtn.disabled = loading;
        refreshBtn.addEventListener('click', () => refresh(true));
        actions.appendChild(refreshBtn);

        if (current && current.total) {
            const openBtn = document.createElement('button');
            openBtn.type = 'button';
            openBtn.classList.add('vc-button');
            openBtn.textContent = 'Open Full Diff';
            openBtn.addEventListener('click', () => summary.emit('openDiff'));
            actions.appendChild(openBtn);
        }

        if (branch.latestCheckpointId) {
            const sub = document.createElement('div');
            sub.classList.add('vc-meta');
            sub.style.marginTop = '8px';
            sub.textContent = 'Tip: ⌘/Ctrl+Enter in the description field creates the checkpoint.';
            card.appendChild(sub);
        }

        summary.dom.appendChild(card);
    };

    const render = () => {
        renderList();
        renderSummary();
    };

    function refresh(force?: boolean) {
        const branch = config.self.branch;
        if (loading || (!stale && !force)) {
            render();
            return;
        }
        // no checkpoint to diff against yet
        if (!branch.latestCheckpointId) {
            current = { total: 0, groups: [] };
            stale = false;
            render();
            sidebar.emit('count', 0);
            return;
        }
        loading = true;
        render();
        diffCreate({
            srcBranchId: branch.id,
            srcCheckpointId: null,
            dstBranchId: branch.id,
            dstCheckpointId: branch.latestCheckpointId
        }).then((diff: any) => {
            loading = false;
            stale = false;
            current = summarizeDiff(diff ?? {});
            render();
            sidebar.emit('count', current.total);
        }).catch((err) => {
            loading = false;
            log.error(err);
            current = null;
            render();
        });
    }

    Object.assign(sidebar, {
        refresh,
        invalidate: () => {
            stale = true;
            current = null;
        },
        resetForm: () => {
            description.value = '';
            create.disabled = true;
            create.classList.remove('busy');
            create.textContent = 'Create Checkpoint';
        },
        setBusy: (on: boolean) => {
            create.classList.toggle('busy', on);
            create.textContent = on ? 'Creating…' : 'Create Checkpoint';
        },
        focusForm: () => {
            setTimeout(() => description.focus());
        },
        get count() {
            return current ? current.total : null;
        }
    });

    return {
        sidebar: sidebar as Container & {
            refresh: (force?: boolean) => void;
            invalidate: () => void;
            resetForm: () => void;
            setBusy: (on: boolean) => void;
            focusForm: () => void;
            count: number | null;
        },
        summary
    };
};
```

- [ ] **Step 2: Verify lint + types, commit**

```bash
npx eslint src/editor/pickers/version-control/panel-changes.ts
npm run type:check 2>&1 | grep "panel-changes" || echo "clean"
git add src/editor/pickers/version-control/panel-changes.ts
git commit -m "feat: add changes panel with pinned checkpoint form"
```

---

### Task 8: Shell rewrite

**Files:**
- Rewrite: `src/editor/pickers/version-control/picker-version-control.ts` (full replacement)

The shell must preserve from the old file: registration via `picker:project:registerMenu`, permission-based menu toggling, `picker:versioncontrol` + `picker:versioncontrol:transformCheckpointData` methods, the ctrl+s hotkey, viewport hover suppression, the merge flow with `messenger:merge.new` handoff to the conflict manager, the `vcgraph:*` host methods (moved from the deleted checkpoints file), and the `messenger:*` list-maintenance handlers.

- [ ] **Step 1: Write the new shell**

```ts
import { Button, Container } from '@playcanvas/pcui';

import { handleCallback } from '@/common/utils';
import { config } from '@/editor/config';

import { checkpointCreate as checkpointCreateJob, diffCreate } from '../../messenger/jobs';

import { createBranchSwitcher } from './branch-switcher';
import { showVcDialog } from './dialogs';
import { createChangesPanel } from './panel-changes';
import { createDetailPanel } from './panel-detail';
import { createHistoryPanel } from './panel-history';

editor.once('load', () => {
    if (config.project.settings.useLegacyScripts) {
        return;
    }

    const events: { unbind: () => void }[] = [];
    const projectUserSettings = editor.call('settings:projectUser');

    let viewedBranch: any = config.self.branch;
    let compareMode = false;
    let compareSlots: { branch: any; checkpoint: any | null }[] = [];
    let showNewCheckpointOnLoad = false;

    // ---- layout ----
    const panel = new Container({ class: ['picker-version-control', 'picker-vc'], flex: true });
    editor.call('picker:project:registerMenu', 'version control', 'Version Control', panel);

    if (!editor.call('permissions:read')) {
        editor.call('picker:project:toggleMenu', 'version control', false);
    }
    editor.on('permissions:set', () => {
        editor.call('picker:project:toggleMenu', 'version control', editor.call('permissions:read'));
    });

    // top bar
    const topBar = new Container({ class: 'vc-top-bar' });
    panel.append(topBar);

    const switcher = createBranchSwitcher();
    topBar.append(switcher);

    const topActions = new Container({ class: 'vc-top-actions' });
    topBar.append(topActions);

    const btnGraph = new Button({ text: 'Graph', icon: 'E399' });
    topActions.append(btnGraph);

    const btnCompare = new Button({ text: 'Compare', icon: 'E236' });
    topActions.append(btnCompare);

    const btnCheckpoint = new Button({ text: 'Checkpoint', icon: 'E120', class: 'vc-primary' });
    topActions.append(btnCheckpoint);

    // body
    const body = new Container({ class: 'vc-body' });
    panel.append(body);

    const sidebar = new Container({ class: 'vc-sidebar' });
    body.append(sidebar);

    // viewing-other-branch banner
    const banner = document.createElement('div');
    banner.classList.add('vc-view-banner');
    banner.hidden = true;
    banner.innerHTML = 'Viewing <span class="name"></span>';
    const bannerReturn = document.createElement('button');
    bannerReturn.type = 'button';
    bannerReturn.classList.add('return');
    banner.appendChild(bannerReturn);
    sidebar.dom.appendChild(banner);

    // tabs
    const tabs = document.createElement('div');
    tabs.classList.add('vc-tabs');
    sidebar.dom.appendChild(tabs);

    const tabChanges = document.createElement('button');
    tabChanges.type = 'button';
    tabChanges.classList.add('vc-tab');
    tabChanges.textContent = 'Changes';
    tabs.appendChild(tabChanges);

    const tabHistory = document.createElement('button');
    tabHistory.type = 'button';
    tabHistory.classList.add('vc-tab', 'active');
    tabHistory.textContent = 'History';
    tabs.appendChild(tabHistory);

    const tabContent = new Container({ class: 'vc-tab-content' });
    sidebar.append(tabContent);

    const main = new Container({ class: 'vc-main' });
    body.append(main);

    // panels
    const changes = createChangesPanel();
    const history = createHistoryPanel();
    const detail = createDetailPanel();

    tabContent.append(changes.sidebar);
    tabContent.append(history);
    main.append(changes.summary);
    main.append(detail);

    // compare bar
    const compareBar = new Container({ class: 'vc-compare-bar', hidden: true });
    panel.append(compareBar);
    const slotA = document.createElement('span');
    slotA.classList.add('slot');
    compareBar.dom.appendChild(slotA);
    const arrow = document.createElement('span');
    arrow.textContent = '⇆';
    compareBar.dom.appendChild(arrow);
    const slotB = document.createElement('span');
    slotB.classList.add('slot');
    compareBar.dom.appendChild(slotB);
    const btnRunCompare = new Button({ text: 'Compare', class: 'vc-primary' });
    compareBar.append(btnRunCompare);

    // progress widgets (kept infra)
    const makeProgress = (progressText: string, finishText: string, errorText: string) => {
        const w = editor.call('picker:versioncontrol:createProgressWidget', { progressText, finishText, errorText });
        w.hidden = true;
        main.append(w);
        return w;
    };
    const progressCheckpoint = makeProgress('Creating checkpoint', 'Checkpoint created', 'Failed to create new checkpoint');
    const progressDiff = makeProgress('Getting changes', 'Showing changes', 'Failed to get changes');
    const progressBranch = makeProgress('Creating branch', 'Branch created - refreshing the browser', 'Failed to create new branch');
    const progressClose = makeProgress('Closing branch', 'Branch closed', 'Failed to close branch');
    const progressOpen = makeProgress('Opening branch', 'Branch opened', 'Failed to open branch');
    const progressDelete = makeProgress('Deleting branch', 'Branch deleted', 'Failed to delete branch');
    const progressMerge = makeProgress('Attempting to auto merge branches', 'Merge ready - Opening Merge Review', 'Unable to auto merge');
    const progressRestore = makeProgress('Restoring checkpoint', 'Checkpoint restored - refreshing the browser', 'Failed to restore checkpoint');
    const progressHardReset = makeProgress('Performing hard reset to checkpoint', 'Finished - refreshing the browser', 'Failed to hard reset to checkpoint');
    const progressSwitch = makeProgress('Switching branch', 'Switched branch - refreshing the browser', 'Failed to switch branch');

    const showProgress = (w: any | null) => {
        [progressCheckpoint, progressDiff, progressBranch, progressClose, progressOpen, progressDelete,
            progressMerge, progressRestore, progressHardReset, progressSwitch].forEach((p) => {
            p.hidden = p !== w;
        });
        const op = !!w;
        changes.summary.hidden = op || activeTab !== 'changes';
        detail.hidden = op || activeTab !== 'history';
    };

    const togglePanels = (enabled: boolean) => {
        editor.call('picker:project:setClosable', enabled && config.scene.id);
        editor.call('picker:project:toggleLeftPanel', enabled);
        topBar.enabled = enabled;
        sidebar.enabled = enabled;
    };

    // ---- tab switching ----
    let activeTab: 'changes' | 'history' = 'history';

    const isViewingCurrent = () => viewedBranch.id === config.self.branch.id;

    const setTab = (tab: 'changes' | 'history') => {
        activeTab = tab;
        tabChanges.classList.toggle('active', tab === 'changes');
        tabHistory.classList.toggle('active', tab === 'history');
        changes.sidebar.hidden = tab !== 'changes';
        changes.summary.hidden = tab !== 'changes';
        history.hidden = tab !== 'history';
        detail.hidden = tab !== 'history';
        if (tab === 'changes') {
            changes.sidebar.refresh();
        }
    };

    const updateTabsState = () => {
        const canChanges = isViewingCurrent() && !compareMode;
        tabChanges.disabled = !canChanges;
        const count = changes.sidebar.count;
        tabChanges.textContent = count === null ? 'Changes' : `Changes · ${count}`;
        if (!canChanges && activeTab === 'changes') {
            setTab('history');
        }
    };

    changes.sidebar.on('count', updateTabsState);
    tabChanges.addEventListener('click', () => !tabChanges.disabled && setTab('changes'));
    tabHistory.addEventListener('click', () => setTab('history'));

    // ---- viewed branch ----
    const setViewedBranch = (branch: any) => {
        viewedBranch = branch;
        banner.hidden = isViewingCurrent();
        (banner.querySelector('.name') as HTMLElement).textContent = branch.name;
        bannerReturn.textContent = `Return to ${config.self.branch.name}`;
        history.setBranch(branch);
        detail.clear();
        updateTabsState();
        setTab('history');
    };

    bannerReturn.addEventListener('click', () => setViewedBranch(config.self.branch));
    switcher.on('view', (branch: any) => setViewedBranch(branch));

    // ---- history selection -> detail ----
    history.on('select', (checkpoint: any) => {
        if (!checkpoint) {
            detail.clear();
            return;
        }
        const all = history.checkpoints || [];
        const index = all.findIndex((c: any) => c.id === checkpoint.id);
        const previous = index >= 0 && index < all.length - 1 ? all[index + 1] : null;
        detail.render(checkpoint, previous, {
            branchId: viewedBranch.id,
            isCurrentBranch: isViewingCurrent(),
            canWrite: editor.call('permissions:write')
        });
    });

    // ---- diff viewing ----
    const viewDiff = (srcBranchId: string, srcCheckpointId: string | null, dstBranchId: string, dstCheckpointId: string | null) => {
        togglePanels(false);
        showProgress(progressDiff);
        diffCreate({ srcBranchId, srcCheckpointId, dstBranchId, dstCheckpointId }).then((diff: any) => {
            progressDiff.finish();
            togglePanels(true);
            if (diff && diff.numConflicts !== 0) {
                editor.call('picker:project:close');
                editor.call('picker:versioncontrol:mergeOverlay:hide');
                editor.call('picker:diffManager', diff);
            } else {
                progressDiff.setMessage('There are no changes');
                setTimeout(() => {
                    editor.call('vcgraph:moveToForeground');
                    showProgress(null);
                }, 1500);
            }
        }).catch((err) => {
            progressDiff.finish(err instanceof Error ? err.message : `${err}`);
            togglePanels(true);
        });
    };

    detail.on('openDiff', (checkpoint: any, previous: any) => {
        viewDiff(viewedBranch.id, checkpoint.id, viewedBranch.id, previous.id);
    });
    detail.on('comparePrevious', (checkpoint: any, previous: any) => {
        viewDiff(viewedBranch.id, checkpoint.id, viewedBranch.id, previous.id);
    });
    changes.summary.on('openDiff', () => {
        const b = config.self.branch;
        viewDiff(b.id, null, b.id, b.latestCheckpointId);
    });

    // ---- compare mode ----
    const slotLabel = (slot: { branch: any; checkpoint: any | null }) => {
        return slot.checkpoint ?
            `${slot.checkpoint.id.substring(0, 7)} · ${slot.branch.name}` :
            `Working state · ${slot.branch.name}`;
    };

    const renderCompareBar = () => {
        slotA.textContent = compareSlots[0] ? slotLabel(compareSlots[0]) : 'Pick a checkpoint…';
        slotA.classList.toggle('full', !!compareSlots[0]);
        slotB.textContent = compareSlots[1] ? slotLabel(compareSlots[1]) : 'Pick another…';
        slotB.classList.toggle('full', !!compareSlots[1]);
        btnRunCompare.enabled = compareSlots.length === 2;
    };

    const setCompareMode = (on: boolean) => {
        compareMode = on;
        compareSlots = [];
        if (on) {
            btnCompare.class.add('vc-compare-active');
        } else {
            btnCompare.class.remove('vc-compare-active');
        }
        btnCompare.text = on ? 'Exit Compare' : 'Compare';
        compareBar.hidden = !on;
        history.setCompareMode(on);
        updateTabsState();
        if (on) {
            setTab('history');
            renderCompareBar();
        }
    };

    btnCompare.on('click', () => setCompareMode(!compareMode));

    history.on('compare:change', (slots: { branch: any; checkpoint: any | null }[]) => {
        compareSlots = slots;
        renderCompareBar();
    });

    btnRunCompare.on('click', () => {
        if (compareSlots.length !== 2) {
            return;
        }
        const [a, b] = compareSlots;
        setCompareMode(false);
        viewDiff(a.branch.id, a.checkpoint ? a.checkpoint.id : null, b.branch.id, b.checkpoint ? b.checkpoint.id : null);
    });

    // ---- checkpoint creation ----
    const createCheckpoint = (branchId: string, description: string, callback: (checkpoint?: any) => void, useOverlay = true) => {
        if (useOverlay) {
            togglePanels(false);
            showProgress(progressCheckpoint);
        }
        checkpointCreateJob({ projectId: config.project.id, branchId, description }).then((checkpoint) => {
            if (useOverlay) {
                progressCheckpoint.finish(null);
            }
            callback(checkpoint);
        }).catch((err) => {
            if (useOverlay) {
                progressCheckpoint.finish(err instanceof Error ? err.message : `${err}`);
            }
            togglePanels(true);
        });
    };

    // inline (no overlay) checkpoint creation from the pinned form;
    // the new row lands in history via messenger:checkpoint.createEnded
    changes.sidebar.on('create', (description: string) => {
        changes.sidebar.setBusy(true);
        checkpointCreateJob({ projectId: config.project.id, branchId: config.self.branch.id, description }).then(() => {
            changes.sidebar.resetForm();
            changes.sidebar.invalidate();
            changes.sidebar.refresh(true);
        }).catch((err) => {
            changes.sidebar.setBusy(false);
            log.error(err);
        });
    });

    btnCheckpoint.on('click', () => {
        setViewedBranch(config.self.branch);
        setTab('changes');
        changes.sidebar.focusForm();
    });

    // ---- branch operations ----
    switcher.on('switch', (branch: any) => {
        togglePanels(false);
        showProgress(progressSwitch);
        handleCallback(editor.api.globals.rest.branches.branchCheckout({ branchId: branch.id }), (err) => {
            progressSwitch.finish(err);
            if (err) {
                togglePanels(true);
            }
            // refresh handled by messenger
        });
    });

    switcher.on('newBranch', () => openNewBranchDialog(null));
    detail.on('newBranch', (checkpoint: any) => openNewBranchDialog(checkpoint));

    function openNewBranchDialog(checkpoint: any | null) {
        const source = checkpoint ? viewedBranch : config.self.branch;
        const fromId = checkpoint ? checkpoint.id : source.latestCheckpointId;
        const dialog = showVcDialog({
            title: 'New branch',
            body: ['From: ', { bold: `${fromId ? fromId.substring(0, 7) : 'latest'}` }, ` · ${checkpoint ? `checkpoint of ${source.name}` : `latest checkpoint of ${source.name}`}`],
            confirmText: 'Create Branch',
            input: { placeholder: 'Branch name' },
            onConfirm: ({ input }) => {
                if (!input) {
                    dialog.setError('Branch name is required');
                    return;
                }
                dialog.close();
                togglePanels(false);
                showProgress(progressBranch);
                handleCallback(editor.api.globals.rest.branches.branchCreate({
                    name: input,
                    projectId: config.project.id,
                    sourceBranchId: source.id,
                    sourceCheckpointId: checkpoint ? checkpoint.id : undefined
                }), (err) => {
                    if (panel.hidden) {
                        return;
                    }
                    // async success handled by messenger:branch.createEnded
                    if (err && !/Request timed out/.test(err)) {
                        progressBranch.finish(err);
                        togglePanels(true);
                    }
                });
            }
        });
    }

    switcher.on('merge', (branch: any) => {
        const dialog = showVcDialog({
            title: `Merge into ${config.self.branch.name}`,
            body: [{ bold: branch.name }, ' → ', { bold: config.self.branch.name }, '. Conflicts open the merge resolution view.'],
            confirmText: 'Merge',
            checkboxes: [
                { key: 'srcCheckpoint', label: `Take a checkpoint of ${branch.name} first`, value: true },
                { key: 'dstCheckpoint', label: `Take a checkpoint of ${config.self.branch.name} first`, value: true },
                { key: 'closeSrc', label: `Close ${branch.name} after merging`, value: false }
            ],
            onConfirm: ({ checks }) => {
                dialog.close();
                runMerge(branch, checks.srcCheckpoint, checks.dstCheckpoint, checks.closeSrc);
            }
        });
    });

    function runMerge(sourceBranch: any, createSrcCheckpoint: boolean, createDstCheckpoint: boolean, closeSrc: boolean) {
        togglePanels(false);

        const merge = () => {
            showProgress(progressMerge);

            let evtOnMergeCreated = editor.on('messenger:merge.new', (data: any) => {
                if (data.dst_branch_id !== config.self.branch.id) {
                    return;
                }
                evtOnMergeCreated.unbind();
                evtOnMergeCreated = null;
                handleCallback(editor.api.globals.rest.merge.mergeGet({ mergeId: data.merge_id }), (err, mergeData) => {
                    config.self.branch.merge = mergeData;
                    editor.call('picker:project:close');
                    editor.call('picker:versioncontrol:mergeOverlay:hide');
                    editor.call('picker:conflictManager');
                });
            });

            handleCallback(editor.api.globals.rest.merge.mergeCreate({
                srcBranchId: sourceBranch.id,
                dstBranchId: config.self.branch.id,
                srcBranchClose: closeSrc
            }), (err) => {
                if (panel.hidden) {
                    return;
                }
                if (err && !/Request timed out/.test(err)) {
                    progressMerge.finish(err);
                    togglePanels(true);
                    if (evtOnMergeCreated) {
                        evtOnMergeCreated.unbind();
                        evtOnMergeCreated = null;
                    }
                }
            });
        };

        const desc = `Checkpoint before merging branch "${sourceBranch.name}" into "${config.self.branch.name}"`;
        if (createSrcCheckpoint) {
            createCheckpoint(sourceBranch.id, desc, () => {
                if (createDstCheckpoint) {
                    createCheckpoint(config.self.branch.id, desc, merge);
                } else {
                    merge();
                }
            });
        } else if (createDstCheckpoint) {
            createCheckpoint(config.self.branch.id, desc, merge);
        } else {
            merge();
        }
    }

    switcher.on('close', (branch: any) => {
        const dialog = showVcDialog({
            title: `Close ${branch.name}?`,
            body: ['Closed branches can be re-opened later from the Closed filter.'],
            confirmText: 'Close Branch',
            checkboxes: [{ key: 'checkpoint', label: 'Take a checkpoint first', value: true }],
            onConfirm: ({ checks }) => {
                dialog.close();
                const close = () => {
                    showProgress(progressClose);
                    handleCallback(editor.api.globals.rest.branches.branchClose({ branchId: branch.id }), (err) => {
                        progressClose.finish(err);
                        togglePanels(true);
                        if (!err) {
                            setTimeout(() => showProgress(null), 1000);
                        }
                    });
                };
                togglePanels(false);
                if (checks.checkpoint) {
                    createCheckpoint(branch.id, `Checkpoint before closing branch "${branch.name}"`, close);
                } else {
                    close();
                }
            }
        });
    });

    switcher.on('open', (branch: any) => {
        togglePanels(false);
        showProgress(progressOpen);
        handleCallback(editor.api.globals.rest.branches.branchOpen({ branchId: branch.id }), (err) => {
            progressOpen.finish(err);
            togglePanels(true);
            if (!err) {
                setTimeout(() => showProgress(null), 1000);
            }
        });
    });

    switcher.on('delete', (branch: any) => {
        const dialog = showVcDialog({
            title: `Delete ${branch.name}?`,
            danger: true,
            body: ['This permanently deletes the branch and its history. Type the branch name to confirm.'],
            confirmText: 'Delete Branch',
            input: { placeholder: branch.name },
            confirmMatch: branch.name,
            onConfirm: () => {
                dialog.close();
                togglePanels(false);
                showProgress(progressDelete);
                handleCallback(editor.api.globals.rest.branches.branchDelete({ branchId: branch.id }), (err) => {
                    progressDelete.finish(err);
                    togglePanels(true);
                    if (!err) {
                        setTimeout(() => showProgress(null), 1000);
                    }
                });
            }
        });
    });

    switcher.on('graph', (branch: any) => {
        editor.call('vcgraph:showGraphPanel', { branchId: branch.id });
    });
    btnGraph.on('click', () => {
        editor.call('vcgraph:showGraphPanel', { branchId: viewedBranch.id });
    });

    // ---- restore / hard reset ----
    detail.on('restore', (checkpoint: any) => {
        const dialog = showVcDialog({
            title: 'Restore checkpoint?',
            body: ['The current state of ', { bold: config.self.branch.name }, ' becomes checkpoint ', { bold: checkpoint.id.substring(0, 7) }, '.'],
            confirmText: 'Restore',
            checkboxes: [{ key: 'checkpoint', label: 'Take a checkpoint of the current state first', value: true }],
            onConfirm: ({ checks }) => {
                dialog.close();
                const restore = () => {
                    showProgress(progressRestore);
                    handleCallback(editor.api.globals.rest.checkpoints.checkpointRestore({
                        checkpointId: checkpoint.id,
                        branchId: config.self.branch.id
                    }), (err) => {
                        progressRestore.finish(err);
                        if (err) {
                            togglePanels(true);
                        }
                    });
                };
                togglePanels(false);
                if (checks.checkpoint) {
                    createCheckpoint(config.self.branch.id, `Checkpoint before restoring "${checkpoint.id.substring(0, 7)}"`, restore);
                } else {
                    restore();
                }
            }
        });
    });

    detail.on('hardReset', (checkpoint: any) => {
        const dialog = showVcDialog({
            title: 'Hard reset?',
            danger: true,
            body: ['Deletes ALL checkpoints and changes after ', { bold: checkpoint.id.substring(0, 7) }, '. This cannot be undone. Type the checkpoint id (first 7 characters) to confirm.'],
            confirmText: 'Hard Reset',
            input: { placeholder: checkpoint.id.substring(0, 7) },
            confirmMatch: checkpoint.id.substring(0, 7),
            onConfirm: () => {
                dialog.close();
                togglePanels(false);
                showProgress(progressHardReset);
                handleCallback(editor.api.globals.rest.checkpoints.checkpointHardReset({
                    checkpointId: checkpoint.id,
                    branchId: config.self.branch.id
                }), (err) => {
                    progressHardReset.finish(err);
                    if (err) {
                        togglePanels(true);
                    }
                });
            }
        });
    });

    // ---- vc graph host (moved from old checkpoints widget) ----
    const vcGraphPanel = new Container({ class: ['picker-version-control', 'vc-graph-panel'], flex: true, hidden: true });
    editor.call('layout.root').append(vcGraphPanel);
    const vcNodeMenu = editor.call('vcgraph:makeNodeMenu', panel);
    editor.call('layout.root').append(vcNodeMenu);

    editor.method('vcgraph:closeGraphPanel', () => {
        editor.call('vcgraph:moveToForeground');
        vcGraphPanel.hidden = true;
        vcGraphPanel.clear();
    });
    editor.method('vcgraph:moveToBackground', () => vcGraphPanel.class.add('vc-graph-background'));
    editor.method('vcgraph:moveToForeground', () => vcGraphPanel.class.remove('vc-graph-background'));
    editor.method('vcgraph:isHidden', () => vcGraphPanel.hidden);
    editor.method('vcgraph:showGraphPanel', (h: any) => {
        vcGraphPanel.hidden = !vcGraphPanel.hidden;
        const vcGraphContainer = new Container({ class: 'vc-graph-container' });
        const vcGraphCloseBtn = new Button({ text: 'CLOSE', class: 'vc-graph-close-btn' });
        vcGraphCloseBtn.on('click', () => {
            editor.call('vcgraph:closeGraphPanel');
            if (h.closeVcPicker) {
                editor.call('picker:project:close');
            }
        });
        vcGraphPanel.append(vcGraphContainer);
        Object.assign(h, { vcGraphContainer, vcGraphCloseBtn, vcNodeMenu });
        editor.call('vcgraph:showInitial', h);
    });

    // ---- messenger list maintenance ----
    panel.on('show', () => {
        setViewedBranch(config.self.branch);
        changes.sidebar.invalidate();
        setCompareMode(false);
        setTab(showNewCheckpointOnLoad ? 'changes' : 'history');
        if (showNewCheckpointOnLoad) {
            showNewCheckpointOnLoad = false;
            changes.sidebar.focusForm();
        }
        showProgress(null);

        events.push(editor.on('permissions:writeState', () => {
            updateTabsState();
            history.emit('select', null);
            detail.clear();
        }));

        events.push(editor.on('messenger:checkpoint.createEnded', (data: any) => {
            if (data.status === 'error') {
                return;
            }
            const b = switcher.getBranch(data.branch_id);
            if (b) {
                b.latestCheckpointId = data.checkpoint_id;
            }
            if (config.self.branch.id === data.branch_id) {
                config.self.branch.latestCheckpointId = data.checkpoint_id;
                changes.sidebar.invalidate();
            }
            if (history.branch && history.branch.id === data.branch_id && history.checkpoints) {
                history.prependCheckpoint(editor.call('picker:versioncontrol:transformCheckpointData', data));
            }
        }));

        events.push(editor.on('messenger:branch.close', (data: any) => {
            switcher.removeBranch(data.branch_id);
            if (viewedBranch.id === data.branch_id) {
                setViewedBranch(config.self.branch);
            }
        }));
        events.push(editor.on('messenger:branch.delete', (data: any) => {
            switcher.removeBranch(data.branch_id);
            if (viewedBranch.id === data.branch_id) {
                setViewedBranch(config.self.branch);
            }
        }));
        events.push(editor.on('messenger:branch.open', () => switcher.refresh()));
        events.push(editor.on('messenger:branch.createEnded', (data: any) => {
            if (data.user_id !== config.self.id) {
                return;
            }
            const err = data.status === 'error' ? data.message : null;
            progressBranch.finish(err);
            if (err) {
                togglePanels(true);
            }
        }));

        events.push(projectUserSettings.on('favoriteBranches:insert', () => switcher.refresh()));
        events.push(projectUserSettings.on('favoriteBranches:remove', () => switcher.refresh()));

        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', false);
        }
    });

    panel.on('hide', () => {
        switcher.closePanel();
        setCompareMode(false);
        detail.clear();
        showNewCheckpointOnLoad = false;
        events.forEach(evt => evt.unbind());
        events.length = 0;
        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', true);
        }
    });

    editor.on('viewport:hover', (state: boolean) => {
        if (state && !panel.hidden) {
            setTimeout(() => {
                editor.emit('viewport:hover', false);
            }, 0);
        }
    });

    // ---- public methods (preserved) ----
    editor.method('picker:versioncontrol', () => {
        editor.call('picker:project', 'version control');
    });

    editor.method('picker:versioncontrol:transformCheckpointData', (data: any) => {
        return {
            id: data.checkpoint_id,
            user: { id: data.user_id, fullName: data.user_full_name },
            createdAt: new Date(data.created_at),
            description: data.description
        };
    });

    // ctrl+s hotkey opens the checkpoint form
    editor.call('hotkey:register', 'new-checkpoint', {
        key: 's',
        ctrl: true,
        callback: () => {
            if (!editor.call('permissions:write')) {
                return;
            }
            if (editor.call('picker:isOpen:otherThan', 'project')) {
                return;
            }
            if (panel.hidden) {
                showNewCheckpointOnLoad = true;
                editor.call('picker:versioncontrol');
            } else {
                setTab('changes');
                changes.sidebar.focusForm();
            }
        }
    });
});
```

Implementation notes for the executor:
- Dialog convention: every dialog captures its handle (`const dialog = showVcDialog({ ..., onConfirm: () => { dialog.close(); ... } })`) and closes first thing in `onConfirm` — except `openNewBranchDialog`, which validates and may call `dialog.setError` instead.
- `tabChanges.disabled` works because the tab is a native `<button>`.
- The old `branches-filter`/`branches-container` DOM is gone; `picker:project:toggleLeftPanel` retains its old behavior (it controls the project picker's own nav, not ours).
- After the messenger `checkpoint.createEnded` handler prepends to history, the Changes count refreshes on next `refresh()`; do not auto-run the diff on every checkpoint event.

- [ ] **Step 2: Verify lint + types**

```bash
npx eslint src/editor/pickers/version-control/picker-version-control.ts
npm run type:check 2>&1 | grep "pickers/version-control/picker-version-control.ts" || echo "clean"
```

Expected: clean (the rewrite removes the old dynamic-property errors in this file).

- [ ] **Step 3: Commit**

```bash
git add src/editor/pickers/version-control/picker-version-control.ts
git commit -m "feat: rebuild version control picker shell with github desktop layout"
```

---

### Task 9: Delete obsolete files, swap imports, remove old styles

**Files:**
- Modify: `src/editor/index.ts:355-364`
- Delete: 10 files (listed below)
- Modify: `sass/editor/_editor-main.scss` (delete the `.pcui-container.picker-version-control { ... }` top-level block — find with `grep -n "^\.pcui-container\.picker-version-control" sass/editor/_editor-main.scss`, ends before the next top-level selector `.ui-overlay.picker-conflict-manager`)
- Modify: `sass/common/_version-control.scss` (delete the `.pcui-text-input.search.version-control-search` block and the two `.pcui-container.picker-version-control ...` rules at the bottom; KEEP `.pcui-overlay.version-control-overlay` and `.pcui-menu.version-control`)

- [ ] **Step 1: Update side-effect imports**

In `src/editor/index.ts`, replace the block of version-control imports (currently lines 355-364, verify with `grep -n "version-control" src/editor/index.ts`) with:

```ts
import './pickers/version-control/picker-version-control-progress';
import './pickers/version-control/picker-version-control';
import './pickers/version-control/picker-version-control-overlay-message';
import './pickers/version-control/picker-version-control-overlay-merge';
import './pickers/version-control/picker-version-control-messenger';
```

Keep whatever order constraint exists today: `-progress` and `-overlay-*` define methods consumed by the shell and messenger at call time (not import time), so import order among these five is safe. Remove imports for: `-side-panel`, `-create-checkpoint`, `-restore-checkpoint`, `-hard-reset-checkpoint`, `-create-branch`, `-close-branch`, `-delete-branch`, `-merge-branches`, `-checkpoints`, `-diff-checkpoints` (verify the exact current list with the grep — keep `-overlay-message`, `-overlay-merge`, `-messenger`, `-progress` if already there).

- [ ] **Step 2: Delete the obsolete modules**

```bash
git rm src/editor/pickers/version-control/picker-version-control-side-panel.ts \
       src/editor/pickers/version-control/picker-version-control-create-checkpoint.ts \
       src/editor/pickers/version-control/picker-version-control-restore-checkpoint.ts \
       src/editor/pickers/version-control/picker-version-control-hard-reset-checkpoint.ts \
       src/editor/pickers/version-control/picker-version-control-create-branch.ts \
       src/editor/pickers/version-control/picker-version-control-close-branch.ts \
       src/editor/pickers/version-control/picker-version-control-delete-branch.ts \
       src/editor/pickers/version-control/picker-version-control-merge-branches.ts \
       src/editor/pickers/version-control/picker-version-control-checkpoints.ts \
       src/editor/pickers/version-control/picker-version-control-diff-checkpoints.ts \
       src/editor/pickers/version-control/ui/version-control-side-panel-box.ts
```

- [ ] **Step 3: Verify nothing still references the deleted modules**

```bash
grep -rn "side-panel\|widget:checkpoints\|widget:diffCheckpoints\|widget:createCheckpoint\|widget:createBranch\|widget:closeBranch\|widget:deleteBranch\|widget:mergeBranches\|widget:restoreCheckpoint\|widget:hardResetCheckpoint\|createSidePanel\|version-control-side-panel-box" src/ | grep -v "pickers/version-control"
```

Expected: no output. If anything appears, fix the reference before continuing.

- [ ] **Step 4: Remove the old SASS blocks**

Delete the entire `.pcui-container.picker-version-control { ... }` top-level block from `sass/editor/_editor-main.scss` (the block restyled earlier on this branch — KEEP the separate `.vc-graph-panel` / `_editor-version-control-graph.scss` styles, they belong to the graph). In `sass/common/_version-control.scss` delete the search-input block and the two trailing `.pcui-container.picker-version-control` rules. Then:

```bash
node -e "import('sass-embedded').then(async s => { await s.compileAsync('sass/editor.scss', { logger: s.Logger.silent }); console.log('ok'); })"
npx stylelint sass
```

Expected: `ok`, clean.

- [ ] **Step 5: Full typecheck + lint + build**

```bash
npm run type:check 2>&1 | grep "version-control" || echo "clean"
npx eslint src/editor/index.ts src/editor/pickers/version-control/
npm run build 2>&1 | tail -3
```

Expected: `clean`; no eslint errors; build succeeds.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: remove superseded version control side panels and styles"
```

---

### Task 10: UI tests + verification

**Files:**
- Modify: `test-suite/test/ui/version-control.test.ts`

- [ ] **Step 1: Update the Playwright flows to the new UI**

The existing test (`branch/checkpoint/diff/merge` describe block) drives the old selectors. Update each flow; the new selector vocabulary:

| Action | New selector flow |
| --- | --- |
| Open VC picker | unchanged: `.pcui-element.font-regular.logo` then `span:has-text("Version Control")` |
| Create checkpoint | `page.locator('.vc-top-actions .pcui-button.vc-primary').click()` → `page.locator('.vc-checkpoint-form textarea').fill(desc)` → `page.locator('.vc-create-checkpoint').click()` → wait for `page.locator('.vc-history .vc-row .desc', { hasText: desc })` |
| New branch from checkpoint | `page.locator('#checkpoint-<id>').click()` → `page.locator('.vc-detail-actions .vc-button', { hasText: 'New Branch' }).click()` → `page.locator('.vc-dialog .pcui-text-input input').fill('red')` → `page.locator('.vc-dialog .pcui-button.confirm').click()` |
| Switch branch | `page.locator('.vc-branch-button').click()` → `page.locator('#branch-<id> .switch').click()` (hover the row first: `page.locator('#branch-<id>').hover()`) |
| Merge branch | switcher open → `page.locator('#branch-<id> .kebab').click()` → `.pcui-menu-item:has-text("Merge Into Current Branch")` → `.vc-dialog .pcui-button.confirm` |
| Diff two checkpoints | `.vc-top-actions .pcui-button:has-text("Compare")` → click two `.vc-history .vc-row` → `.vc-compare-bar .pcui-button.vc-primary` |
| Restore | select checkpoint row → `.vc-detail-actions .vc-button:has-text("Restore")` → `.vc-dialog .pcui-button.confirm` |
| Hard reset | select checkpoint row → `.vc-detail-actions .vc-button.danger` → fill `.vc-dialog input` with the 7-char id → `.vc-dialog .pcui-button.confirm.danger` |
| Delete branch | switcher → row kebab → `.pcui-menu-item.delete` → fill branch name → `.vc-dialog .pcui-button.confirm.danger` |

Keep the test's existing structure (project setup, `page.evaluate` API calls for fixtures, `capture()` assertions, reload waits after switch/restore/hard-reset). Rewrite only the UI-driving locators per the table. The `#checkpoint-<id>` and `#branch-<id>` ids are kept by the new modules specifically for these tests.

- [ ] **Step 2: Run whatever local verification is available**

The Playwright suite needs a running backend (`test-suite` config). If available locally run:

```bash
cd test-suite && npx playwright test test/ui/version-control.test.ts
```

Expected: all tests in the file pass. If the backend is not available locally, state that explicitly in the task report — do not claim the suite passed.

- [ ] **Step 3: Full project verification**

```bash
npm run lint
npm run type:check 2>&1 | grep -c "error TS" || true
npm test -- --grep vc-helpers
npm run build 2>&1 | tail -3
```

Expected: lint clean; type error count not higher than on `main` before this branch (old picker errors are gone, none added); 7 mocha tests passing; build succeeds.

- [ ] **Step 4: Manual smoke pass (requires `npm run develop` + a project with VC access)**

Checklist: open picker → History renders with day groups and infinite scroll; select checkpoint → detail + changes card; Changes tab → diff summary + form; create checkpoint → row appears; switcher → search/filter/favorites, Switch button, kebab actions; New Branch / Merge / Close / Delete / Restore / Hard Reset dialogs incl. type-to-confirm gates; Compare mode two-slot flow opens diff viewer; ctrl+s opens form; VC graph opens from top bar and from kebab.

- [ ] **Step 5: Commit**

```bash
git add test-suite/test/ui/version-control.test.ts
git commit -m "test: update version control ui tests for redesigned picker"
```

---

## Self-review notes (already applied)

- Spec coverage: every spec section maps to a task — layout/top bar/switcher (T4, T8), Changes tab (T7), History (T5), detail (T6), dialogs incl. type-to-confirm (T3, T8), compare mode (T5, T8), progress/errors (T8), vcgraph + Caller preservation (T8), pcui rebuild + deletions (T9), styles (T2, T9), testing (T1, T10).
- The `formatDayGroup` locale-string approach has a stated deterministic fallback.
- All dialogs follow the captured-handle close-on-confirm convention (Task 8 implementation notes).
- Progress widgets move from the old `.side-panel` to `.vc-main`; their centering styles are included in the Task 2 partial so the Task 9 deletion does not orphan them.
- `diffCreate` cost mitigation from the spec (lazy + cached + manual refresh) is implemented in T6/T7; the "Compute changes" fallback is intentionally NOT pre-built (YAGNI — only if real projects prove too slow).

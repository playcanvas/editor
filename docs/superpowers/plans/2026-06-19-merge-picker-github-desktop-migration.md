# Merge Picker → GitHub-Desktop Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the legacy 3-column "RESOLVE CONFLICTS" merge picker with a GitHub-Desktop-style two-pane picker that shares the diff picker's presentation and theming, resolving conflicts per-item.

**Architecture:** Extract the diff picker's presentation (shell + sidebar + detail inspector) into a shared factory `vc-diff-view.ts`. Both the diff picker and a rebuilt merge picker render through it. The merge picker layers per-item resolution controls and the merge lifecycle (REVIEW/COMPLETE, messenger, progress) on top, registering both `picker:conflictManager` (resolve mode) and `picker:diffManager` (review mode). The legacy conflict-manager UI and styles are deleted.

**Tech Stack:** TypeScript, `@playcanvas/pcui`, legacy `@/common/ui/*` widgets (TextResolver only), SASS, Rollup+SWC. Caller pattern (`editor.method` / `editor.call`).

## Global Constraints

- Node ≥ 22.x. Commands: `npm run type:check`, `npm run lint`, `npm run build`.
- **No unit tests.** This is pure UI/DOM/picker work; per project convention it is verified by type-check + lint + build + manual verification against a real merge. Do NOT add Mocha/Chai tests. (Each task's "test cycle" = type-check/lint/build + the listed manual checks.)
- Path alias `@/*` → `./src/*`. Naming: PascalCase classes, camelCase functions, UPPER_SNAKE_CASE consts, kebab-case files.
- No explicit return types (rely on inference). Short variable names. No try/catch — use `handleCallback(promise, (err, data) => …)`. Comments only on complex sections, short, lowercase.
- Don't hardcode URLs/config — use `config` / `window.config`.
- Preserve the `picker:diffManager:closed` event contract (consumed by `panel-changes.ts:504`, `panel-detail.ts:249`, `picker-version-control.ts:51`).
- Work on a branch (not `main`): `git checkout -b feat/merge-picker-github-desktop`.
- Conventional commits, scope `version-control`.

---

## File Structure

| File | Responsibility |
| --- | --- |
| `src/editor/pickers/version-control/vc-diff-view.ts` | **NEW.** `createVcDiffView(opts)` — builds the overlay shell, owns sidebar + detail rendering. Presentation only; no diff/merge lifecycle. |
| `src/editor/pickers/version-control/picker-version-control-diff.ts` | **SLIM.** Diff lifecycle (promise/loading/slow-hint, esc/back, retained-diff cleanup) consuming the core. |
| `src/editor/pickers/conflict-manager/picker-conflict-manager.ts` | **REWRITE.** Merge lifecycle + per-item resolution, two modes, consuming the core. |
| `src/editor/pickers/conflict-manager/ui/text-resolver.ts` | **KEEP.** Interactive code-merge editor for "Open editor". |
| `src/editor/pickers/conflict-manager/ui/conflict-{resolver,section,section-row,field}.ts` | **DELETE.** |
| `src/editor/pickers/conflict-manager/picker-conflict-manager-{asset,scene,settings}.ts` | **DELETE.** |
| `sass/editor/_editor-version-control-merge.scss` | **NEW.** Merge-only rules: resolution dot/count, detail footer, sidebar footer, migrated `.textmerge-top`. |
| `sass/editor/_editor-main.scss` (L6515-7354) | **DELETE** old `.ui-overlay.picker-conflict-manager` block. |
| `sass/editor.scss` | **+1** `@import` for the merge partial. |
| `src/editor/index.ts` (L374-377) | Swap the four retired imports for the single new merge-picker import. |

---

## Task 1: Extract the shared diff-view core (behavior-preserving)

Move the diff picker's presentation into `vc-diff-view.ts` as a factory, then rewire the diff picker to consume it. The diff picker must behave **identically** afterward. This is a *move-and-parameterize* refactor: helper bodies are copied verbatim; only the few call sites noted below change.

**Files:**
- Create: `src/editor/pickers/version-control/vc-diff-view.ts`
- Modify: `src/editor/pickers/version-control/picker-version-control-diff.ts` (full rewrite to a thin consumer)

**Interfaces:**
- Produces: `createVcDiffView(opts) => view` (the rest of the plan consumes this).

```ts
type VcDiffViewOpts = {
  title: string;
  rootClass?: string;                 // extra class added to the overlay (e.g. 'vc-merge')
  fullscreenKey: string;              // localStorage key for fullscreen state
  sidebarKey: string;                 // localStorage key for sidebar width
  decorateRow?: (row: HTMLElement, conflict: any, item: any) => void;  // append per-row chrome (idempotent)
  renderDetailFooter?: (detail: HTMLElement, conflict: any) => void;   // append footer under the inspector
  renderMeta?: (meta: HTMLElement, data: any) => void;                 // fill the header meta line
  shouldRenderFrame?: () => boolean;  // gate the read-only file iframe; default () => true
};

type VcDiffView = {
  overlay; top; sidebar; sidebarFooter: HTMLElement; main: HTMLElement;
  setTitle: (text: string) => void;
  setData: (data: any) => void;
  render: () => void;
  renderSidebar: () => void;
  renderMain: () => void;
  renderNotice: (message: string) => void;
  renderLoading: () => void;
  clearSidebar: () => void;
  cleanup: () => void;
  getSelectedConflict: () => any;
  getSelectedIndex: () => number;
};
```

- [ ] **Step 1: Create the file skeleton with imports, opts/return types, factory open, module consts, and closure state.**

Copy the imports from `picker-version-control-diff.ts:1-20` into the new file. Add the consts currently at `picker-version-control-diff.ts:22-47` (`SUB_RE`, `SETTINGS_ROOT_RE`, `TEMPLATE_PANEL`, `TEMPLATE_FIELDS`, `SKELETON_*`) and the sidebar-bounds consts `SIDEBAR_DEFAULT_W=280`, `SIDEBAR_MIN_W=240`, `SIDEBAR_MAX_W=720`, `DIFF_MAIN_MIN_W=480`, `FULLSCREEN_TOOLBAR_W=40`. **Do NOT** copy `FULLSCREEN_KEY`/`SIDEBAR_KEY` (they become opts). Then:

```ts
export const createVcDiffView = (opts: VcDiffViewOpts) => {
    const root = editor.call('layout.root');
    const overlay = new Overlay({ class: 'vc-diff-overlay', clickable: false, hidden: true });
    if (opts.rootClass) {
        overlay.class.add(opts.rootClass);
    }
    root.append(overlay);

    const shell = new Container({ class: 'vc-diff-shell' });
    overlay.append(shell);

    const top = new Container({ class: 'vc-diff-top' });
    shell.append(top);

    const title = document.createElement('div');
    title.classList.add('vc-diff-title');
    title.textContent = opts.title;
    top.dom.appendChild(title);

    const meta = document.createElement('div');
    meta.classList.add('vc-diff-meta');
    top.dom.appendChild(meta);

    // fullscreen toggle (move verbatim from the diff picker), using opts.fullscreenKey
    let fullscreen = editor.call('localStorage:get', opts.fullscreenKey) === true;
    const fullscreenToggle = new Button({ class: 'vc-diff-fullscreen-toggle' });
    const applyFullscreen = () => {
        overlay.class[fullscreen ? 'add' : 'remove']('fullscreen');
        fullscreenToggle.class[fullscreen ? 'add' : 'remove']('active');
        fullscreenToggle.dom.setAttribute('title', fullscreen ? 'Exit fullscreen' : 'Fullscreen');
    };
    fullscreenToggle.on('click', () => {
        fullscreen = !fullscreen;
        editor.call('localStorage:set', opts.fullscreenKey, fullscreen);
        applyFullscreen();
        applyResizeBounds(fullscreen);
    });
    top.append(fullscreenToggle);

    const close = new Button({ icon: 'E132', class: 'vc-diff-close' });
    close.on('click', () => {
        overlay.hidden = true;
    });
    top.append(close);
    applyFullscreen();

    const body = new Container({ class: 'vc-diff-body' });
    shell.append(body);

    const sidebar = new Container({
        class: 'vc-diff-sidebar',
        resizable: 'right',
        resizeMin: SIDEBAR_MIN_W,
        resizeMax: SIDEBAR_MAX_W,
        width: editor.call('localStorage:get', opts.sidebarKey) || SIDEBAR_DEFAULT_W
    });
    sidebar.on('resize', () => {
        editor.call('localStorage:set', opts.sidebarKey, sidebar.width);
    });
    body.append(sidebar);

    const head = document.createElement('div');
    head.classList.add('vc-diff-sidebar-head');
    sidebar.dom.appendChild(head);

    const filterBar = document.createElement('div');
    filterBar.classList.add('vc-diff-filter');
    const filter = new TextInput({ keyChange: true, renderChanges: false });
    (filter.dom.querySelector('input') as HTMLInputElement).placeholder = 'Filter changes';
    filterBar.appendChild(filter.dom);
    const typeSelect = new SelectInput({ type: 'string', value: 'all', options: [{ v: 'all', t: 'All types' }] });
    filterBar.appendChild(typeSelect.dom);
    sidebar.dom.appendChild(filterBar);
    filter.on('change', () => renderSidebar());
    typeSelect.on('change', () => renderSidebar());

    const list = document.createElement('div');
    list.classList.add('vc-diff-list');
    sidebar.dom.appendChild(list);

    // sidebar footer slot for consumer chrome (merge: REVIEW / COMPLETE buttons)
    const sidebarFooter = document.createElement('div');
    sidebarFooter.classList.add('vc-diff-sidebar-foot');
    sidebar.dom.appendChild(sidebarFooter);

    const applyResizeBounds = (full: boolean) => {
        const sidebarMax = full ? Math.max(SIDEBAR_MAX_W, window.innerWidth - FULLSCREEN_TOOLBAR_W - DIFF_MAIN_MIN_W) : SIDEBAR_MAX_W;
        sidebar.resizeMax = sidebarMax;
        const w = editor.call('localStorage:get', opts.sidebarKey) || SIDEBAR_DEFAULT_W;
        if (w > sidebarMax) {
            sidebar.width = sidebarMax;
            editor.call('localStorage:set', opts.sidebarKey, sidebarMax);
        }
    };
    applyResizeBounds(fullscreen);

    const main = document.createElement('div');
    main.classList.add('vc-diff-main');
    body.dom.appendChild(main);

    let current: any = null;
    let nameIndex: NameIndex = null;
    let selected = 0;
    let viewToken = 0;
    let trees: TreeView[] = [];
    const fileStats = new Map<string, Promise<{ deleted: number; added: number } | null>>();

    sidebar.dom.addEventListener('click', (evt) => {
        const row = (evt.target as HTMLElement).closest('.vc-diff-row') as HTMLElement;
        if (!row?.dataset.index) {
            return;
        }
        selected = Number(row.dataset.index);
        sidebar.dom.querySelectorAll('.vc-diff-row.selected').forEach(el => el.classList.remove('selected'));
        row.classList.add('selected');
        renderMain();
    });
    // … helpers + render fns inserted in Step 2 …
};
```

- [ ] **Step 2: Move the helper + render functions into the factory body, verbatim except the 4 changes below.**

Move these functions from `picker-version-control-diff.ts` into the factory closure **unchanged**: `diffId`, `statusFor`, `textEntry`, `propertyEntries`, `selectedConflict`, `lineStats`, `propertyStats`, `localTextCounts`, `loadTextCounts`, `entityName`, `appendBadge`, `sectionComponent`, `inspectorInfo`, `sectionParts`, `entityTree`, `fieldRow`, `sideField`, `wholeEntity`, `wholeBanner`, `renderUnifiedDiff`, `renderIframe`, `updateCounts`, `appendSummaryStats`, `clearSidebar`, `renderSidebar`, `renderMain`, `render`, `cleanup`, `renderNotice`, `renderLoading`, `setDiff` (rename `setDiff` → `setData`).

Do **NOT** move `isRetainedDiff` into the core — it is only needed by the consumer's hide handler, where it stays (see Step 4). The core needs `diffId` (used by the moved `renderIframe`/`loadTextCounts`).

Apply these **4 modifications**:

1. In `renderSidebar`, after `appendBadge(row, item.status);` and before `list.appendChild(row);`, call the decorate hook:
```ts
            opts.decorateRow?.(row, conflict, item);
            list.appendChild(row);
```

2. In `renderMain`, gate the iframe and append the footer hook. Replace the `const showText = …` block through `main.appendChild(detail);` with:
```ts
        const showText = text?.id && text?.mergedFilePath;
        const showFrame = showText && (opts.shouldRenderFrame?.() ?? true);
        const detail = document.createElement('div');
        detail.classList.add('vc-diff-detail');
        if (showFrame) {
            detail.classList.add('has-frame');
        }
        if (props.length) {
            detail.appendChild(renderUnifiedDiff(conflict, props));
        }
        if (showFrame) {
            detail.appendChild(renderIframe(conflict, text));
        } else if (!props.length && opts.shouldRenderFrame?.() !== false) {
            const empty = document.createElement('div');
            empty.classList.add('vc-diff-empty');
            empty.textContent = 'No preview available';
            detail.appendChild(empty);
        }
        main.appendChild(detail);
        opts.renderDetailFooter?.(detail, conflict);
```

3. In `render`, replace the meta-building lines (the `meta.textContent = …` + `hashChip` block) with the hook:
```ts
        meta.textContent = '';
        opts.renderMeta?.(meta, current);
```
(The diff picker passes a `renderMeta` that reproduces the old `${total} change(s) · vs <hash>` output — see Step 4.)

4. In `setData` (renamed from `setDiff`), keep the body identical (it builds `nameIndex`, handles the empty case via `renderNotice('No changes since the checkpoint')`, sets `selected`, calls `render()`).

- [ ] **Step 3: Add the returned object at the end of the factory.**

```ts
    return {
        overlay, top, sidebar, sidebarFooter, main,
        setTitle: (text: string) => { title.textContent = text; },
        setData, render, renderSidebar, renderMain, renderNotice, renderLoading, clearSidebar, cleanup,
        getSelectedConflict: () => selectedConflict(),
        getSelectedIndex: () => selected
    };
```

Note on `viewToken`: it stays internal (used by `updateCounts`/`renderLoading`). The diff picker's promise-loading needs its own token guard — keep that in the consumer (Step 4), independent of the core's `viewToken`.

- [ ] **Step 4: Rewrite `picker-version-control-diff.ts` as a thin consumer.**

Replace the entire file with:
```ts
import { handleCallback } from '@/common/utils';
import { config } from '@/editor/config';

import { createVcDiffView } from './vc-diff-view';
import { summarizeDiff, hashChip, DIFF_SLOW_HINT_MS, DIFF_SLOW_HINT_TEXT } from './vc-helpers';

editor.once('load', () => {
    if (config.project.settings.useLegacyScripts) {
        return;
    }

    const view = createVcDiffView({
        title: 'Diff',
        fullscreenKey: 'editor:picker:vcdiff:fullscreen',
        sidebarKey: 'editor:vcdiff:sidebar:width',
        renderMeta: (meta, data) => {
            const summary = summarizeDiff(data ?? {});
            const base = data?.destinationCheckpointId || data?.dstCheckpointId;
            meta.textContent = `${summary.total} change${summary.total === 1 ? '' : 's'}`;
            if (typeof base === 'string') {
                meta.appendChild(document.createTextNode(' · vs '));
                meta.appendChild(hashChip(base));
            }
        }
    });

    const diffId = (diff: any) => diff?.id ?? diff?.merge_id;
    const isRetainedDiff = (id: string) => !!id && !!editor.call('picker:versioncontrol:hasRetainedDiff', id);

    let loadToken = 0;
    let current: any = null;

    let closingViaBack = false;
    const onPopState = () => {
        if (!view.overlay.hidden) {
            closingViaBack = true;
            view.overlay.hidden = true;
        }
    };
    const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !view.overlay.hidden) {
            e.stopPropagation();
            view.overlay.hidden = true;
        }
    };

    view.overlay.on('show', () => {
        editor.emit('picker:open', 'version-control-diff');
        window.addEventListener('popstate', onPopState);
        window.addEventListener('keydown', onKey, true);
        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', false);
        }
    });

    view.overlay.on('hide', () => {
        window.removeEventListener('popstate', onPopState);
        window.removeEventListener('keydown', onKey, true);
        const id = diffId(current);
        if (typeof id === 'string' && !isRetainedDiff(id)) {
            editor.emit('picker:diffManager:closed', id);
            handleCallback(editor.api.globals.rest.merge.mergeDelete({ mergeId: id }), () => {});
        }
        if (closingViaBack) {
            editor.call('picker:project:resume');
        } else if (editor.call('picker:isOpen', 'project')) {
            editor.call('picker:project:resume');
        } else {
            editor.call('picker:versioncontrol');
            editor.call('vcgraph:moveToForeground');
        }
        closingViaBack = false;
        current = null;
        view.cleanup();
        editor.emit('picker:close', 'version-control-diff');
        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', true);
        }
    });

    editor.on('viewport:hover', (state: boolean) => {
        if (state && !view.overlay.hidden) {
            setTimeout(() => editor.emit('viewport:hover', false), 0);
        }
    });

    const setDiff = (diff: any) => {
        current = diff;
        view.setData(diff);
    };

    editor.method('picker:versioncontrol:diffPicker', (input: any) => {
        const token = ++loadToken;
        current = null;
        view.overlay.hidden = false;
        if (input && typeof input.then === 'function') {
            view.renderLoading();
            const slowHint = setTimeout(() => {
                if (token === loadToken) {
                    const hint = document.createElement('div');
                    hint.classList.add('vc-diff-slow-hint');
                    hint.textContent = DIFF_SLOW_HINT_TEXT;
                    view.main.insertBefore(hint, view.main.firstChild);
                }
            }, DIFF_SLOW_HINT_MS);
            input.then((diff: any) => {
                clearTimeout(slowHint);
                if (token === loadToken) {
                    setDiff(diff);
                }
            }).catch((err: any) => {
                clearTimeout(slowHint);
                if (token === loadToken) {
                    view.clearSidebar();
                    view.renderNotice(`Could not load diff: ${err instanceof Error ? err.message : err}`);
                }
            });
        } else {
            setDiff(input);
        }
    });
});
```

Note: `hashChip` and `summarizeDiff` are already exported from `vc-helpers.ts` (confirm imports resolve). The `vc-diff-view.ts` also imports the helpers it moved (`buildNameIndex`, `indexTemplateEntities`, `arrayFieldKind`, `summarizeDiff`, `typeLabel`, `formatDiffPath`, `splitDiffPath`, `assetDiffField`, `isHiddenDiffField`, `lineChangeCounts`, `diffTextChangeCounts`, `hashChip`, `DIFF_SLOW_HINT_*` are NOT needed in the core — they belong to the consumer; keep only what the moved bodies reference).

- [ ] **Step 5: Type-check, lint, build.**

Run: `npm run type:check`
Expected: no errors.
Run: `npm run lint`
Expected: no new errors in the two files.
Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 6: Manual verification — diff picker unchanged.**

Open the editor on a branch with checkpoint changes, trigger a checkpoint diff (version-control panel → view diff). Confirm: two-pane layout, header title "Diff" + meta "N changes · vs <hash>", sidebar filter + type dropdown, resizable divider, fullscreen toggle, esc/back close, row selection updates detail, file diffs show the read-only iframe. **It should look and behave exactly as before.**

- [ ] **Step 7: Commit.**

```bash
git add src/editor/pickers/version-control/vc-diff-view.ts src/editor/pickers/version-control/picker-version-control-diff.ts
git commit -m "refactor(version-control): extract shared diff-view core"
```

---

## Task 2: Rebuild the merge picker shell + lifecycle (resolution stubbed)

Rewrite `picker-conflict-manager.ts` to consume the core and own the merge lifecycle and both modes. Resolution hooks are present but minimal (filled in Task 3).

**Files:**
- Modify: `src/editor/pickers/conflict-manager/picker-conflict-manager.ts` (full rewrite)

**Interfaces:**
- Consumes: `createVcDiffView` (Task 1).
- Produces: `editor.method('picker:conflictManager', data?)`, `editor.method('picker:diffManager', diff?)`. Module-closure state `currentMergeObject`, `diffMode`, helpers `toggleDiffMode`, `onMergeDataLoaded`, `updateReviewState`, `decorateResolutionRow`, `renderResolveFooter`, `resolveItem`, `openTextEditor` (the last four are stubbed here, completed in Tasks 3-4).

- [ ] **Step 1: Replace the whole file with the new module skeleton.**

```ts
import { Button } from '@playcanvas/pcui';

import { handleCallback } from '@/common/utils';
import {
    MERGE_STATUS_APPLY_ENDED,
    MERGE_STATUS_APPLY_STARTED,
    MERGE_STATUS_AUTO_ENDED,
    MERGE_STATUS_AUTO_STARTED,
    MERGE_STATUS_READY_FOR_REVIEW
} from '@/core/constants';

import { diffCreate } from '../../messenger/jobs';
import { createVcDiffView } from '../version-control/vc-diff-view';
import { TextResolver } from './ui/text-resolver';

const MERGE_ERROR = 'Error while merging. Please stop the merge and try again.';

editor.once('load', () => {
    let currentMergeObject: any = null;
    let diffMode = false;
    let evtMessengerMergeProgress: any = null;
    let textResolver: TextResolver | null = null;

    const isRetainedDiff = (id: string) => !!id && !!editor.call('picker:versioncontrol:hasRetainedDiff', id);

    const isGroupResolved = (group: any) =>
        (group.data ?? []).every((d: any) => d.useSrc || d.useDst || d.useMergedFile);

    const allResolved = () => (currentMergeObject?.conflicts ?? []).every(isGroupResolved);

    const view = createVcDiffView({
        title: 'Resolve Conflicts',
        rootClass: 'vc-merge',
        fullscreenKey: 'editor:picker:vcmerge:fullscreen',
        sidebarKey: 'editor:vcmerge:sidebar:width',
        shouldRenderFrame: () => diffMode, // resolve mode: no read-only frame (uses Open editor); review: read-only frame
        decorateRow: (row, conflict) => {
            if (!diffMode) {
                decorateResolutionRow(row, conflict);
            }
        },
        renderDetailFooter: (detail, conflict) => {
            if (!diffMode) {
                renderResolveFooter(detail, conflict);
            }
        },
        renderMeta: (meta, data) => {
            if (!data) {
                return;
            }
            meta.textContent = diffMode
                ? `${data.destinationBranchName} ← merge result`
                : `${data.sourceBranchName} → ${data.destinationBranchName}`;
        }
    });

    // sidebar footer: REVIEW (resolve mode) → COMPLETE (review mode)
    const btnReview = new Button({ text: 'Review merge', class: 'vc-merge-primary' });
    btnReview.enabled = false;
    btnReview.on('click', () => applyMerge(false));
    view.sidebarFooter.appendChild(btnReview.dom);

    const btnComplete = new Button({ text: 'Complete merge', class: 'vc-merge-primary' });
    btnComplete.hidden = true;
    btnComplete.on('click', () => applyMerge(true));
    view.sidebarFooter.appendChild(btnComplete.dom);

    // — resolution hooks (stubs; completed in Task 3-4) —
    const decorateResolutionRow = (row: HTMLElement, conflict: any) => {};
    const renderResolveFooter = (detail: HTMLElement, conflict: any) => {};
    const updateReviewState = () => {
        btnReview.enabled = allResolved();
    };

    // — mode + meta —
    const toggleDiffMode = (on: boolean) => {
        diffMode = on;
        view.overlay.class[on ? 'add' : 'remove']('diff');
        view.setTitle(on ? (config.self.branch.merge ? 'Review merge changes' : 'Diff') : 'Resolve conflicts');
        btnReview.hidden = on;
        btnComplete.hidden = !on || !config.self.branch.merge;
    };

    // — data load —
    const onMergeDataLoaded = (data: any) => {
        currentMergeObject = data;
        if (!data?.conflicts?.length) {
            view.clearSidebar();
            if (diffMode) {
                btnComplete.enabled = true;
                view.renderNotice('No changes found — click Complete merge');
            } else {
                btnReview.enabled = true;
                view.renderNotice('No conflicts found — click Review merge');
            }
            return;
        }
        view.setData(data);
        if (!diffMode) {
            updateReviewState();
        }
    };

    const loadMerge = () => {
        view.renderNotice('Loading conflicts…');
        handleCallback(editor.api.globals.rest.merge.mergeGet({ mergeId: config.self.branch.merge.id }), (err, data) => {
            if (err) {
                return view.renderNotice(err);
            }
            onMergeDataLoaded(data);
        });
    };

    const loadDiff = () => {
        view.renderNotice('Loading changes…');
        diffCreate({
            srcBranchId: config.self.branch.merge.sourceBranchId,
            dstBranchId: config.self.branch.merge.destinationBranchId,
            dstCheckpointId: config.self.branch.merge.destinationCheckpointId,
            mergeId: config.self.branch.merge.id
        }).then(onMergeDataLoaded).catch((err: any) => view.renderNotice(`${err}`));
    };

    const onReadyForReview = () => {
        view.renderNotice('Loading changes…');
        diffCreate({
            srcBranchId: config.self.branch.merge.sourceBranchId,
            dstBranchId: config.self.branch.merge.destinationBranchId,
            dstCheckpointId: config.self.branch.merge.destinationCheckpointId,
            mergeId: config.self.branch.merge.id
        }).then((data: any) => {
            toggleDiffMode(true);
            btnComplete.enabled = true;
            onMergeDataLoaded(data);
        }).catch((err: any) => {
            toggleDiffMode(true);
            view.renderNotice(`${err}`);
        });
    };

    // — apply (review = finalize:false, complete = finalize:true) —
    const applyMerge = (finalize: boolean) => {
        btnReview.enabled = false;
        btnComplete.enabled = false;
        view.clearSidebar();
        view.renderNotice(finalize ? 'Completing merge…' : 'Resolving conflicts…');
        handleCallback(editor.api.globals.rest.merge.mergeApply({
            mergeId: config.self.branch.merge.id,
            finalize
        }), (err: string) => {
            if (err && !/Request timed out/.test(err)) {
                view.renderNotice(err);
                setTimeout(() => window.location.reload(), 2000);
            }
        });
    };

    // — messenger —
    const onMsgMergeProgress = (data: any) => {
        if (data.dst_branch_id !== config.self.branch.id) {
            return;
        }
        config.self.branch.merge.mergeProgressStatus = data.status;
        if (data.task_failed) {
            return view.renderNotice(MERGE_ERROR);
        }
        if (data.status === MERGE_STATUS_READY_FOR_REVIEW) {
            onReadyForReview();
        } else if (data.status === MERGE_STATUS_AUTO_ENDED) {
            loadMerge();
        } else if (data.status === MERGE_STATUS_APPLY_ENDED) {
            view.renderNotice('Merge complete — refreshing browser…');
        }
    };

    // — close confirm (stops the merge) —
    const onClose = () => {
        if (config.self.branch.merge) {
            view.renderNotice('Stopping merge…');
            handleCallback(editor.api.globals.rest.merge.mergeDelete({ mergeId: config.self.branch.merge.id }), (err) => {
                view.renderNotice(err || 'Merge stopped. Refreshing browser');
            });
            if (diffMode && currentMergeObject && currentMergeObject.id !== config.self.branch.merge.id && !isRetainedDiff(currentMergeObject.id)) {
                handleCallback(editor.api.globals.rest.merge.mergeDelete({ mergeId: currentMergeObject.id }), () => {});
            }
        } else if (diffMode && currentMergeObject && !isRetainedDiff(currentMergeObject.id)) {
            handleCallback(editor.api.globals.rest.merge.mergeDelete({ mergeId: currentMergeObject.id }), () => {});
        }
    };

    view.overlay.on('show', () => {
        editor.emit('picker:open', 'conflict-manager');
        evtMessengerMergeProgress = editor.on('messenger:merge.setProgress', onMsgMergeProgress);
        if (!currentMergeObject) {
            if (diffMode) {
                loadDiff();
            } else if (config.self.branch.merge?.task_failed) {
                view.renderNotice(MERGE_ERROR);
            } else if (!config.self.branch.merge?.mergeProgressStatus ||
                       config.self.branch.merge.mergeProgressStatus === MERGE_STATUS_APPLY_STARTED ||
                       config.self.branch.merge.mergeProgressStatus === MERGE_STATUS_AUTO_STARTED) {
                view.renderNotice('Merging in progress…');
            } else if (config.self.branch.merge.mergeProgressStatus === MERGE_STATUS_READY_FOR_REVIEW) {
                onReadyForReview();
            } else {
                loadMerge();
            }
        } else {
            onMergeDataLoaded(currentMergeObject);
        }
        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', false);
        }
    });

    view.overlay.on('hide', () => {
        if (diffMode && currentMergeObject && !config.self.branch.merge && !isRetainedDiff(currentMergeObject.id)) {
            editor.emit('picker:diffManager:closed', currentMergeObject.id);
        }
        if (diffMode && editor.call('picker:isOpen', 'project')) {
            editor.call('picker:project:resume');
        }
        if (textResolver) {
            textResolver.destroy();
            textResolver = null;
        }
        currentMergeObject = null;
        if (evtMessengerMergeProgress) {
            evtMessengerMergeProgress.unbind();
            evtMessengerMergeProgress = null;
        }
        view.cleanup();
        editor.emit('picker:close', 'conflict-manager');
        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', true);
        }
    });

    editor.on('viewport:hover', (state: boolean) => {
        if (state && !view.overlay.hidden) {
            setTimeout(() => editor.emit('viewport:hover', false), 0);
        }
    });

    // intercept the core's close button so it runs the merge-stop confirm first
    view.overlay.on('hide', () => {}); // (kept above)
    const coreClose = view.top.dom.querySelector('.vc-diff-close') as HTMLElement;
    coreClose?.addEventListener('click', (e) => {
        if (config.self.branch.merge) {
            e.stopImmediatePropagation();
            editor.call('picker:confirm', 'Closing the conflict manager will stop the merge. Are you sure?', () => {
                onClose();
                view.overlay.hidden = true;
            });
        } else {
            onClose();
        }
    }, true);

    editor.method('picker:conflictManager', (data: any) => {
        toggleDiffMode(false);
        currentMergeObject = data ?? null;
        view.overlay.hidden = false;
    });

    editor.method('picker:diffManager', (diff: any) => {
        toggleDiffMode(true);
        currentMergeObject = diff ?? null;
        view.overlay.hidden = false;
    });
});
```

Notes:
- The merge picker imports `Button` from pcui; `config` is the global injected via Rollup footer (same as the diff picker uses `config` from `@/editor/config` — import it: add `import { config } from '@/editor/config';`).
- The core's close button (`.vc-diff-close`) only sets `overlay.hidden = true`. We add a capture-phase listener that, for in-progress merges, intercepts with the stop-merge confirm. For non-merge diffs it just runs `onClose()` cleanup (deletion happens in `hide`).
- `decorateResolutionRow`/`renderResolveFooter` are declared with `const` after the `createVcDiffView` call but referenced inside its option closures — hoist them above the `createVcDiffView` call (move the stub `const` declarations up) OR convert to `function` declarations so they hoist. **Use `function decorateResolutionRow(...) {}` / `function renderResolveFooter(...) {}` declarations** to avoid TDZ issues. Apply the same to `resolveItem`/`openTextEditor` added later.

- [ ] **Step 2: Fix hoisting — convert the resolution hooks to function declarations.**

Change the stub `const decorateResolutionRow = …` / `const renderResolveFooter = …` to:
```ts
    function decorateResolutionRow(row: HTMLElement, conflict: any) {}
    function renderResolveFooter(detail: HTMLElement, conflict: any) {}
```
(function declarations hoist, so the `createVcDiffView` option closures can reference them.)

- [ ] **Step 3: Type-check, lint, build.**

Run: `npm run type:check` → no errors.
Run: `npm run lint` → no new errors.
Run: `npm run build` → succeeds.
(The old `picker-conflict-manager-{asset,scene,settings}.ts` still register unused `showXConflicts` methods — harmless, deleted in Task 6.)

- [ ] **Step 4: Manual verification — shell + lifecycle.**

Start a merge with conflicts. Confirm the new overlay opens with title "Resolve conflicts", the GitHub-Desktop two-pane layout (sidebar list with grouped/badged rows + filter, detail pane with the field preview), meta shows `source → destination`, and a "Review merge" button sits in the sidebar footer (disabled). Selecting rows updates the detail. The close (×) button prompts "Closing the conflict manager will stop the merge". (Resolution controls + dots are stubbed/absent — that's expected until Task 3.)

- [ ] **Step 5: Commit.**

```bash
git add src/editor/pickers/conflict-manager/picker-conflict-manager.ts
git commit -m "feat(version-control): rebuild merge picker shell on shared diff-view core"
```

---

## Task 3: Per-item resolution layer

Fill in the resolution dot/count, the detail footer (Use destination / Use source + Resolve), and the bulk `conflictsResolve` wiring.

**Files:**
- Modify: `src/editor/pickers/conflict-manager/picker-conflict-manager.ts`

**Interfaces:**
- Consumes: `view` (Task 1), `currentMergeObject`, `isGroupResolved`, `allResolved`, `updateReviewState` (Task 2).
- Produces: completed `decorateResolutionRow`, `renderResolveFooter`, plus `resolveItem(conflict, side)` where `side: 'source' | 'destination'`.

- [ ] **Step 1: Implement `decorateResolutionRow` (idempotent).**

Replace the stub function body:
```ts
    function decorateResolutionRow(row: HTMLElement, conflict: any) {
        row.querySelector('.vc-merge-state')?.remove();
        const total = (conflict.data ?? []).length;
        const done = (conflict.data ?? []).filter((d: any) => d.useSrc || d.useDst || d.useMergedFile).length;
        const state = document.createElement('span');
        state.className = `vc-merge-state${done === total ? ' resolved' : ''}`;
        const dot = document.createElement('span');
        dot.className = 'dot';
        state.appendChild(dot);
        const count = document.createElement('span');
        count.className = 'count';
        count.textContent = `${done}/${total}`;
        state.appendChild(count);
        row.insertBefore(state, row.firstChild);
    }
```

- [ ] **Step 2: Implement `resolveItem` (bulk per-item) and `renderResolveFooter`.**

Add `resolveItem` and replace the `renderResolveFooter` stub:
```ts
    function resolveItem(conflict: any, side: 'source' | 'destination') {
        const ids = (conflict.data ?? []).map((d: any) => d.id);
        if (!ids.length) {
            return;
        }
        const useSrc = side === 'source';
        handleCallback(editor.api.globals.rest.conflicts.conflictsResolve({
            mergeId: currentMergeObject.id,
            conflictIds: ids,
            useSrc,
            useDst: !useSrc
        }), (err: string) => {
            if (err) {
                return editor.call('status:error', err);
            }
            (conflict.data ?? []).forEach((d: any) => {
                d.useSrc = useSrc;
                d.useDst = !useSrc;
                d.useMergedFile = false;
            });
            view.renderSidebar();
            view.renderMain();
            updateReviewState();
        });
    }

    function renderResolveFooter(detail: HTMLElement, conflict: any) {
        const footer = document.createElement('div');
        footer.className = 'vc-merge-resolve';

        const allSrc = (conflict.data ?? []).length > 0 && conflict.data.every((d: any) => d.useSrc);
        const allDst = (conflict.data ?? []).length > 0 && conflict.data.every((d: any) => d.useDst);
        const group = `vc-merge-side-${conflict.itemId}`;

        const makeChoice = (value: 'destination' | 'source', label: string, checked: boolean) => {
            const wrap = document.createElement('label');
            wrap.className = 'vc-merge-choice';
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = group;
            radio.value = value;
            radio.checked = checked;
            wrap.appendChild(radio);
            wrap.appendChild(document.createTextNode(label));
            return wrap;
        };

        const dstName = currentMergeObject?.destinationBranchName ?? 'destination';
        const srcName = currentMergeObject?.sourceBranchName ?? 'source';
        const choiceDst = makeChoice('destination', `Use ${dstName} (destination)`, allDst);
        const choiceSrc = makeChoice('source', `Use ${srcName} (source)`, allSrc);
        footer.appendChild(choiceDst);
        footer.appendChild(choiceSrc);

        const actions = document.createElement('div');
        actions.className = 'vc-merge-actions';
        const resolve = new Button({ text: 'Resolve', class: 'vc-merge-primary' });
        resolve.on('click', () => {
            const picked = (footer.querySelector(`input[name="${group}"]:checked`) as HTMLInputElement)?.value;
            if (picked === 'source' || picked === 'destination') {
                resolveItem(conflict, picked);
            }
        });
        actions.appendChild(resolve.dom);
        footer.appendChild(actions);

        detail.appendChild(footer);
    }
```

- [ ] **Step 3: Type-check, lint, build.**

Run: `npm run type:check` → no errors.
Run: `npm run lint` → no new errors.
Run: `npm run build` → succeeds.

- [ ] **Step 4: Manual verification — resolution.**

Start a merge with data conflicts on a material + a scene + project settings. For each item: confirm a resolution dot + `0/N` shows in the sidebar row; the detail footer shows the two radios + Resolve; clicking Resolve flips the row dot to resolved (`N/N`), the radio reflects the chosen side on re-select, and once **all** items are resolved the "Review merge" button enables. Click Review merge → it transitions to review mode (read-only) and shows "Complete merge". (Styling of the dot/footer is refined in Task 5.)

- [ ] **Step 5: Commit.**

```bash
git add src/editor/pickers/conflict-manager/picker-conflict-manager.ts
git commit -m "feat(version-control): per-item conflict resolution in merge picker"
```

---

## Task 4: File conflicts — "Open editor"

Add the "Open editor" button for items with a file/text conflict, mounting the interactive `TextResolver` into the detail pane. Review mode already shows the read-only iframe via the core (`shouldRenderFrame` returns `diffMode`).

**Files:**
- Modify: `src/editor/pickers/conflict-manager/picker-conflict-manager.ts`

**Interfaces:**
- Consumes: `TextResolver` (kept), `view`, `currentMergeObject`, `resolveItem`, `updateReviewState`.
- Produces: `openTextEditor(conflict)`; extended `renderResolveFooter` (adds the Open-editor button).

- [ ] **Step 1: Implement `openTextEditor`.**

Add:
```ts
    function openTextEditor(conflict: any) {
        if (textResolver) {
            textResolver.destroy();
            textResolver = null;
        }
        view.main.innerHTML = '';
        textResolver = new TextResolver(conflict, currentMergeObject);
        // the core's main is a plain element; shim a parent with .append for the
        // legacy panel (.element) and the raw iframe
        textResolver.appendToParent({
            append: (el: any) => view.main.appendChild(el instanceof HTMLElement ? el : el.element)
        });
        view.main.querySelector('iframe')?.classList.add('vc-merge-frame');

        textResolver.on('resolve', (id: string) => {
            const entry = (conflict.data ?? []).find((d: any) => d.id === id);
            if (entry) {
                entry.useMergedFile = true;
            }
            view.renderSidebar();
            updateReviewState();
        });
        textResolver.on('close', () => {
            if (textResolver) {
                textResolver.destroy();
                textResolver = null;
            }
            view.renderMain();
        });
    }
```

- [ ] **Step 2: Add the Open-editor button to `renderResolveFooter`.**

In `renderResolveFooter`, after appending the `Resolve` button to `actions` and before `footer.appendChild(actions)`, add:
```ts
        const hasFile = (conflict.data ?? []).some((d: any) => d.isTextualMerge || d.mergedFilePath);
        if (hasFile) {
            const openBtn = new Button({ text: 'Open editor', class: 'vc-merge-open' });
            openBtn.on('click', () => openTextEditor(conflict));
            actions.appendChild(openBtn.dom);
        }
```

- [ ] **Step 3: Type-check, lint, build.**

Run: `npm run type:check` → no errors.
Run: `npm run lint` → no new errors.
Run: `npm run build` → succeeds.

- [ ] **Step 4: Manual verification — file conflicts.**

Start a merge with a script-file conflict (text merge). Confirm the item's footer shows "Open editor"; clicking it mounts the code-merge editor in the detail pane with its `.textmerge-top` bar (MARK AS RESOLVED / USE ALL FROM… / REVERT / NEXT / PREV / VIEW ASSET CONFLICTS). Resolve the file (Mark as resolved) → returns to the list with the item's count incremented; "Use destination/source" still resolves the whole item including the file. In review mode the same file shows the read-only iframe (no edit buttons).

- [ ] **Step 5: Commit.**

```bash
git add src/editor/pickers/conflict-manager/picker-conflict-manager.ts
git commit -m "feat(version-control): open code-merge editor for file conflicts"
```

---

## Task 5: Styling — merge-specific SASS

Add the merge-only rules and migrate the `.textmerge-top` + iframe styles from the old block. Everything else reuses the `.vc-diff-*` styles.

**Files:**
- Create: `sass/editor/_editor-version-control-merge.scss`
- Modify: `sass/editor.scss` (add `@import`)

**Interfaces:**
- Consumes: classes emitted by Tasks 2-4 (`vc-merge-state`/`dot`/`count`, `vc-merge-resolve`, `vc-merge-choice`, `vc-merge-actions`, `vc-merge-primary`, `vc-merge-open`, `vc-merge-frame`, `.vc-diff-sidebar-foot`) and `.textmerge-top` (from `TextResolver`).
- The merge overlay carries `.vc-diff-overlay.vc-merge`; scope merge-only rules under it.

- [ ] **Step 1: Create `_editor-version-control-merge.scss`.**

```scss
@use 'sass:color';

// merge picker = diff-view core (.vc-diff-*) + per-item resolution chrome.
// reuses the diff picker's theme variables and placeholders.

.vc-diff-overlay.vc-merge {
    // sidebar footer holding the primary Review / Complete action
    .vc-diff-sidebar-foot {
        padding: 10px 12px;
        border-top: 1px solid $border-primary;
        background: $bcg-dark;

        .vc-merge-primary {
            width: 100%;
            justify-content: center;
        }
    }

    // resolution state dot + count on each sidebar row
    .vc-diff-row > .vc-merge-state {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        flex: none;

        > .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #ff8a8a; // unresolved
        }

        > .count {
            font-size: 11px;
            color: $text-dark;
        }

        &.resolved > .dot {
            background: #6fd088; // resolved
        }
    }

    // detail-pane resolution footer
    .vc-merge-resolve {
        margin-top: 14px;
        padding: 12px 0 4px;
        border-top: 1px solid $border-primary;

        .vc-merge-choice {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 5px 0;
            color: $text-primary;
            cursor: pointer;

            > input[type='radio'] {
                accent-color: $text-active;
                cursor: pointer;
            }
        }

        .vc-merge-actions {
            display: flex;
            gap: 8px;
            margin-top: 10px;

            .vc-merge-primary { min-width: 96px; }
        }
    }

    // interactive code-merge editor mounted in the detail pane
    .vc-merge-frame {
        width: 100%;
        height: 100%;
        min-height: 360px;
        border: 1px solid $border-primary;
        border-radius: 3px;
        background: $bcg-darkest;
    }

    // migrated from _editor-main.scss (old .picker-conflict-manager .textmerge-top)
    .textmerge-top {
        height: 36px;
        line-height: 36px;
        padding: 0 10px;

        > .content {
            > .ui-label.name {
                color: $text-primary;
                margin: 0;
                vertical-align: middle;
            }

            > .ui-button {
                font-size: 12px;
                float: right;
                margin: 0 0 0 15px;
                margin-top: 5px;

                &::before {
                    @extend .font-icon;

                    margin-right: 5px;
                    vertical-align: middle;
                    font-size: 16px;
                }

                &.mark-resolved {
                    background: color.adjust($text-active, $lightness: -7%);
                    color: $text-primary;

                    &::before { content: '\E133'; }

                    &:hover,
                    &:focus { background: color.adjust($text-active, $lightness: -12%); }
                }

                &.use-all::after {
                    @extend .font-icon;

                    margin-left: 5px;
                    vertical-align: middle;
                    font-size: 16px;
                    content: '\E159';
                }

                &.go-back::before { content: '\E158'; }

                &.go-to-prev::before { content: '\E162'; }

                &.go-to-next {
                    margin-left: 0;

                    &::after {
                        @extend .font-icon;

                        margin-left: 5px;
                        vertical-align: middle;
                        font-size: 16px;
                        content: '\E164';
                    }
                }
            }
        }
    }
}
```

- [ ] **Step 2: Import the partial in `sass/editor.scss`.**

After line 8 (`@import 'editor/editor-version-control-diff';`) add:
```scss
@import 'editor/editor-version-control-merge';
```

- [ ] **Step 3: Build (compiles SASS).**

Run: `npm run build`
Expected: build succeeds; no SASS errors (`$bcg-*`, `$text-*`, `$border-primary`, `.font-icon` resolve — they're in scope for the editor bundle, same as the diff partial).

- [ ] **Step 4: Manual verification — appearance.**

Re-run the Task 3 + Task 4 manual flows. Confirm: the resolution dot is red→green on resolve, `N/N` count is legible, the footer radios + Resolve/Open-editor buttons are themed and aligned, the sidebar Review/Complete button spans the footer, and the code-merge editor's `.textmerge-top` bar looks identical to before. The whole overlay visually matches the diff picker's chrome.

- [ ] **Step 5: Commit.**

```bash
git add sass/editor/_editor-version-control-merge.scss sass/editor.scss
git commit -m "feat(version-control): theme the GitHub-Desktop merge picker"
```

---

## Task 6: Delete legacy code & wire imports

Remove the retired files, the old SASS block, and update the side-effect imports. Final full verification.

**Files:**
- Delete: `src/editor/pickers/conflict-manager/ui/conflict-resolver.ts`, `conflict-section.ts`, `conflict-section-row.ts`, `conflict-field.ts`
- Delete: `src/editor/pickers/conflict-manager/picker-conflict-manager-asset.ts`, `picker-conflict-manager-scene.ts`, `picker-conflict-manager-settings.ts`
- Modify: `src/editor/index.ts` (L374-377)
- Modify: `sass/editor/_editor-main.scss` (delete L6515-7354)

- [ ] **Step 1: Update `src/editor/index.ts` imports.**

Replace the four lines (374-377):
```ts
import './pickers/conflict-manager/picker-conflict-manager-scene';
import './pickers/conflict-manager/picker-conflict-manager-settings';
import './pickers/conflict-manager/picker-conflict-manager-asset';
import './pickers/conflict-manager/picker-conflict-manager';
```
with:
```ts
import './pickers/conflict-manager/picker-conflict-manager';
```

- [ ] **Step 2: Confirm nothing else imports the doomed files, then delete them.**

Run: `grep -rn "conflict-resolver\|conflict-section\|conflict-field\|picker-conflict-manager-asset\|picker-conflict-manager-scene\|picker-conflict-manager-settings\|showAssetFieldConflicts\|showAssetFileConflicts\|showSceneConflicts\|showSettingsConflicts" src --include='*.ts'`
Expected: no matches **outside** the files being deleted. (If any appear elsewhere, stop and reconcile.)

Then (request user confirmation for deletes per the destructive-commands rule):
```bash
git rm src/editor/pickers/conflict-manager/ui/conflict-resolver.ts \
       src/editor/pickers/conflict-manager/ui/conflict-section.ts \
       src/editor/pickers/conflict-manager/ui/conflict-section-row.ts \
       src/editor/pickers/conflict-manager/ui/conflict-field.ts \
       src/editor/pickers/conflict-manager/picker-conflict-manager-asset.ts \
       src/editor/pickers/conflict-manager/picker-conflict-manager-scene.ts \
       src/editor/pickers/conflict-manager/picker-conflict-manager-settings.ts
```

- [ ] **Step 3: Delete the old SASS block.**

In `sass/editor/_editor-main.scss`, delete lines `6515-7354` inclusive — the entire `.ui-overlay.picker-conflict-manager { … }` rule (starts `6515`, closing brace `7354`). Verify the line *before* 6515 and *after* 7354 are unrelated rules and the file still has balanced braces.

- [ ] **Step 4: Type-check, lint, build.**

Run: `npm run type:check` → no errors (no dangling imports/refs).
Run: `npm run lint` → clean.
Run: `npm run build` → succeeds; SASS compiles with the old block gone.

- [ ] **Step 5: Full manual verification (acceptance).**

Against a real merge covering all types — material/asset field conflict, scene entity conflict, project-settings conflict (layers / batch groups / scripts), and a script-file conflict:
1. Two-pane layout matches the diff picker (header, sidebar, badges, tints).
2. Sidebar filter + type dropdown + resolution dots + `X/Y` work.
3. Use destination / Use source resolves an item; row flips to resolved.
4. Open editor resolves a file conflict line-by-line; returns correctly.
5. Review merge enables only when all resolved; review mode is read-only; Complete merge finalizes (browser refreshes).
6. Closing mid-merge prompts to stop the merge.
7. The diff picker (checkpoint diffs) still works unchanged.
8. **Type coverage check:** for each conflict type, confirm the detail preview renders the changed fields correctly (this validates the spec's assumption that the generic renderer covers scene hierarchy / settings / assets). If any type renders wrong, capture it — it is the only path that could require reviving type-specific logic.

- [ ] **Step 6: Commit.**

```bash
git add -A
git commit -m "chore(version-control): remove legacy conflict-manager UI and styles"
```

---

## Self-Review

**Spec coverage:**
- Per-item resolution → Task 3. ✓
- Compact read-only preview (reuse diff renderers) → core `renderUnifiedDiff` via the shared view (Tasks 1-2). ✓
- "Open editor" for file conflicts → Task 4. ✓
- Extract shared diff-view core → Task 1. ✓
- Full rebuild, both modes (`picker:conflictManager` + `picker:diffManager`), merge lifecycle → Task 2. ✓
- Drop legacy / delete files + SASS + imports → Task 6. ✓
- Styling match + migrate `.textmerge-top` → Task 5. ✓
- `picker:diffManager:closed` contract preserved → diff picker (Task 1 Step 4) + merge picker hide handler (Task 2). ✓
- Combined data+file items → Task 3 (whole-item resolve) + Task 4 (file-only via Open editor). ✓
- Verification (type/lint/build + manual; no unit tests) → every task. ✓

**Placeholder scan:** No TBD/TODO; every code step shows the actual code; deletions name exact paths/line ranges. ✓

**Type/name consistency:** `createVcDiffView`/`view` interface is used identically across Tasks 1-4; `decorateRow`/`renderDetailFooter`/`renderMeta`/`shouldRenderFrame` opt names match between the core (Task 1) and consumers (Tasks 1-2). `resolveItem(conflict, side)` with `side: 'source'|'destination'` is consistent (Tasks 3-4). `useSrc/useDst/useMergedFile`/`id`/`isTextualMerge`/`mergedFilePath` match the data model read in `conflict-resolver.ts`/`picker-version-control-diff.ts`. ✓

**Known risk surfaced for the implementer:** Task 6 Step 5.8 explicitly validates the generic renderer against every conflict type before the deletions are trusted — the one place the "delete type-specific handlers" decision could bite.

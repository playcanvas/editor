# Version Control Diff Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** GitHub-Desktop-style full-diff picker that renders scene/settings property changes as cropped, read-only inspector panels (unified `−`/`+` rows) using real PCUI components, replacing the legacy conflict-manager view for diff viewing.

**Architecture:** Evolve the untracked skeleton `src/editor/pickers/version-control/picker-version-control-diff.ts` (overlay + sidebar + main). A new pure module classifies values and resolves reference names from the diff payload; a DOM module maps value kinds to read-only PCUI widgets; the picker groups changed fields into pcui `Panel` sections with `TreeView` entity breadcrumbs. Two wiring edits route all diff entry points to the new picker.

**Tech Stack:** TypeScript, `@playcanvas/pcui` (TreeView, Panel, BooleanInput, NumericInput, TextInput, TextAreaInput, VectorInput, ColorPicker), editor-local `CurveInput`/`GradientInput`, SASS, Mocha+Chai.

**Spec:** `docs/superpowers/specs/2026-06-11-vc-diff-picker-design.md` — read it before starting.

**Important context for the implementer:**
- Diff payload shape (`src/editor-api/models.ts`): `diff.conflicts[]` each with `itemType` (`scene`|`settings`|asset types), `itemName`, `itemId`, `assetType`, and `data[]` entries: `{ path, srcValue, dstValue, srcType, dstType, type, missingInSrc, missingInDst, isTextualMerge, mergedFilePath, id }`. `srcValue` is the **newer** state (`+` row), `dstValue` the checkpoint (`−` row). `diff.srcCheckpoint`/`dstCheckpoint` carry name maps: `assets: Record<id, name>`, `scenes: Record<sceneId, Record<entityGuid, entityName>>`, `settings: Record<string, any>`.
- Repo style rules (user CLAUDE.md): no explicit return types, short names, no try/catch (promise `.catch` is fine), lowercase comments only where non-obvious, constants hoisted to top of file.
- Run a single test file: `npx mocha test/common/<name>.test.ts` (mocha is configured with the ts-node ESM loader via `.mocharc.json`).

---

### Task 1: Pure data module — value kinds + name index

**Files:**
- Create: `src/editor/pickers/version-control/vc-diff-data.ts`
- Test: `test/common/vc-diff-data.test.ts`

This module must have **zero imports** (no pcui, no DOM) so it runs under plain mocha.

- [ ] **Step 1: Write the failing test**

Create `test/common/vc-diff-data.test.ts`:

```ts
import { expect } from 'chai';
import { describe, it } from 'mocha';

import { buildNameIndex, valueKind } from '../../src/editor/pickers/version-control/vc-diff-data';

describe('buildNameIndex', () => {
    it('collects asset, entity, layer and batch group names from both checkpoints', () => {
        const index = buildNameIndex({
            srcCheckpoint: {
                assets: { '10': 'brick.png' },
                scenes: { '1': { 'guid-a': 'Root' } },
                settings: { layers: { '5': 'World' }, batchGroups: { '7': { name: 'UI Batch' } } }
            },
            dstCheckpoint: {
                assets: { '11': 'old.png' },
                scenes: { '2': { 'guid-b': 'Camera' } },
                settings: {}
            }
        });
        expect(index.asset.get('10')).to.equal('brick.png');
        expect(index.asset.get('11')).to.equal('old.png');
        expect(index.entity.get('guid-a')).to.equal('Root');
        expect(index.entity.get('guid-b')).to.equal('Camera');
        expect(index.layer.get('5')).to.equal('World');
        expect(index.batchGroup.get('7')).to.equal('UI Batch');
    });

    it('prefers src names over dst names for the same id', () => {
        const index = buildNameIndex({
            srcCheckpoint: { assets: { '10': 'renamed.png' }, scenes: {}, settings: {} },
            dstCheckpoint: { assets: { '10': 'original.png' }, scenes: {}, settings: {} }
        });
        expect(index.asset.get('10')).to.equal('renamed.png');
    });

    it('tolerates missing checkpoints', () => {
        const index = buildNameIndex({});
        expect(index.asset.size).to.equal(0);
        expect(index.entity.size).to.equal(0);
    });
});

describe('valueKind', () => {
    it('classifies missing values', () => {
        expect(valueKind('', 'a.b', undefined)).to.equal('missing');
        expect(valueKind('', 'a.b', null)).to.equal('missing');
    });

    it('classifies primitives', () => {
        expect(valueKind('', 'enabled', true)).to.equal('boolean');
        expect(valueKind('', 'intensity', 2.5)).to.equal('number');
        expect(valueKind('', 'name', 'Spot Light')).to.equal('string');
    });

    it('classifies reference types from the merge api', () => {
        expect(valueKind('asset', 'cookie', 42)).to.equal('asset');
        expect(valueKind('entity', 'target', 'guid-a')).to.equal('entity');
        expect(valueKind('layer', 'layers.0', 5)).to.equal('layer');
        expect(valueKind('batchGroup', 'group', 7)).to.equal('batchGroup');
        expect(valueKind('array:asset', 'textures', [1, 2])).to.equal('array:asset');
        expect(valueKind('array:sublayer', 'sublayers', [])).to.equal('array:sublayer');
    });

    it('classifies colors by type and by path heuristic', () => {
        expect(valueKind('rgb', 'color', [1, 0, 0])).to.equal('color');
        expect(valueKind('rgba', 'color', [1, 0, 0, 1])).to.equal('color');
        expect(valueKind('', 'diffuseTint', [0.5, 0.5, 0.5])).to.equal('color');
    });

    it('classifies vectors as numeric arrays of 2-4 without a color-ish path', () => {
        expect(valueKind('vec3', 'velocity', [0, 3, 0])).to.equal('vector');
        expect(valueKind('', 'offset', [1, 2])).to.equal('vector');
    });

    it('classifies curves and gradients', () => {
        const curve = { keys: [0, 1, 0.5, 2] };
        const colorSet = { keys: [[0, 0], [0, 0.5], [0, 1]] };
        expect(valueKind('curve', 'scaleGraph', curve)).to.equal('curve');
        expect(valueKind('curveset', 'scaleGraph2', { keys: [[0, 1], [0, 2]] })).to.equal('curve');
        expect(valueKind('curveset', 'colorGraph', colorSet)).to.equal('gradient');
        // array-of-curves shape
        expect(valueKind('curveset', 'colorGraph', [{ keys: [0, 0] }, { keys: [0, 0] }, { keys: [0, 1] }])).to.equal('gradient');
    });

    it('falls back to json for objects and object kind for unrenderable type', () => {
        expect(valueKind('', 'data', { foo: 1 })).to.equal('json');
        expect(valueKind('object', 'data', { foo: 1 })).to.equal('object');
    });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx mocha test/common/vc-diff-data.test.ts`
Expected: FAIL — cannot find module `vc-diff-data`.

- [ ] **Step 3: Write the implementation**

Create `src/editor/pickers/version-control/vc-diff-data.ts`:

```ts
const REF_KINDS = new Set(['asset', 'entity', 'layer', 'batchGroup', 'sublayer']);
const COLORISH = /color|tint|gradient/i;

export type NameIndex = {
    asset: Map<string, string>;
    entity: Map<string, string>;
    layer: Map<string, string>;
    batchGroup: Map<string, string>;
};

export type ValueKind = 'missing' | 'boolean' | 'number' | 'string' | 'vector' | 'color' | 'curve' | 'gradient' |
    'asset' | 'entity' | 'layer' | 'batchGroup' | 'sublayer' | 'json' | 'object' | `array:${string}`;

const settingName = (v: unknown) => {
    if (typeof v === 'string') {
        return v;
    }
    const name = (v as { name?: unknown })?.name;
    return typeof name === 'string' ? name : undefined;
};

// src (working state) wins over dst (checkpoint) for renamed items
export const buildNameIndex = (diff: any): NameIndex => {
    const index: NameIndex = { asset: new Map(), entity: new Map(), layer: new Map(), batchGroup: new Map() };
    for (const side of [diff?.dstCheckpoint, diff?.srcCheckpoint]) {
        if (!side) {
            continue;
        }
        for (const [id, name] of Object.entries(side.assets ?? {})) {
            if (typeof name === 'string') {
                index.asset.set(id, name);
            }
        }
        for (const scene of Object.values(side.scenes ?? {})) {
            for (const [guid, name] of Object.entries(scene ?? {})) {
                if (typeof name === 'string') {
                    index.entity.set(guid, name);
                }
            }
        }
        for (const [id, v] of Object.entries(side.settings?.layers ?? {})) {
            const name = settingName(v);
            if (name) {
                index.layer.set(id, name);
            }
        }
        for (const [id, v] of Object.entries(side.settings?.batchGroups ?? {})) {
            const name = settingName(v);
            if (name) {
                index.batchGroup.set(id, name);
            }
        }
    }
    return index;
};

const numArray = (value: unknown, min: number, max: number) => {
    return Array.isArray(value) && value.length >= min && value.length <= max && value.every(v => typeof v === 'number');
};

// channel count for curve/curveset values; 0 when not curve-shaped
const curveChannels = (value: any) => {
    if (Array.isArray(value) && value[0]?.keys) {
        return value.length;
    }
    if (Array.isArray(value?.keys)) {
        return Array.isArray(value.keys[0]) ? value.keys.length : 1;
    }
    return 0;
};

export const valueKind = (type: string, path: string, value: unknown): ValueKind => {
    if (value === undefined || value === null) {
        return 'missing';
    }
    if (type?.startsWith('array:')) {
        return type as ValueKind;
    }
    if (REF_KINDS.has(type)) {
        return type as ValueKind;
    }
    if (type === 'object') {
        return 'object';
    }
    if (typeof value === 'boolean') {
        return 'boolean';
    }
    const channels = curveChannels(value);
    if (channels > 1 || type === 'curveset') {
        return COLORISH.test(path) && channels >= 3 && channels <= 4 ? 'gradient' : 'curve';
    }
    if (channels === 1 || type === 'curve') {
        return 'curve';
    }
    if (type === 'rgb' || type === 'rgba' || (COLORISH.test(path) && numArray(value, 3, 4))) {
        return 'color';
    }
    if (numArray(value, 2, 4)) {
        return 'vector';
    }
    if (typeof value === 'number') {
        return 'number';
    }
    if (typeof value === 'string') {
        return 'string';
    }
    return 'json';
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx mocha test/common/vc-diff-data.test.ts`
Expected: PASS (all tests green).

- [ ] **Step 5: Lint the new files**

Run: `npx eslint src/editor/pickers/version-control/vc-diff-data.ts test/common/vc-diff-data.test.ts`
Expected: no errors. Fix any reported style issues (the repo's ESLint config is strict about spacing and quotes).

- [ ] **Step 6: Commit**

```bash
git add src/editor/pickers/version-control/vc-diff-data.ts test/common/vc-diff-data.test.ts
git commit -m "feat: value-kind classifier and checkpoint name index for vc diff"
```

---

### Task 2: Widget factory — value kind → read-only PCUI widget

**Files:**
- Create: `src/editor/pickers/version-control/vc-diff-fields.ts`

DOM/PCUI code — no unit tests (the mocha setup has no DOM); verified by type-check here and manual smoke in Task 6.

- [ ] **Step 1: Write the module**

Create `src/editor/pickers/version-control/vc-diff-fields.ts`:

```ts
import { BooleanInput, NumericInput, TextAreaInput, TextInput, VectorInput, ColorPicker } from '@playcanvas/pcui';

import { CurveInput } from '@/common/pcui/element/element-curve-input';
import { GradientInput } from '@/common/pcui/element/element-gradient-input';

import { valueKind, type NameIndex, type ValueKind } from './vc-diff-data';

const AXES = ['X', 'Y', 'Z', 'W'];
const REF_LIKE = new Set<ValueKind>(['asset', 'entity', 'layer', 'batchGroup', 'sublayer']);
const JSON_FIELD_HEIGHT = 100;

const el = (cls: string, text = '') => {
    const span = document.createElement('span');
    span.className = cls;
    if (text) {
        span.textContent = text;
    }
    return span;
};

const missingEl = (text: string) => el('vc-diff-missing', text);

const chip = (kind: string, id: unknown, name?: string) => {
    const c = el('vc-diff-chip');
    if (!name) {
        c.classList.add('missing');
    }
    c.appendChild(el('tag', kind === 'batchGroup' ? 'batch group' : kind));
    c.appendChild(el('name', name ?? `${id}`));
    c.title = `${id}`;
    return c;
};

const sublayerEl = (value: any, index: NameIndex) => {
    const name = index.layer.get(`${value?.layer}`) ?? `${value?.layer}`;
    return el('vc-diff-sublayer', `${name} · ${value?.transparent ? 'Transparent' : 'Opaque'}`);
};

const pcuiDom = (widget: { dom: HTMLElement }) => {
    widget.dom.classList.add('vc-diff-widget');
    return widget.dom;
};

const curveField = (value: any) => {
    const curve = new CurveInput({ readOnly: true });
    curve.value = Array.isArray(value) ? value : [value];
    return pcuiDom(curve);
};

export const createValueField = (kind: ValueKind, value: any, index: NameIndex): HTMLElement => {
    switch (kind) {
        case 'missing':
            return missingEl(value === null ? 'null' : 'not present');
        case 'boolean':
            return pcuiDom(new BooleanInput({ value, readOnly: true }));
        case 'number':
            return pcuiDom(new NumericInput({ value, readOnly: true }));
        case 'string': {
            if (value === '') {
                const empty = missingEl('""');
                empty.title = 'empty string';
                return empty;
            }
            return pcuiDom(new TextInput({ value, readOnly: true }));
        }
        case 'vector':
            return pcuiDom(new VectorInput({ value, dimensions: value.length, placeholder: AXES.slice(0, value.length), readOnly: true }));
        case 'color':
            return pcuiDom(new ColorPicker({ value, channels: value.length, readOnly: true }));
        case 'curve':
            return curveField(value);
        case 'gradient': {
            if (!Array.isArray(value?.keys)) {
                return curveField(value);
            }
            const gradient = new GradientInput({ value, channels: value.keys.length });
            (gradient as any).readOnly = true;
            return pcuiDom(gradient);
        }
        case 'asset':
            return chip('asset', value, index.asset.get(`${value}`));
        case 'entity':
            return chip('entity', value, index.entity.get(`${value}`));
        case 'layer':
            return chip('layer', value, index.layer.get(`${value}`));
        case 'batchGroup':
            return chip('batchGroup', value, index.batchGroup.get(`${value}`));
        case 'sublayer':
            return sublayerEl(value, index);
        case 'object':
            return missingEl('no preview available');
        case 'json': {
            // height cap keeps huge blobs from dominating the panel; the textarea scrolls
            const area = new TextAreaInput({ value: JSON.stringify(value, null, 2), readOnly: true, height: JSON_FIELD_HEIGHT });
            return pcuiDom(area);
        }
        default: {
            // array:<type> — render each element through the element renderer
            const inner = kind.substring('array:'.length) as ValueKind;
            const list = document.createElement('div');
            list.className = 'vc-diff-array';
            const items = Array.isArray(value) ? value : [value];
            list.appendChild(el('size', `${items.length} item${items.length === 1 ? '' : 's'}`));
            for (const item of items) {
                const itemKind = item === undefined || item === null ? 'missing' :
                    REF_LIKE.has(inner) ? inner : valueKind(inner, '', item);
                list.appendChild(createValueField(itemKind, item, index));
            }
            return list;
        }
    }
};
```

- [ ] **Step 2: Type-check and lint**

Run: `npm run type:check`
Expected: no errors. If `GradientInput`'s constructor args reject `value`/`channels`, check `src/common/pcui/element/element-gradient-input.ts` — `GradientInputArgs` accepts `{ channels?, value?, renderChanges? }`.

Run: `npx eslint src/editor/pickers/version-control/vc-diff-fields.ts`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/editor/pickers/version-control/vc-diff-fields.ts
git commit -m "feat: read-only pcui widget factory for vc diff values"
```

---

### Task 3: Unified inspector rendering in the picker

**Files:**
- Modify: `src/editor/pickers/version-control/picker-version-control-diff.ts`

Replace the Before/After two-side rendering with unified sections. The shell, sidebar, header, iframe, line-count, and lifecycle code stay exactly as they are.

- [ ] **Step 1: Update imports and module state**

At the top of `picker-version-control-diff.ts`, replace:

```ts
import { Button, Container, Overlay } from '@playcanvas/pcui';
```

with:

```ts
import { Button, Container, Overlay, Panel, TreeView, TreeViewItem } from '@playcanvas/pcui';
```

and add below the existing `./vc-helpers` import:

```ts
import { buildNameIndex, valueKind, type NameIndex } from './vc-diff-data';
import { createValueField, destroyValueFields } from './vc-diff-fields';
```

Inside the `editor.once('load', ...)` body, next to `let current: any = null;`, add:

```ts
let nameIndex: NameIndex = null;
```

In the `picker:versioncontrol:diffPicker` method, after `current = diff;`, add:

```ts
nameIndex = buildNameIndex(current ?? {});
```

In the overlay `hide` handler, next to `current = null;`, add:

```ts
nameIndex = null;
```

- [ ] **Step 2: Delete the superseded renderers**

Delete these functions from the file (they are fully replaced in the next step):
`fmtVal`, `num`, `looksColor`, `looksCurve`, `renderMissing`, `renderBool`, `renderColor`, `renderVector`, `curveSets`, `renderCurve`, `renderJson`, `renderValue`, `renderSideValue`, `renderInspectorSide`, `renderPropertyDiff`, `appendEntityTree`, `appendInspectorContext`, `sectionTitle`.

Keep: `sectionComponent`, `inspectorInfo` (modified next step), `typeFor`, `statusFor`, `textEntry`, `propertyEntries`, and everything else.

- [ ] **Step 3: Adjust `inspectorInfo` (drop the removed `sectionTitle` helper)**

`inspectorInfo` currently calls `sectionTitle(...)` to uppercase section names; pcui `Panel` header text is styled by CSS instead. In `inspectorInfo`, replace both `section: sectionTitle(...)` call sites with the raw text:

In the no-path branch:

```ts
            section: typeLabel(conflict.itemType ?? 'item'),
```

In the return at the end:

```ts
            section,
```

(uppercase styling moves to `text-transform: uppercase` in the new SCSS partial — Task 4).

- [ ] **Step 4: Add the unified rendering functions**

Add the following after `inspectorInfo` (constants go to the top of the file with the other hoisted values):

```ts
const SUB_RE = /^(Script|Sound slot|Clip): (.+)$/;
const SETTINGS_ROOT_RE = /^(scene |project )?settings$/i;
```

```ts
    // section routing for one entry: which panel, which sub-panel, which label
    const sectionParts = (conflict: any, entry: any) => {
        const info = inspectorInfo(conflict, entry);
        const isSettings = conflict.itemType === 'settings' ||
            (conflict.itemType === 'scene' && splitDiffPath(entry.path ?? '')[0] === 'settings');
        if (isSettings) {
            const sub = SETTINGS_ROOT_RE.test(info.section) ? '' : info.section;
            return { entity: null, panel: 'Settings', icon: '', sub, field: info.field, title: info.title };
        }
        const subMatch = info.context[0]?.text.match(SUB_RE);
        // the inspector shows raw (unprettified) script attribute names
        const field = subMatch?.[1] === 'Script' ? (splitDiffPath(entry.path ?? '').pop() ?? info.field) : info.field;
        return {
            entity: info.entityContext[0] ?? null,
            panel: info.section,
            icon: info.type,
            sub: subMatch?.[2] ?? '',
            field,
            title: info.title
        };
    };

    // entity breadcrumb as a real (inert) pcui treeview, like the hierarchy panel
    const entityTree = (label: { text: string; title?: string }, compType: string) => {
        const parts = label.text.replace(/^Entity:\s*/, '').split('/').filter(Boolean);
        const tree = new TreeView({ allowDrag: false, allowReordering: false });
        tree.class.add('vc-diff-entity-tree', 'entities-treeview');
        let parent: TreeView | TreeViewItem = tree;
        parts.forEach((name, i) => {
            const leaf = i === parts.length - 1;
            const item = new TreeViewItem({ text: name, allowDrag: false, allowSelect: false, open: !leaf });
            item.iconLabel.class.add('component-icon-postfix');
            if (leaf) {
                if (compType) {
                    item.iconLabel.class.add(`type-${compType}`);
                }
                item.dom.querySelector('.pcui-treeview-item-contents')?.classList.add('pcui-treeview-item-selected');
            }
            parent.append(item);
            parent = item;
        });
        tree.dom.title = label.title ?? label.text;
        return tree;
    };

    // note: NOT 'vc-diff-row' — that class belongs to the sidebar buttons and their click delegation
    const fieldRow = (kind: 'del' | 'add', label: string, title: string, valueEl: HTMLElement) => {
        const row = document.createElement('div');
        row.classList.add('vc-diff-field-row', kind);
        row.title = title;
        const gut = document.createElement('span');
        gut.classList.add('gutter');
        gut.textContent = kind === 'del' ? '−' : '+';
        row.appendChild(gut);
        const lbl = document.createElement('span');
        lbl.classList.add('label');
        lbl.textContent = label;
        row.appendChild(lbl);
        const val = document.createElement('span');
        val.classList.add('value');
        val.appendChild(valueEl);
        row.appendChild(val);
        return row;
    };

    const sideField = (entry: any, side: 'src' | 'dst') => {
        const value = side === 'src' ? entry.srcValue : entry.dstValue;
        const missing = side === 'src' ? entry.missingInSrc : entry.missingInDst;
        const kind = missing ? 'missing' : valueKind(typeFor(entry, side), entry.path ?? '', value);
        return createValueField(kind, value, nameIndex);
    };

    // banner for whole-item adds/deletes (entries without a path)
    const wholeBanner = (conflict: any, entry: any) => {
        const banner = document.createElement('div');
        banner.classList.add('vc-diff-banner');
        const status = entry.missingInDst ? 'added' : entry.missingInSrc ? 'deleted' : 'modified';
        appendBadge(banner, status);
        const text = document.createElement('span');
        text.textContent = `This ${conflict.assetType ?? conflict.itemType ?? 'item'} was ${status} since the checkpoint`;
        banner.appendChild(text);
        return banner;
    };

    const renderUnifiedDiff = (conflict: any, entries: any[]) => {
        const wrap = document.createElement('div');
        wrap.classList.add('vc-diff-inspector');

        let section: { key: string; panel: Panel; subs: Map<string, Panel> } = null;
        const hostDom = (parts: { sub: string }) => {
            if (!parts.sub) {
                return section.panel.content.dom;
            }
            if (!section.subs.has(parts.sub)) {
                const sub = new Panel({ collapsible: true, headerText: parts.sub });
                sub.class.add('vc-diff-subpanel');
                // script/slot/clip sub-panels are inset like the inspector's;
                // settings group sub-panels are flush like the settings panel's
                if (parts.panel !== 'Settings') {
                    sub.class.add('inset');
                }
                section.panel.append(sub);
                section.subs.set(parts.sub, sub);
            }
            return section.subs.get(parts.sub)!.content.dom;
        };

        for (const entry of entries) {
            const parts = sectionParts(conflict, entry);
            const key = JSON.stringify([parts.entity?.text ?? '', parts.panel]);
            if (section?.key !== key) {
                const card = document.createElement('div');
                card.classList.add('vc-diff-section');
                if (parts.entity) {
                    card.appendChild(entityTree(parts.entity, parts.icon).dom);
                }
                const panel = new Panel({ collapsible: true, headerText: parts.panel });
                panel.class.add('vc-diff-panel');
                if (parts.icon) {
                    const icon = document.createElement('span');
                    icon.classList.add('component-icon', `type-${parts.icon}`);
                    panel.header.dom.insertBefore(icon, panel.header.dom.querySelector('.pcui-panel-header-title'));
                }
                card.appendChild(panel.dom);
                wrap.appendChild(card);
                section = { key, panel, subs: new Map() };
            }
            const host = hostDom(parts);
            if (!entry.path) {
                host.appendChild(wholeBanner(conflict, entry));
                continue;
            }
            if (!entry.missingInDst) {
                host.appendChild(fieldRow('del', parts.field, parts.title, sideField(entry, 'dst')));
            }
            if (!entry.missingInSrc) {
                host.appendChild(fieldRow('add', parts.field, parts.title, sideField(entry, 'src')));
            }
        }

        if (!entries.length) {
            const empty = document.createElement('div');
            empty.classList.add('vc-diff-empty');
            empty.textContent = 'No property changes';
            wrap.appendChild(empty);
        }
        return wrap;
    };
```

- [ ] **Step 5: Rewire `renderMain` and teardown**

In `renderMain`, replace the line:

```ts
        if (props.length) {
            detail.appendChild(renderPropertyDiff(conflict, props));
        }
```

with:

```ts
        if (props.length) {
            detail.appendChild(renderUnifiedDiff(conflict, props));
        }
```

Curve/gradient widgets hold resize timers that only `.destroy()` clears, so every `main.innerHTML = ''` must be preceded by a destroy pass. At the top of `renderMain`, change:

```ts
        main.innerHTML = '';
```

to:

```ts
        destroyValueFields(main);
        main.innerHTML = '';
```

and in `cleanup()`, change `main.innerHTML = '';` the same way:

```ts
        destroyValueFields(main);
        main.innerHTML = '';
```

- [ ] **Step 6: Type-check and lint**

Run: `npm run type:check`
Expected: no errors. Common issues: `Panel.content`/`Panel.header` are public on pcui `Panel`; `TreeViewItem.iconLabel` is public (the hierarchy uses it at `src/editor/entities/entities-treeview.ts:689`).

Run: `npx eslint src/editor/pickers/version-control/picker-version-control-diff.ts`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/editor/pickers/version-control/picker-version-control-diff.ts
git commit -m "feat: unified inspector-style diff rendering with read-only pcui widgets"
```

---

### Task 4: SCSS — badge hoist + diff partial

**Files:**
- Modify: `sass/editor/_editor-version-control-picker.scss` (hoist `%vc-badge`)
- Create: `sass/editor/_editor-version-control-diff.scss`
- Modify: `sass/editor.scss:7` (add import after `editor-version-control-picker`)

- [ ] **Step 1: Hoist `%vc-badge` to file scope**

In `sass/editor/_editor-version-control-picker.scss`, the `%vc-badge` placeholder (around line 557) is nested inside `.pcui-container.picker-vc { ... }`, so the new overlay partial cannot extend it. Cut the entire block:

```scss
    %vc-badge {
        flex: none;
        height: 18px;
        padding: 0 6px;
        border: 1px solid $border-primary;
        border-radius: 4px;
        background-color: rgb(0 0 0 / 14%);
        color: $text-dark;
        font-size: 11px;
        line-height: 18px;
        letter-spacing: 0;
        text-transform: uppercase;

        &.added {
            color: #6fd088;
            border-color: rgb(111 208 136 / 45%);
        }

        &.modified {
            color: #f3c16f;
            border-color: rgb(225 166 62 / 45%);
        }

        &.deleted {
            color: #ff8a8a;
            border-color: rgb(255 138 138 / 45%);
        }
    }
```

and paste it at file scope, directly above the `.pcui-container.picker-vc {` opening line (dedent by one level). All existing `@extend %vc-badge;` usages inside the picker keep working — extending a root-level placeholder from a nested selector is fine; the reverse was the problem.

- [ ] **Step 2: Verify the picker styles are unchanged**

Run: `npm run lint`
Expected: stylelint passes. (If stylelint complains about placeholder position, place it after the `@use` line at the very top of the file.)

- [ ] **Step 3: Create the diff partial**

Create `sass/editor/_editor-version-control-diff.scss`:

```scss
// version control full-diff overlay (github desktop style)

$vc-del-tint: rgb(248 81 73 / 15%);
$vc-del-edge: #f85149;
$vc-add-tint: rgb(63 185 80 / 15%);
$vc-add-edge: #3fb950;

.vc-diff-overlay {
    > .pcui-overlay-content {
        position: absolute;
        inset: 0;
        display: flex;
    }
}

.vc-diff-shell {
    flex: 1;
    flex-direction: column;
    min-width: 0;
    background-color: $bcg-darkest;
}

.vc-diff-top {
    display: flex;
    flex: none;
    align-items: center;
    gap: 12px;
    padding: 0 16px;
    height: 48px;
    background-color: $bcg-dark;
    border-bottom: 1px solid $border-primary;

    > .vc-diff-title {
        @extend .font-bold;

        color: $text-primary;
        font-size: 14px;
    }

    > .vc-diff-meta {
        color: $text-dark;
        font-size: 11px;
    }

    > .vc-diff-close {
        margin-left: auto;
    }
}

.vc-diff-body {
    display: flex;
    flex: 1;
    min-height: 0;
}

// ---- sidebar ----
.vc-diff-sidebar {
    flex: none;
    width: 280px;
    overflow-y: auto;
    background-color: $bcg-darker;
    border-right: 1px solid $border-primary;

    > .vc-diff-sidebar-head {
        @extend .font-bold;

        padding: 10px 12px;
        color: $text-primary;
        font-size: 12px;
        border-bottom: 1px solid $border-primary;
    }

    > .vc-diff-group {
        padding: 8px 12px 4px;
        color: $text-dark;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    > .vc-diff-row {
        appearance: none;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 4px 8px;
        width: 100%;
        margin: 0;
        padding: 7px 12px;
        border: none;
        border-bottom: 1px solid $border-primary;
        background: transparent;
        color: $text-primary;
        font-size: 12px;
        text-align: left;
        cursor: pointer;
        transition: background-color 100ms ease;

        &:hover {
            background-color: #354144;
        }

        &.selected {
            background-color: #354144;
            box-shadow: inset 2px 0 0 $text-active;
        }

        > .name {
            flex: 1;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        > .sub {
            width: 100%;
            order: 3;
            color: $text-dark;
            font-size: 10px;
        }

        > .counts {
            order: 4;
            font-size: 10px;
        }

        > .status {
            @extend %vc-badge;

            margin-left: auto;
        }
    }
}

.vc-diff-stats {
    > .new {
        color: #6fd088;
    }

    > .old {
        color: #ff8a8a;
    }
}

.vc-diff-property-count {
    color: $text-dark;
}

// ---- main ----
.vc-diff-main {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
}

.vc-diff-detail-head {
    display: flex;
    flex: none;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    background-color: $bcg-dark;
    border-bottom: 1px solid $border-primary;

    > .name {
        @extend .font-bold;

        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: $text-primary;
    }

    > .status {
        @extend %vc-badge;
    }

    > .stats {
        margin-left: auto;
        font-size: 11px;
        color: $text-dark;
    }
}

.vc-diff-detail {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 12px 16px;

    &.has-frame {
        display: flex;
        flex-direction: column;
    }
}

.vc-diff-empty {
    padding: 24px;
    color: $text-dark;
    text-align: center;
}

// ---- inspector sections ----
.vc-diff-inspector {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.vc-diff-section {
    > .vc-diff-entity-tree {
        margin-bottom: 6px;
        pointer-events: none;
    }
}

.vc-diff-panel {
    border-radius: 3px;
    overflow: hidden;

    > .pcui-panel-header > .pcui-panel-header-title {
        text-transform: uppercase;
    }

    // settings group sub-panels sit flush inside SETTINGS (like the real settings panel);
    // script/slot/clip sub-panels are inset like the inspector's per-script panels
    .vc-diff-subpanel.inset {
        margin: 6px;
    }
}

.vc-diff-banner {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    color: $text-secondary;

    > .status {
        @extend %vc-badge;
    }
}

// ---- unified diff rows ----
.vc-diff-field-row {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 32px;
    padding: 3px 10px 3px 6px;

    > .gutter {
        flex: none;
        width: 14px;
        text-align: center;
        font-family: inconsolatamedium, Monaco, Menlo, monospace;
    }

    > .label {
        flex: none;
        width: 35%;
        max-width: 220px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: $text-secondary;
    }

    > .value {
        display: flex;
        flex: 1;
        align-items: center;
        min-width: 0;
        // read-only widgets stay inert
        pointer-events: none;

        // text values stay selectable; the inputs are readOnly so this is safe
        input,
        textarea {
            pointer-events: auto;
        }

        // pcui inputs carry 6px margins; rows provide their own spacing
        .pcui-element {
            margin: 0;
        }
    }

    &.del {
        background-color: $vc-del-tint;
        box-shadow: inset 2px 0 0 $vc-del-edge;

        > .gutter {
            color: #ff8a8a;
        }
    }

    &.add {
        background-color: $vc-add-tint;
        box-shadow: inset 2px 0 0 $vc-add-edge;

        > .gutter {
            color: #6fd088;
        }
    }
}

// ---- value widgets ----
.vc-diff-widget {
    flex: 1;
    min-width: 0;

    &.pcui-boolean-input,
    &.pcui-color-input {
        flex: none;
    }
}

.vc-diff-missing {
    color: $text-darkest;
    font-style: italic;
}

.vc-diff-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 24px;
    padding: 0 7px;
    background-color: $bcg-dark;
    border: 1px solid $bcg-darker;
    border-radius: 2px;
    color: $text-secondary;

    > .tag {
        color: $text-darkest;
        font-size: 10px;
        text-transform: uppercase;
    }

    &.missing > .name {
        color: $text-darkest;
        font-style: italic;
    }
}

.vc-diff-sublayer {
    color: $text-secondary;
}

.vc-diff-array {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 4px;
    min-width: 0;

    > .size {
        color: $text-dark;
        font-size: 10px;
    }
}

// ---- text diff iframe (existing behaviour) ----
.vc-diff-frame-wrap {
    position: relative;
    flex: 1;
    min-height: 320px;
    margin-top: 12px;
}

.vc-diff-loading {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $text-dark;
}

.vc-diff-frame {
    position: relative;
    width: 100%;
    height: 100%;
    border: 1px solid $border-primary;
    border-radius: 3px;
    background-color: $bcg-darkest;
}
```

**Naming note:** the sidebar keeps `.vc-diff-row` (skeleton's `renderSidebar` + click delegation reference it); the unified field rows use `.vc-diff-field-row`. Don't rename either side.

- [ ] **Step 4: Import the partial**

In `sass/editor.scss`, after the line `@import 'editor/editor-version-control-picker';`, add:

```scss
@import 'editor/editor-version-control-diff';
```

- [ ] **Step 5: Lint and build the styles**

Run: `npm run lint`
Expected: stylelint + eslint pass. Fix ordering/nesting complaints per stylelint's messages (this repo enforces property order).

Run: `node compile-sass.mjs` (or `npm run build` if sass compilation is only wired through the full build)
Expected: compiles without "undefined variable/placeholder" errors — that would mean the `%vc-badge` hoist or import order is wrong.

- [ ] **Step 6: Commit**

```bash
git add sass/editor/_editor-version-control-picker.scss sass/editor/_editor-version-control-diff.scss sass/editor.scss
git commit -m "style: version control diff overlay styles, hoist vc badge placeholder"
```

---

### Task 5: Wiring — make the picker live

**Files:**
- Modify: `src/editor/index.ts:356` (side-effect import)
- Modify: `src/editor/pickers/version-control/picker-version-control.ts:282` (`presentDiff`)

- [ ] **Step 1: Register the module**

In `src/editor/index.ts`, after the line:

```ts
import './pickers/version-control/picker-version-control';
```

add:

```ts
import './pickers/version-control/picker-version-control-diff';
```

- [ ] **Step 2: Route diffs to the new picker**

In `src/editor/pickers/version-control/picker-version-control.ts`, inside `presentDiff` (line ~282), replace:

```ts
            editor.call('picker:diffManager', diff);
```

with:

```ts
            editor.call('picker:versioncontrol:diffPicker', diff);
```

Do **not** touch any other `picker:diffManager` call site — the conflict manager still owns merge-conflict resolution.

- [ ] **Step 3: Type-check**

Run: `npm run type:check`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/editor/index.ts src/editor/pickers/version-control/picker-version-control.ts
git commit -m "feat: route version control diffs to the new diff picker"
```

---

### Task 6: Full verification

**Files:** none new — fixes only if checks fail.

- [ ] **Step 1: Run the full check suite**

```bash
npm test && npm run lint && npm run type:check && npm run build
```

Expected: all pass. `npm run build` catches rollup/import issues the type-checker misses (e.g. the side-effect import path).

- [ ] **Step 2: Manual smoke test**

Run: `npm run develop` and open a project with version control history. Verify each item; fix and re-run checks as needed:

1. Changes tab → "Open Full Diff" opens the new overlay (not the legacy conflict manager).
2. Checkpoint detail → diff opens the new overlay; compare mode → same.
3. A scene diff shows: entity breadcrumb tree (toggles, guide lines, leaf selected with component icon), component panel with orange chevron + icon, paired `−`/`+` rows with red/green tints.
4. Value widgets render read-only: checkbox (ticked state light with dark tick), color swatch, vector with X/Y/Z placeholders, curve strip, gradient for a `colorGraph` change, asset/entity chips with resolved names.
5. Script changes render a nested sub-panel named after the script, attribute labels raw (`speed`, not `Speed`).
6. Scene/project settings render under a `SETTINGS` panel with group sub-panels (`RENDERING`, `PHYSICS`).
7. Whole-entity add/delete shows the banner.
8. A textual asset (script) still renders the embedded code-editor diff iframe with `+N −N` counts.
9. Clicking any widget does nothing (no color picker, no curve editor, no edits).
10. Close the overlay → underlying picker resumes; reopen → renders again (retained-diff lifecycle intact).

- [ ] **Step 3: Commit any fixes**

```bash
git add -A && git commit -m "fix: vc diff picker smoke test fixes"
```

(Skip if no fixes were needed.)

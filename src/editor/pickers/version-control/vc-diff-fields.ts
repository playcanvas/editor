import { BooleanInput, NumericInput, TextAreaInput, TextInput, VectorInput, ColorPicker } from '@playcanvas/pcui';

import { CurveInput } from '@/common/pcui/element/element-curve-input';
import { GradientInput } from '@/common/pcui/element/element-gradient-input';

import { REF_KINDS, valueKind, type NameIndex, type ValueKind } from './vc-diff-data';

const AXES = ['X', 'Y', 'Z', 'W'];
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

const chip = (kind: string, id: unknown, name?: string, state?: 'added' | 'removed') => {
    const c = el('vc-diff-chip');
    if (!name) {
        c.classList.add('missing');
    }
    // membership-delta chips tint themselves (red/green) + carry a +/− sign so a
    // single changed list item doesn't colour its whole row
    if (state) {
        c.classList.add(state);
        c.appendChild(el('sign', state === 'added' ? '+' : '−'));
    }
    // plain pills (tags, device types, any free-value list) pass an empty kind:
    // the value is the whole label
    if (kind) {
        c.appendChild(el('tag', kind === 'batchGroup' ? 'batch group' : kind));
    } else {
        c.classList.add('pill');
    }
    c.appendChild(el('name', name ?? `${id}`));
    c.title = `${id}`;
    return c;
};

// child entities share a path prefix; show only the leaf segment as the name
const entityLeaf = (index: NameIndex, id: unknown) => {
    const full = index.entity.get(`${id}`);
    return typeof full === 'string' ? full.split('/').filter(Boolean).pop() : undefined;
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
    // detached from the pcui hierarchy: start the canvas self-sizing loop manually
    curve.emit('showToRoot');
    return pcuiDom(curve);
};

export const createValueField = (kind: ValueKind, value: any, index: NameIndex): HTMLElement => {
    if (kind.startsWith('array:')) {
        // render each element through the element renderer
        const inner = kind.substring('array:'.length);
        const list = document.createElement('div');
        list.className = 'vc-diff-array';
        const items = Array.isArray(value) ? value : [value];
        if (items.length > 1) {
            list.classList.add('multi');
        }
        list.appendChild(el('size', `${items.length} item${items.length === 1 ? '' : 's'}`));
        for (const item of items) {
            const itemKind = item === undefined || item === null ? 'missing' :
                REF_KINDS.has(inner) ? inner as ValueKind : valueKind(inner, '', item);
            list.appendChild(createValueField(itemKind, item, index));
        }
        return list;
    }
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
            const gradient = new GradientInput({ value, channels: value.keys.length, readOnly: true });
            return pcuiDom(gradient);
        }
        case 'asset':
            return chip('asset', value, index.asset.get(`${value}`));
        case 'entity':
            return chip('entity', value, index.entity.get(`${value}`));
        case 'children': {
            // entity-id list as chips; show only the leaf name (siblings share a path prefix)
            const ids = Array.isArray(value) ? value : [value];
            const list = document.createElement('div');
            list.className = 'vc-diff-array';
            if (ids.length > 1) {
                list.classList.add('multi');
            }
            list.appendChild(el('size', `${ids.length} item${ids.length === 1 ? '' : 's'}`));
            for (const id of ids) {
                list.appendChild(chip('entity', id, entityLeaf(index, id)));
            }
            return list;
        }
        case 'pills': {
            // free-value list (tags, device types, ...): each entry is its own label
            const items = Array.isArray(value) ? value : [value];
            const list = document.createElement('div');
            list.className = 'vc-diff-array';
            if (items.length > 1) {
                list.classList.add('multi');
            }
            list.appendChild(el('size', `${items.length} item${items.length === 1 ? '' : 's'}`));
            for (const t of items) {
                list.appendChild(chip('', t, `${t}`));
            }
            return list;
        }
        case 'layer':
            return chip('layer', value, index.layer.get(`${value}`));
        case 'batchGroup':
            return chip('batchGroup', value, index.batchGroup.get(`${value}`));
        case 'sublayer':
            return sublayerEl(value, index);
        case 'entityMap': {
            // a guid->guid remap conveys nothing actionable inline; show the
            // count and keep the full mapping on hover for anyone who needs it
            const n = Object.keys(value as object).length;
            const summary = el('vc-diff-entity-map', `${n} entit${n === 1 ? 'y' : 'ies'}`);
            summary.title = JSON.stringify(value, null, 2);
            return summary;
        }
        case 'object':
            return missingEl('no preview available');
        case 'json': {
            // height cap keeps huge blobs from dominating the panel; the textarea scrolls
            const area = new TextAreaInput({ value: JSON.stringify(value, null, 2), readOnly: true, height: JSON_FIELD_HEIGHT });
            return pcuiDom(area);
        }
        default:
            return missingEl('no preview available');
    }
};

// a list field (entity children / asset-id list) whose membership changed:
// removed items tinted red, added tinted green, in ONE neutral list so the
// surrounding row isn't coloured as if the whole property were added/removed
export const createDeltaListField = (kind: 'children' | 'array:asset' | 'pills', removed: any[], added: any[], index: NameIndex): HTMLElement => {
    const list = document.createElement('div');
    list.className = 'vc-diff-array';
    if (removed.length + added.length > 1) {
        list.classList.add('multi');
    }
    const summary = [];
    if (removed.length) {
        summary.push(`−${removed.length}`);
    }
    if (added.length) {
        summary.push(`+${added.length}`);
    }
    list.appendChild(el('size', summary.join('   ')));
    const refChip = (id: unknown, state: 'added' | 'removed') => {
        if (kind === 'children') {
            return chip('entity', id, entityLeaf(index, id), state);
        }
        if (kind === 'pills') {
            return chip('', id, `${id}`, state);
        }
        return chip('asset', id, index.asset.get(`${id}`), state);
    };
    for (const id of removed) {
        list.appendChild(refChip(id, 'removed'));
    }
    for (const id of added) {
        list.appendChild(refChip(id, 'added'));
    }
    return list;
};

// pcui widgets hold timers (curve/gradient resize loops); destroy before discarding their dom
export const destroyValueFields = (root: HTMLElement) => {
    for (const node of Array.from(root.querySelectorAll('.vc-diff-widget'))) {
        ((node as { ui?: { destroy?: () => void } }).ui)?.destroy?.();
    }
};

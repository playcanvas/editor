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

// pcui widgets hold timers (curve/gradient resize loops); destroy before discarding their dom
export const destroyValueFields = (root: HTMLElement) => {
    for (const node of Array.from(root.querySelectorAll('.vc-diff-widget'))) {
        ((node as { ui?: { destroy?: () => void } }).ui)?.destroy?.();
    }
};

import { Element, ArrayInput } from '@playcanvas/pcui';

const DEFAULTS = {
    boolean: false,
    number: 0,
    slider: 0,
    string: '',
    json: {},
    asset: null,
    entity: null,
    rgb: [1, 1, 1],
    rgba: [1, 1, 1, 1],
    vec2: [0, 0],
    vec3: [0, 0, 0],
    vec4: [0, 0, 0, 0],
    curve: { keys: [0, 0], type: 4 },
    curveset: { keys: [], type: 4 },
    gradient: { type: 4, keys: [], betweenCurves: false }
};

for (const name in DEFAULTS) {
    if (!ArrayInput.DEFAULTS.hasOwnProperty(name)) {
        Element.register(`array:${name}`, ArrayInput, { type: name, renderChanges: true });
    }
    ArrayInput.DEFAULTS[name] = window.utils.deepCopy(DEFAULTS[name]);
}

const pcui = {};

Object.assign(pcui,
    {
        CLASS_FLEX: 'pcui-flex',
        CLASS_GRID: 'pcui-grid',
        CLASS_HIDDEN: 'pcui-hidden',
        CLASS_SCROLLABLE: 'pcui-scrollable',
        CLASS_RESIZABLE: 'pcui-resizable',
        CLASS_READONLY: 'pcui-readonly',
        CLASS_DISABLED: 'pcui-disabled',
        CLASS_COLLAPSIBLE: 'pcui-collapsible',
        CLASS_COLLAPSED: 'pcui-collapsed',
        CLASS_FOCUS: 'pcui-focus',
        CLASS_MULTIPLE_VALUES: 'pcui-multiple-values',
        CLASS_ERROR: 'pcui-error',
        CLASS_FLASH: 'flash',
        CLASS_NOT_FLEXIBLE: 'pcui-not-flexible',
        CLASS_DEFAULT_MOUSEDOWN: 'pcui-default-mousedown',
        DEFAULTS: DEFAULTS
    }
);

window.pcui = pcui;
